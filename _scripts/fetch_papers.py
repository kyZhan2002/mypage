#!/usr/bin/env python3
"""Fetch new arXiv papers matching tracked topics and tracked authors.

Run daily by .github/workflows/update-papers.yml. Writes two files:

    _data/arxiv_cache.json     papers published within PAPER_RETENTION_DAYS
    _data/arxiv_archive.json   everything older, kept indefinitely

Exits non-zero when arXiv could not be reached, so a broken pipeline shows
up as a red Actions run instead of a silent no-op.
"""

import json
import os
import random
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

CACHE_FILE = '_data/arxiv_cache.json'
ARCHIVE_FILE = '_data/arxiv_archive.json'

# A paper is shown on /papers/ while its arXiv submission date is within this
# window, and lives in the archive after that. Keying off the submission date
# (rather than when we happened to fetch it) means a backfill after an outage
# lands in the archive instead of flooding the front page.
PAPER_RETENTION_DAYS = 30

# ---------------------------------------------------------------------------
# What to track
# ---------------------------------------------------------------------------

# Matched as exact phrases against the title and abstract. The arXiv query and
# the local check are both generated from this list so they cannot drift apart.
TOPICS = [
    'transfer learning',
    'distributionally robust',
]

# The topic feed is restricted to these categories inside the arXiv query.
# Without it, "transfer learning" is dominated by cs.CV/cs.LG applications:
# 2.6 papers/day unfiltered vs 0.44/day here, and the same 100-result page
# covers 226 days of submissions instead of 39.
TOPIC_CATEGORIES = [
    'stat.ML', 'stat.ME', 'stat.TH', 'stat.AP', 'stat.CO', 'math.ST', 'econ.EM',
]

# Tracked authors as (given name, family name).
#
# arXiv indexes authors as "Family, Given" and that is the query form used
# below; `au:"Given Family"` returns an identical result set, and the
# `au:Family_G_1` form returns nothing at all.
#
# The local check is a full-name match: the family name must match the tail of
# the author string and the given name must be one of the remaining tokens.
# So "Zheng Tracy Ke" matches ('Tracy', 'Ke') -- which is how Tracy Ke
# publishes 43 of her 47 arXiv papers -- and "Weijie J. Su" matches
# ('Weijie', 'Su'), while "Fanglong Yao" does not match ('Fang', 'Yao') and a
# bare initial like "T. Cai" does not match ('Tianxi', 'Cai').
TRACKED_AUTHORS = [
    ('Tianxi', 'Cai'),
    ('Junwei', 'Lu'),
    ('Molei', 'Liu'),
    ('Weijie', 'Su'),
    ('Rui', 'Duan'),
    ('Tracy', 'Ke'),
    ('Fang', 'Yao'),
]

# An author-matched paper is kept only if its primary category is listed here.
# Full-name matching cannot separate people who share a name, and the primary
# category is what tells them apart.
AUTHOR_PRIMARY_CATEGORIES = [
    'stat.ML', 'stat.ME', 'stat.TH', 'stat.AP', 'stat.CO', 'stat.OT',
    'math.ST', 'math.PR', 'math.OC',
    'cs.LG', 'cs.AI', 'cs.CL', 'cs.SI',
    'econ.EM', 'q-bio.QM', 'q-fin.ST', 'q-fin.MF', 'q-fin.PM',
]

# Narrower lists for names that collide with someone prolific, replacing the
# list above for that author only. Keyed by "Given Family".
#
# If a tracked author starts showing up with unrelated papers, add them here
# rather than narrowing the global list -- the site shows which author matched
# each paper, so the offending name is visible on the page.
AUTHOR_CATEGORY_OVERRIDES = {
    # A second Junwei Lu publishes combinatorics and geometry (math.CO,
    # math.DG, math.PR); the tracked one works on EHR data and inference.
    'Junwei Lu': ['stat.ML', 'stat.ME', 'stat.TH', 'stat.AP', 'math.ST', 'cs.LG', 'cs.AI'],
}

# ---------------------------------------------------------------------------
# API access
# ---------------------------------------------------------------------------

API_URL = 'https://export.arxiv.org/api/query'
HEADERS = {'User-Agent': 'mypage-paper-fetcher (+https://github.com/kyZhan2002/mypage; mailto:kzhan@g.harvard.edu)'}
REQUEST_TIMEOUT = 60

# arXiv asks for at least 3 seconds between API calls.
REQUEST_SPACING = 3.0

# GitHub Actions runners share egress IPs, so arXiv returns 429 often. The old
# 3 x 5s retry gave up inside 15 seconds and ~80% of daily runs fetched nothing.
MAX_RETRIES = 5
BACKOFF_SECONDS = [30, 60, 120, 240]
MAX_RETRY_AFTER = 300

PAGE_SIZE = 100
MAX_PAGES = 3
# Keep paging back this far. One page normally covers far more than this, so
# the usual run makes a single request per query.
LOOKBACK_DAYS = 60

NS = {
    'atom': 'http://www.w3.org/2005/Atom',
    'arxiv': 'http://arxiv.org/schemas/atom',
    'opensearch': 'http://a9.com/-/spec/opensearch/1.1/',
}

_last_request_at = 0.0


class ArxivUnavailable(RuntimeError):
    """Every retry against the arXiv API failed."""


def _throttle():
    global _last_request_at
    wait = REQUEST_SPACING - (time.monotonic() - _last_request_at)
    if wait > 0:
        time.sleep(wait)
    _last_request_at = time.monotonic()


def api_get(params):
    """GET one page from the arXiv API, retrying with exponential backoff."""
    query = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    url = f'{API_URL}?{query}'

    for attempt in range(MAX_RETRIES):
        _throttle()
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                return response.read().decode('utf-8')
        except urllib.error.HTTPError as err:
            reason = f'HTTP {err.code}'
            # arXiv sends Retry-After on 429; honour it when it is sane.
            hinted = err.headers.get('Retry-After') if err.headers else None
            delay = None
            if hinted and hinted.strip().isdigit():
                delay = min(int(hinted.strip()), MAX_RETRY_AFTER)
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            reason = f'{type(err).__name__}: {err}'
            delay = None

        if attempt == MAX_RETRIES - 1:
            raise ArxivUnavailable(f'{reason} after {MAX_RETRIES} attempts: {url}')

        if delay is None:
            delay = BACKOFF_SECONDS[min(attempt, len(BACKOFF_SECONDS) - 1)]
        delay += random.uniform(0, 5)
        print(f'  {reason}, retrying in {delay:.0f}s ({attempt + 1}/{MAX_RETRIES})', flush=True)
        time.sleep(delay)


def parse_entries(xml_data):
    """Turn one API response into a list of raw entry dicts."""
    root = ET.fromstring(xml_data)
    entries = []
    for entry in root.findall('atom:entry', NS):
        title = entry.findtext('atom:title', default='', namespaces=NS).strip()
        abstract = entry.findtext('atom:summary', default='', namespaces=NS).strip()
        published = entry.findtext('atom:published', default='', namespaces=NS).strip()
        if not (title and abstract and published):
            continue

        primary = entry.find('arxiv:primary_category', NS)
        links = entry.findall('atom:link', NS)
        abs_url = next((l.get('href') for l in links if l.get('rel') == 'alternate'), '')

        entries.append({
            'arxiv_id': extract_arxiv_id(abs_url) or entry.findtext('atom:id', default='', namespaces=NS),
            'title': ' '.join(title.split()),
            'authors': [a.findtext('atom:name', default='', namespaces=NS).strip()
                        for a in entry.findall('atom:author', NS)],
            'abstract': ' '.join(abstract.split()),
            'published': format_date(published),
            'published_raw': published,
            'updated_raw': entry.findtext('atom:updated', default='', namespaces=NS).strip(),
            'categories': [c.get('term') for c in entry.findall('atom:category', NS) if c.get('term')],
            'primary_category': primary.get('term') if primary is not None else '',
            'pdf_link': next((l.get('href') for l in links if l.get('title') == 'pdf'), ''),
            'arxiv_url': abs_url,
        })
    return entries


def fetch_query(search_query, label):
    """Page through one search query until results fall outside LOOKBACK_DAYS."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    collected = []

    for page in range(MAX_PAGES):
        params = {
            'search_query': search_query,
            'start': str(page * PAGE_SIZE),
            'max_results': str(PAGE_SIZE),
            'sortBy': 'submittedDate',
            'sortOrder': 'descending',
        }
        entries = parse_entries(api_get(params))
        collected.extend(entries)
        print(f'  [{label}] page {page + 1}: {len(entries)} entries', flush=True)

        if len(entries) < PAGE_SIZE:
            break
        oldest = min((parse_timestamp(e['published_raw']) for e in entries
                      if parse_timestamp(e['published_raw'])), default=None)
        if oldest and oldest < cutoff:
            break

    return collected


def build_topic_query():
    phrases = ' OR '.join(f'ti:"{t}" OR abs:"{t}"' for t in TOPICS)
    categories = ' OR '.join(f'cat:{c}' for c in TOPIC_CATEGORIES)
    return f'({phrases}) AND ({categories})'


def build_author_query():
    return ' OR '.join(f'au:"{last}, {first}"' for first, last in TRACKED_AUTHORS)


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

def name_tokens(name):
    """Lowercase alphabetic tokens of a name, with accents and initials stripped."""
    decomposed = unicodedata.normalize('NFKD', name)
    stripped = ''.join(c for c in decomposed if not unicodedata.combining(c))
    return re.sub(r'[^a-z]+', ' ', stripped.lower()).split()


def matches_author(author_string, first, last):
    """True when author_string is a full-name match for (first, last)."""
    tokens = name_tokens(author_string)
    family = name_tokens(last)
    given = name_tokens(first)
    if not tokens or not family or not given:
        return False
    if len(tokens) <= len(family) or tokens[-len(family):] != family:
        return False
    remaining = tokens[:-len(family)]
    return all(token in remaining for token in given)


def match_reasons(paper):
    """Provenance labels for why this paper is on the page."""
    haystack = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
    reasons = [f'topic:{t}' for t in TOPICS if t in haystack]
    for first, last in TRACKED_AUTHORS:
        if any(matches_author(a, first, last) for a in paper.get('authors', [])):
            reasons.append(f'author:{first} {last}')
    return reasons


def keep_paper(paper):
    """Return the match reasons that survive category filtering, or [].

    A reason that fails its own category test is dropped even when another
    reason keeps the paper, so the badges shown on the site stay truthful.
    """
    primary = paper.get('primary_category', '')
    categories = paper.get('categories', [])

    kept = []
    for reason in match_reasons(paper):
        label, value = reason.split(':', 1)
        if label == 'topic':
            if any(c in TOPIC_CATEGORIES for c in categories):
                kept.append(reason)
        else:
            allowed = AUTHOR_CATEGORY_OVERRIDES.get(value, AUTHOR_PRIMARY_CATEGORIES)
            if primary in allowed:
                kept.append(reason)
    return kept


# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------

def parse_timestamp(value):
    try:
        return datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return None


def format_date(value):
    parsed = parse_timestamp(value)
    return parsed.strftime('%B %d, %Y') if parsed else value


# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------

def extract_arxiv_id(abs_url):
    """'http://arxiv.org/abs/2608.13133v2' -> '2608.13133'."""
    if not abs_url:
        return ''
    tail = abs_url.rstrip('/').split('/abs/')[-1]
    return re.sub(r'v\d+$', '', tail)


def load_papers(path):
    """Load a data file. Missing is fine; unreadable is not.

    The previous `load_x() or []` swallowed read errors, which meant one
    unparseable archive would be silently overwritten with a single day of
    papers -- and then committed and pushed.
    """
    if not os.path.exists(path):
        return []
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    papers = data.get('papers')
    if not isinstance(papers, list):
        raise ValueError(f'{path}: "papers" is missing or not a list')
    return papers


def save_papers(path, papers, timestamp_key):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    payload = {timestamp_key: int(time.time()), 'papers': papers}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f'Wrote {len(papers)} papers to {path}', flush=True)


def is_active(paper, cutoff):
    published = parse_timestamp(paper.get('published_raw', ''))
    return published is None or published >= cutoff


def main():
    print(f'Topics:  {build_topic_query()}')
    print(f'Authors: {build_author_query()}', flush=True)

    try:
        raw = fetch_query(build_topic_query(), 'topics')
        raw += fetch_query(build_author_query(), 'authors')
    except ArxivUnavailable as err:
        print(f'ERROR: arXiv API unavailable -- {err}', file=sys.stderr)
        print('Leaving _data untouched.', file=sys.stderr)
        return 1

    fetched = {}
    for entry in raw:
        reasons = keep_paper(entry)
        if not reasons or not entry['arxiv_id']:
            continue
        entry['matched_by'] = reasons
        fetched.setdefault(entry['arxiv_id'], entry)
    print(f'Fetched {len(raw)} entries, {len(fetched)} relevant and unique', flush=True)

    try:
        active = load_papers(CACHE_FILE)
        archived = load_papers(ARCHIVE_FILE)
    except (json.JSONDecodeError, ValueError, OSError) as err:
        print(f'ERROR: cannot read stored papers -- {err}', file=sys.stderr)
        print('Refusing to overwrite _data with a partial result.', file=sys.stderr)
        return 1
    known = {p.get('arxiv_id') for p in active} | {p.get('arxiv_id') for p in archived}

    now = int(time.time())
    added = [p for arxiv_id, p in fetched.items() if arxiv_id not in known]
    for paper in added:
        paper['added_timestamp'] = now

    # Recomputed rather than backfilled, so edits to TOPICS or
    # TRACKED_AUTHORS reach papers that were already collected. Papers that
    # no longer match anything are kept -- the record of what was published
    # stands -- they just stop showing a badge.
    for paper in active + archived:
        paper['matched_by'] = match_reasons(paper)

    cutoff = datetime.now(timezone.utc) - timedelta(days=PAPER_RETENTION_DAYS)
    # Deduplicate by id: the previous script could leave a paper in the cache
    # after also writing it to the archive.
    pool = list({p.get('arxiv_id'): p for p in active + archived + added}.values())
    still_active = [p for p in pool if is_active(p, cutoff)]
    now_archived = [p for p in pool if not is_active(p, cutoff)]

    for paper in now_archived:
        paper.setdefault('archived_timestamp', now)

    sort_key = lambda p: p.get('published_raw', '')
    still_active.sort(key=sort_key, reverse=True)
    now_archived.sort(key=sort_key, reverse=True)

    print(f'{len(added)} new, {len(still_active)} active, {len(now_archived)} archived', flush=True)
    for paper in sorted(added, key=sort_key, reverse=True):
        print(f"  + {paper['arxiv_id']}  {', '.join(paper['matched_by'])}  {paper['title'][:70]}")

    # Both files are written on every successful run, so the timestamps always
    # reflect the last time arXiv was actually reached.
    save_papers(CACHE_FILE, still_active, 'last_fetch_timestamp')
    save_papers(ARCHIVE_FILE, now_archived, 'last_updated')
    return 0


if __name__ == '__main__':
    sys.exit(main())
