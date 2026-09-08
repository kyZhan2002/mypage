#!/usr/bin/env python3
"""Inspect how an author actually appears on arXiv, before tracking them.

    python3 _scripts/check_author.py Tianxi Cai

Prints every signature sharing that surname among the author's 100 most
recent papers, and the primary categories those papers sit in. Two things to
look for:

  * Signature variants. Tracy Ke publishes as "Zheng Tracy Ke" on 43 of her
    47 papers, so ('Tracy', 'Ke') is the right entry -- the given name only
    has to be one of the given-name tokens.
  * Categories that do not belong to the person you mean. They come from
    someone else with the same name, and are what AUTHOR_PRIMARY_CATEGORIES
    and AUTHOR_CATEGORY_OVERRIDES exist to exclude.
"""

import collections
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from fetch_papers import (  # noqa: E402
    AUTHOR_CATEGORY_OVERRIDES, AUTHOR_PRIMARY_CATEGORIES, HEADERS,
    api_get, matches_author, parse_entries,
)


def main(first, last):
    query = f'au:"{last}, {first}"'
    print(f'query: {query}\n')
    entries = parse_entries(api_get({
        'search_query': query, 'max_results': '100',
        'sortBy': 'submittedDate', 'sortOrder': 'descending',
    }))
    if not entries:
        print('No results. Check the spelling, or try the other given name.')
        return 1

    signatures = collections.Counter()
    matched, unmatched = collections.Counter(), collections.Counter()
    for entry in entries:
        for name in entry['authors']:
            if name.lower().split()[-1:] == [last.lower()]:
                signatures[name] += 1
        if any(matches_author(a, first, last) for a in entry['authors']):
            matched[entry['primary_category']] += 1
        else:
            unmatched[entry['primary_category']] += 1

    allowed = AUTHOR_CATEGORY_OVERRIDES.get(f'{first} {last}', AUTHOR_PRIMARY_CATEGORIES)

    print(f'{len(entries)} recent papers returned by that query.\n')
    print('signatures sharing the surname:')
    for name, count in signatures.most_common():
        hit = matches_author(name, first, last)
        print(f'  {count:>3}  {name:<28} {"matches" if hit else "does NOT match"}')

    print(f'\nprimary categories of the {sum(matched.values())} full-name matches:')
    for category, count in matched.most_common():
        state = 'kept' if category in allowed else 'DROPPED by the category filter'
        print(f'  {count:>3}  {category:<12} {state}')

    if unmatched:
        print(f'\n{sum(unmatched.values())} papers matched the arXiv query but not the '
              f'full name (a different person):')
        print('  ' + ', '.join(f'{c} x{n}' for c, n in unmatched.most_common(8)))

    missing = [c for c in matched if c not in allowed]
    if missing:
        print(f'\nTo keep the dropped ones, add {missing} to AUTHOR_PRIMARY_CATEGORIES '
              f'in fetch_papers.py (or to an override entry for this author).')
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
