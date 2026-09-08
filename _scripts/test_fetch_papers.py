#!/usr/bin/env python3
"""Offline tests for fetch_papers.py. Run: python3 _scripts/test_fetch_papers.py"""

import importlib.util
import json
import os
import tempfile
import unittest
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


if __name__ == '__main__':
    unittest.main(verbosity=2)
