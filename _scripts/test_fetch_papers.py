#!/usr/bin/env python3
"""Offline tests for fetch_papers.py. Run: python3 _scripts/test_fetch_papers.py"""

import gzip
import importlib.util
import io
import json
import os
import tempfile
import time
import unittest
import unittest.mock
import urllib.error
import zlib
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    'fetch_papers', Path(__file__).with_name('fetch_papers.py'))
fp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(fp)


class AuthorMatching(unittest.TestCase):
    """Author strings below are real values from the arXiv atom feed."""

    def test_matches_the_names_we_track(self):
        for author, first, last in [
            ('Tianxi Cai', 'Tianxi', 'Cai'),
            ('Tianxi X. Cai', 'Tianxi', 'Cai'),
            ('Zheng Tracy Ke', 'Tracy', 'Ke'),   # 43 of her 47 arXiv papers
            ('Tracy Ke', 'Tracy', 'Ke'),         # the other 4
            ('Weijie J. Su', 'Weijie', 'Su'),
            ('Molei  Liu', 'Molei', 'Liu'),
            ('Fang Yao', 'Fang', 'Yao'),
        ]:
            with self.subTest(author=author):
                self.assertTrue(fp.matches_author(author, first, last))

    def test_rejects_other_people(self):
        for author, first, last in [
            ('Fanglong Yao', 'Fang', 'Yao'),     # different person, same surname
            ('Qiuran Yao', 'Fang', 'Yao'),
            ('Nan Lu', 'Junwei', 'Lu'),
            ('Zhe Wang', 'Kewei', 'Wang'),
            ('Kewei Wangzhou', 'Kewei', 'Wang'),  # surname must be the tail
        ]:
            with self.subTest(author=author):
                self.assertFalse(fp.matches_author(author, first, last))

    def test_rejects_partial_names(self):
        """The old substring check matched a bare 'Tracy'; a full name should not."""
        for author in ('T. Cai', 'Cai', 'Tianxi'):
            with self.subTest(author=author):
                self.assertFalse(fp.matches_author(author, 'Tianxi', 'Cai'))
        self.assertFalse(fp.matches_author('Tracy', 'Tracy', 'Ke'))
        self.assertFalse(fp.matches_author('Ke', 'Tracy', 'Ke'))

    def test_ignores_accents(self):
        self.assertTrue(fp.matches_author('Rui Duán', 'Rui', 'Duan'))

    def test_every_tracked_author_matches_their_own_display_name(self):
        for first, last in fp.TRACKED_AUTHORS:
            with self.subTest(author=f'{first} {last}'):
                self.assertTrue(fp.matches_author(f'{first} {last}', first, last))


class KeepPaper(unittest.TestCase):

    def paper(self, **kw):
        base = {'title': '', 'abstract': '', 'authors': [],
                'categories': [], 'primary_category': ''}
        base.update(kw)
        return base

    def test_topic_needs_a_listed_category(self):
        on_topic = self.paper(title='Transfer Learning for X', categories=['stat.ML'])
        self.assertEqual(fp.keep_paper(on_topic), ['topic:transfer learning'])
        off_category = self.paper(title='Transfer Learning for X', categories=['cs.CV'])
        self.assertEqual(fp.keep_paper(off_category), [])

    def test_topic_list_drives_both_query_and_filter(self):
        """Regression: the query searched for transfer learning while the local
        filter only kept 'distributionally robust', discarding 64 of every 100
        fetched papers."""
        query = fp.build_topic_query()
        for topic in fp.TOPICS:
            self.assertIn(f'abs:"{topic}"', query)
            kept = fp.keep_paper(self.paper(abstract=f'We study {topic} here.',
                                            categories=['stat.ME']))
            self.assertEqual(kept, [f'topic:{topic}'])

    def test_author_needs_an_allowed_primary_category(self):
        good = self.paper(authors=['Tianxi Cai'], primary_category='stat.ME')
        self.assertEqual(fp.keep_paper(good), ['author:Tianxi Cai'])
        bad = self.paper(authors=['Tianxi Cai'], primary_category='astro-ph.GA')
        self.assertEqual(fp.keep_paper(bad), [])

    def test_per_author_override_excludes_a_homonym(self):
        """A second Junwei Lu publishes math.PR; the tracked one does not."""
        self.assertIn('Junwei Lu', fp.AUTHOR_CATEGORY_OVERRIDES)
        homonym = self.paper(authors=['Junwei Lu'], primary_category='math.PR')
        self.assertEqual(fp.keep_paper(homonym), [])
        # math.PR stays allowed for authors without an override.
        self.assertEqual(fp.keep_paper(self.paper(authors=['Zheng Tracy Ke'],
                                                  primary_category='math.PR')),
                         ['author:Tracy Ke'])

    def test_badges_only_list_reasons_that_passed(self):
        mixed = self.paper(title='Transfer Learning', authors=['Junwei Lu'],
                           categories=['stat.ML'], primary_category='math.PR')
        self.assertEqual(fp.keep_paper(mixed), ['topic:transfer learning'])

    def test_reports_several_reasons(self):
        both = self.paper(title='Distributionally Robust Transfer Learning',
                          authors=['Tianxi Cai', 'Molei Liu'],
                          categories=['stat.ME'], primary_category='stat.ME')
        self.assertEqual(fp.keep_paper(both), [
            'topic:transfer learning', 'topic:distributionally robust',
            'author:Tianxi Cai', 'author:Molei Liu'])


class Queries(unittest.TestCase):

    def test_author_query_uses_the_form_arxiv_indexes(self):
        """`au:"Family, Given"`. The old code emitted `au:"Tianxi, Cai,"`."""
        query = fp.build_author_query()
        for first, last in fp.TRACKED_AUTHORS:
            self.assertIn(f'au:"{last}, {first}"', query)
        self.assertNotIn(',"', query.replace('", ', '').replace(', ', ', '))

    def test_no_malformed_author_terms(self):
        for term in fp.build_author_query().split(' OR '):
            self.assertEqual(term.count(','), 1, term)
            self.assertFalse(term.endswith(',"'), term)

    def test_topic_query_restricts_categories(self):
        query = fp.build_topic_query()
        self.assertIn(' AND (', query)
        for category in fp.TOPIC_CATEGORIES:
            self.assertIn(f'cat:{category}', query)


class Storage(unittest.TestCase):

    def test_missing_file_is_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(fp.load_papers(os.path.join(tmp, 'nope.json')), [])

    def test_unreadable_file_raises_instead_of_wiping_the_archive(self):
        """Regression: `load_archive() or []` turned a parse error into an
        empty archive, which the next save would commit and push."""
        with tempfile.TemporaryDirectory() as tmp:
            broken = os.path.join(tmp, 'broken.json')
            Path(broken).write_text('{"papers": [ truncated')
            with self.assertRaises(json.JSONDecodeError):
                fp.load_papers(broken)

            wrong_shape = os.path.join(tmp, 'wrong.json')
            Path(wrong_shape).write_text('{"papers": "not a list"}')
            with self.assertRaises(ValueError):
                fp.load_papers(wrong_shape)

    def test_round_trip(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, 'sub', 'papers.json')
            fp.save_papers(path, [{'arxiv_id': '1', 'title': 'Ré'}], 'last_fetch_timestamp')
            self.assertEqual(fp.load_papers(path), [{'arxiv_id': '1', 'title': 'Ré'}])
            with open(path) as f:
                self.assertIn('last_fetch_timestamp', json.load(f))


class Ids(unittest.TestCase):

    def test_strips_the_version_suffix(self):
        for url, expected in [
            ('http://arxiv.org/abs/2608.13133v2', '2608.13133'),
            ('http://arxiv.org/abs/2608.13133', '2608.13133'),
            ('http://arxiv.org/abs/math/0309136v1', 'math/0309136'),
            ('http://arxiv.org/abs/cond-mat/0605035v11', 'cond-mat/0605035'),
        ]:
            with self.subTest(url=url):
                self.assertEqual(fp.extract_arxiv_id(url), expected)

    def test_does_not_cut_at_a_letter_v(self):
        """`split('v')[0]` truncated any id whose category contained a v."""
        self.assertEqual(fp.extract_arxiv_id('http://arxiv.org/abs/nlin/0402019v2'),
                         'nlin/0402019')

    def test_empty(self):
        self.assertEqual(fp.extract_arxiv_id(''), '')


class Retention(unittest.TestCase):

    def test_window_is_keyed_off_the_submission_date(self):
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=fp.PAPER_RETENTION_DAYS)
        fresh = {'published_raw': (now - timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%SZ')}
        old = {'published_raw': (now - timedelta(days=90)).strftime('%Y-%m-%dT%H:%M:%SZ')}
        self.assertTrue(fp.is_active(fresh, cutoff))
        self.assertFalse(fp.is_active(old, cutoff))

    def test_unparseable_date_stays_visible(self):
        from datetime import datetime, timezone
        self.assertTrue(fp.is_active({'published_raw': ''}, datetime.now(timezone.utc)))


class Parsing(unittest.TestCase):

    FEED = '''<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
      <entry>
        <id>http://arxiv.org/abs/2608.13133v1</id>
        <published>2026-08-13T10:00:00Z</published>
        <updated>2026-08-20T10:00:00Z</updated>
        <title>Transfer Learning
          with a "quoted" phrase</title>
        <summary>An abstract mentioning transfer learning.</summary>
        <author><name>Zheng Tracy Ke</name></author>
        <author><name>Fanglong Yao</name></author>
        <link href="http://arxiv.org/abs/2608.13133v1" rel="alternate"/>
        <link href="http://arxiv.org/pdf/2608.13133v1" rel="related" title="pdf"/>
        <category term="stat.ML"/>
        <category term="cs.LG"/>
        <arxiv:primary_category term="stat.ML"/>
      </entry>
      <entry>
        <id>http://arxiv.org/abs/2608.99999v1</id>
        <title>Missing its abstract</title>
        <published>2026-08-13T10:00:00Z</published>
      </entry>
    </feed>'''

    def test_parses_one_entry_and_skips_the_incomplete_one(self):
        entries = fp.parse_entries(self.FEED)
        self.assertEqual(len(entries), 1)
        entry = entries[0]
        self.assertEqual(entry['arxiv_id'], '2608.13133')
        self.assertEqual(entry['title'], 'Transfer Learning with a "quoted" phrase')
        self.assertEqual(entry['primary_category'], 'stat.ML')
        self.assertEqual(entry['categories'], ['stat.ML', 'cs.LG'])
        self.assertEqual(entry['pdf_link'], 'http://arxiv.org/pdf/2608.13133v1')
        self.assertEqual(entry['published'], 'August 13, 2026')

    def test_keeps_the_right_author_from_a_mixed_list(self):
        entry = fp.parse_entries(self.FEED)[0]
        self.assertEqual(fp.keep_paper(entry),
                         ['topic:transfer learning', 'author:Tracy Ke'])


class FakeClock:
    """Stands in for the time module so retry tests run instantly."""

    def __init__(self):
        self.now = 1000.0
        self.slept = []

    def monotonic(self):
        return self.now

    def time(self):
        return self.now

    def sleep(self, seconds):
        self.slept.append(seconds)
        self.now += seconds


class FakeResponse:
    def __init__(self, body, headers=None):
        self._body = body
        self.headers = headers or {}

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def http_error(code, headers=None, body=b''):
    return urllib.error.HTTPError(
        'https://export.arxiv.org/api/query', code, 'refused',
        headers or {}, io.BytesIO(body))


class ResponseDecoding(unittest.TestCase):
    """We ask for gzip, so we have to be able to undo it."""

    XML = '<?xml version="1.0"?><feed/>'

    def test_identity(self):
        self.assertEqual(fp.read_body(FakeResponse(self.XML.encode())), self.XML)

    def test_gzip(self):
        body = gzip.compress(self.XML.encode())
        response = FakeResponse(body, {'Content-Encoding': 'gzip'})
        self.assertEqual(fp.read_body(response), self.XML)

    def test_deflate_with_and_without_header(self):
        raw = zlib.compressobj(wbits=-zlib.MAX_WBITS)
        bodies = [
            zlib.compress(self.XML.encode()),                        # zlib-wrapped
            raw.compress(self.XML.encode()) + raw.flush(),           # bare deflate
        ]
        for body in bodies:
            response = FakeResponse(body, {'Content-Encoding': 'deflate'})
            self.assertEqual(fp.read_body(response), self.XML)

    def test_retry_after_header(self):
        self.assertEqual(fp.retry_after(http_error(429, {'Retry-After': '45'})), 45)
        self.assertIsNone(fp.retry_after(http_error(406, {})))
        self.assertIsNone(fp.retry_after(http_error(429, {'Retry-After': 'soon'})))
        # A server asking us to wait an hour should not park the job there.
        self.assertEqual(fp.retry_after(http_error(429, {'Retry-After': '99999'})),
                         fp.MAX_RETRY_AFTER)


class RetryPolicy(unittest.TestCase):
    """arXiv answers valid requests with 406 when it is shedding load."""

    def setUp(self):
        self.clock = FakeClock()
        self.real_time = fp.time
        fp.time = self.clock
        fp._last_request_at = 0.0
        self.addCleanup(setattr, fp, 'time', self.real_time)

    def call(self, responses):
        """Run api_get against a scripted sequence of outcomes."""
        self.attempts = 0

        def fake_urlopen(request, timeout=None):
            outcome = responses[min(self.attempts, len(responses) - 1)]
            self.attempts += 1
            if isinstance(outcome, Exception):
                raise outcome
            return FakeResponse(outcome)

        with unittest.mock.patch.object(fp.urllib.request, 'urlopen', fake_urlopen):
            return fp.api_get({'search_query': 'cat:stat.ME', 'max_results': '1'})

    def test_succeeds_on_the_first_try(self):
        self.assertEqual(self.call([b'<feed/>']), '<feed/>')
        self.assertEqual(self.attempts, 1)
        self.assertEqual(self.clock.slept, [])

    def test_recovers_from_a_run_of_406s(self):
        """The 2026-09-17 run was refused four times and served on the fifth."""
        self.assertEqual(self.call([http_error(406)] * 4 + [b'<feed/>']), '<feed/>')
        self.assertEqual(self.attempts, 5)

    def test_keeps_trying_far_longer_than_the_old_five_attempts(self):
        """Eight scheduled runs died because 5 attempts fit in 7.5 minutes."""
        with self.assertRaises(fp.ArxivUnavailable):
            self.call([http_error(406)])
        self.assertGreater(self.attempts, 15)

    def test_stops_at_the_budget(self):
        with self.assertRaises(fp.ArxivUnavailable) as caught:
            self.call([http_error(406)])
        self.assertLessEqual(sum(self.clock.slept), fp.RETRY_BUDGET_SECONDS + 1)
        self.assertIn('406', str(caught.exception))

    def test_delay_is_capped(self):
        with self.assertRaises(fp.ArxivUnavailable):
            self.call([http_error(503)])
        # Jitter adds up to 3s on top of the cap.
        self.assertLessEqual(max(self.clock.slept), fp.RETRY_MAX_DELAY + 3)

    def test_network_errors_retry_too(self):
        outcomes = [urllib.error.URLError('dns'), TimeoutError('slow'), b'<feed/>']
        self.assertEqual(self.call(outcomes), '<feed/>')
        self.assertEqual(self.attempts, 3)


class FailureReporting(unittest.TestCase):
    """A refused run is routine; a run refused for days is a real problem."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.cache = os.path.join(self.tmp.name, 'arxiv_cache.json')
        self.real_cache = fp.CACHE_FILE
        fp.CACHE_FILE = self.cache
        self.addCleanup(setattr, fp, 'CACHE_FILE', self.real_cache)

    def write_cache(self, days_old):
        stamp = int(time.time() - days_old * 86400)
        Path(self.cache).write_text(json.dumps(
            {'last_fetch_timestamp': stamp, 'papers': []}))

    def test_days_since_last_fetch(self):
        self.write_cache(2.5)
        self.assertAlmostEqual(fp.days_since_last_fetch(), 2.5, places=2)

    def test_missing_or_unreadable_cache_reads_as_unknown(self):
        self.assertIsNone(fp.days_since_last_fetch())
        Path(self.cache).write_text('{ truncated')
        self.assertIsNone(fp.days_since_last_fetch())
        Path(self.cache).write_text('{"papers": []}')
        self.assertIsNone(fp.days_since_last_fetch())

    def test_a_single_refused_run_is_not_a_failure(self):
        """Otherwise every morning brings a red run and the mail gets ignored."""
        self.write_cache(0.5)
        self.assertEqual(fp.refused_everything(), 0)

    def test_still_not_a_failure_just_under_the_limit(self):
        self.write_cache(fp.STALE_ALERT_DAYS - 0.5)
        self.assertEqual(fp.refused_everything(), 0)

    def test_fails_once_the_data_has_gone_stale(self):
        self.write_cache(fp.STALE_ALERT_DAYS + 1)
        self.assertEqual(fp.refused_everything(), 1)

    def test_fails_when_the_age_cannot_be_established(self):
        self.assertEqual(fp.refused_everything(), 1)


class PartialFetch(unittest.TestCase):
    """One query getting through is better than discarding the whole run."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        for name, attr in (('arxiv_cache.json', 'CACHE_FILE'),
                           ('arxiv_archive.json', 'ARCHIVE_FILE')):
            path = os.path.join(self.tmp.name, name)
            Path(path).write_text(json.dumps({'papers': []}))
            self.addCleanup(setattr, fp, attr, getattr(fp, attr))
            setattr(fp, attr, path)

    def run_main(self, topics_ok, authors_ok):
        paper = {
            'arxiv_id': '2609.00001', 'title': 'Transfer learning study',
            'authors': ['Tianxi Cai'], 'abstract': 'On transfer learning.',
            'published': 'September 1, 2026', 'published_raw': '2026-09-01T00:00:00Z',
            'updated_raw': '', 'categories': ['stat.ME'], 'primary_category': 'stat.ME',
            'pdf_link': 'http://p', 'arxiv_url': 'http://a',
        }

        def fake_fetch(query, label):
            ok = topics_ok if label == 'topics' else authors_ok
            if not ok:
                raise fp.ArxivUnavailable(f'HTTP 406 for {label}')
            return [dict(paper, arxiv_id=f'{paper["arxiv_id"]}-{label}')]

        with unittest.mock.patch.object(fp, 'fetch_query', fake_fetch):
            return fp.main()

    def stored(self):
        return fp.load_papers(fp.CACHE_FILE)

    def test_both_queries_succeed(self):
        self.assertEqual(self.run_main(True, True), 0)
        self.assertEqual(len(self.stored()), 2)

    def test_one_query_refused_still_writes_the_other(self):
        self.assertEqual(self.run_main(True, False), 0)
        self.assertEqual([p['arxiv_id'] for p in self.stored()], ['2609.00001-topics'])

    def test_other_direction(self):
        self.assertEqual(self.run_main(False, True), 0)
        self.assertEqual([p['arxiv_id'] for p in self.stored()], ['2609.00001-authors'])

    def test_both_refused_writes_nothing(self):
        before = Path(fp.CACHE_FILE).read_text()
        self.run_main(False, False)
        self.assertEqual(Path(fp.CACHE_FILE).read_text(), before)


if __name__ == '__main__':
    unittest.main(verbosity=2)
