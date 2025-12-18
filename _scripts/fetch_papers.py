import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import time
from datetime import datetime
import os
from pathlib import Path

CACHE_FILE = '_data/arxiv_cache.json'
ARCHIVE_FILE = '_data/arxiv_archive.json'
FETCH_INTERVAL = 86400  # 24 hours - how often to fetch new papers
PAPER_RETENTION_DAYS = 30  # Papers stay for 1 month before archiving
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

# ============================================================================
# AUTHOR LIST - Add your authors here in the format: "First Last"
# Example: ["John Doe", "Jane Smith", "Alice Johnson"]
# ============================================================================
AUTHOR_LIST = [
    # Add your authors here, one per line
    # Example: "Keyao Zhan",
    "Tianxi Cai",
    "Junwei Lu",
    "Molei Liu",
    "Weijie Su",
    "Kewei Wang",
    "Rui Duan"
]

def build_search_query():
    """Build search query combining keywords and authors"""
    keyword_query = '(ti:"transfer learning" OR abs:"transfer learning" OR ti:"distributionally robust" OR abs:"distributionally robust")'
    
    # Build author query if authors are specified
    author_queries = []
    if AUTHOR_LIST:
        for author in AUTHOR_LIST:
            # Format: au:"First Last" OR au:"Last, First"
            author_queries.append(f'au:"{author}"')
            # Also try last name, first name format
            if ' ' in author:
                parts = author.split(' ', 1)
                author_queries.append(f'au:"{parts[1]}, {parts[0]}"')
    
    if author_queries:
        author_query = ' OR '.join(author_queries)
        return f'({keyword_query} OR {author_query})'
    else:
        return keyword_query

def fetch_arxiv_papers():
    # Build search query with keywords and authors
    search_query = build_search_query()
    
    query_params = {
        'search_query': search_query,
        'sortBy': 'submittedDate',
        'sortOrder': 'descending',
        'max_results': '100'  # Increased to get more results for author searches
    }
    
    # Fixed URL encoding
    query_string = '&'.join(
        f"{k}={urllib.parse.quote(str(v), encoding='utf-8', safe='')}"
        for k, v in query_params.items()
    )
    url = f"http://export.arxiv.org/api/query?{query_string}"
    
    print(f"Fetching papers with URL: {url}")  # Debug logging
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Paper Fetcher; mailto:kzhan@g.harvard.edu)'
    }

    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as response:
                xml_data = response.read().decode('utf-8')
                print(f"Response received, length: {len(xml_data)}")  # Debug log
                
            if 'The requested URL was not found' in xml_data:
                print("Error: Invalid API request")
                return load_cache()
                
            root = ET.fromstring(xml_data)
            papers = []
            
            # Add namespace handling for arXiv XML
            namespaces = {
                'atom': 'http://www.w3.org/2005/Atom',
                'arxiv': 'http://arxiv.org/schemas/atom'
            }
            
            entries = root.findall('.//atom:entry', namespaces)
            print(f"Found {len(entries)} entries in response")  # Debug log
            
            for entry in entries:
                try:
                    title_elem = entry.find('atom:title', namespaces)
                    abstract_elem = entry.find('atom:summary', namespaces)
                    
                    if title_elem is None or abstract_elem is None:
                        print(f"Missing title or abstract for entry")  # Debug log
                        continue
                        
                    title = title_elem.text.strip()
                    abstract = abstract_elem.text.strip()
                    
                    # Get authors from entry
                    paper_authors = [author.find('atom:name', namespaces).text.strip() 
                                   for author in entry.findall('atom:author', namespaces)]
                    
                    # Check if paper matches keywords OR is by one of our tracked authors
                    keywords = ['distributionally robust']
                    matches_keywords = any(kw.lower() in title.lower() or 
                                         kw.lower() in abstract.lower() 
                                         for kw in keywords)
                    
                    # Check if any author matches our list
                    matches_author = False
                    if AUTHOR_LIST:
                        for tracked_author in AUTHOR_LIST:
                            # Check if any paper author matches (case-insensitive, partial match)
                            for paper_author in paper_authors:
                                if tracked_author.lower() in paper_author.lower() or paper_author.lower() in tracked_author.lower():
                                    matches_author = True
                                    break
                            if matches_author:
                                break
                    
                    # Include paper if it matches keywords OR is by tracked author
                    if not (matches_keywords or matches_author):
                        continue

                    categories = [cat.get('term') for cat in entry.findall('atom:category', namespaces)]
                    
                    # Check if at least one category contains 'stat'
                    if not any('stat' in cat.lower() for cat in categories):
                        continue
                        
                    published_elem = entry.find('atom:published', namespaces)
                    if published_elem is None:
                        print(f"Missing published date for paper: {title}")  # Debug log
                        continue
                        
                    # Get arxiv ID to use as unique identifier
                    arxiv_id = published_elem.text  # Use published date + title as fallback ID
                    arxiv_url = next((link.get('href') for link in entry.findall('atom:link', namespaces) 
                                     if link.get('rel') == 'alternate'), '')
                    # Extract arxiv ID from URL if possible
                    if arxiv_url:
                        try:
                            arxiv_id = arxiv_url.split('/abs/')[-1].split('v')[0]
                        except (IndexError, AttributeError):
                            arxiv_id = arxiv_url
                    
                    paper = {
                        'arxiv_id': arxiv_id,  # Unique identifier
                        'title': title,
                        'authors': paper_authors,
                        'abstract': abstract,
                        'published': format_date(published_elem.text),
                        'published_raw': published_elem.text,  # Keep raw date for sorting
                        'categories': categories,
                        'pdf_link': next((link.get('href') for link in entry.findall('atom:link', namespaces) 
                                        if link.get('title') == 'pdf'), ''),
                        'arxiv_url': arxiv_url,
                        'added_timestamp': int(time.time())  # When this paper was added to our collection
                    }
                    papers.append(paper)
                except Exception as e:
                    print(f"Error processing entry: {str(e)}")  # Debug log
                    continue
            
            if papers:
                print(f"Successfully fetched {len(papers)} relevant papers")
                # Merge with existing papers and filter old ones
                merged_papers = merge_and_filter_papers(papers)
                save_cache(merged_papers)
                return merged_papers
            else:
                print("No papers found matching the keywords")
                # Still archive old papers from cache
                cached = load_cache()
                if cached:
                    active = archive_old_papers(cached)
                    if active:
                        save_cache(active)
                    return active
                return None
                
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            else:
                print("All retries failed, falling back to cache")
                return load_cache()

def format_date(date_str):
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%SZ')
        return dt.strftime('%B %d, %Y')
    except:
        return date_str

def archive_old_papers(papers):
    """Archive papers older than retention period instead of deleting them"""
    cutoff_time = time.time() - (PAPER_RETENTION_DAYS * 86400)
    active_papers = []
    papers_to_archive = []
    
    for paper in papers:
        if paper.get('added_timestamp', 0) > cutoff_time:
            active_papers.append(paper)
        else:
            # Add archived timestamp
            paper['archived_timestamp'] = int(time.time())
            papers_to_archive.append(paper)
    
    if papers_to_archive:
        print(f"Archiving {len(papers_to_archive)} papers (older than {PAPER_RETENTION_DAYS} days)")
        add_to_archive(papers_to_archive)
    
    return active_papers

def merge_and_filter_papers(new_papers_list):
    """Merge new papers with existing ones, removing duplicates and archiving old papers"""
    # Load existing papers
    existing_papers = load_cache() or []
    
    # Also check archive to avoid re-adding archived papers
    archived_papers = load_archive() or []
    archived_ids = {p.get('arxiv_id', '') for p in archived_papers if 'arxiv_id' in p}
    
    # Create a set of existing arxiv_ids to avoid duplicates
    existing_ids = {p.get('arxiv_id', '') for p in existing_papers if 'arxiv_id' in p}
    
    # Add new papers that aren't duplicates (in active or archive)
    merged = existing_papers.copy()
    new_count = 0
    for paper in new_papers_list:
        paper_id = paper.get('arxiv_id', '')
        if paper_id and paper_id not in existing_ids and paper_id not in archived_ids:
            merged.append(paper)
            existing_ids.add(paper_id)
            new_count += 1
    
    print(f"Added {new_count} new papers, {len(existing_papers)} existing papers")
    
    # Archive old papers instead of deleting
    active_papers = archive_old_papers(merged)
    
    # Sort by published date (newest first)
    active_papers.sort(key=lambda x: x.get('published_raw', ''), reverse=True)
    
    return active_papers

def load_cache():
    """Load existing papers from cache"""
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('papers', [])
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading cache: {str(e)}")
    return None

def save_cache(papers_list):
    try:
        Path('_data').mkdir(exist_ok=True)
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                'last_fetch_timestamp': int(time.time()),
                'papers': papers_list
            }, f, indent=2)
        print(f"Saved {len(papers_list)} papers to cache")
    except (IOError, OSError) as e:
        print(f"Error saving cache: {str(e)}")

def load_archive():
    """Load archived papers from archive file"""
    try:
        if os.path.exists(ARCHIVE_FILE):
            with open(ARCHIVE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('papers', [])
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading archive: {str(e)}")
    return None

def add_to_archive(papers_to_archive):
    """Add papers to the archive file"""
    try:
        Path('_data').mkdir(exist_ok=True)
        
        # Load existing archive
        existing_archive = load_archive() or []
        
        # Create set of existing archive IDs to avoid duplicates
        existing_archive_ids = {p.get('arxiv_id', '') for p in existing_archive if 'arxiv_id' in p}
        
        # Add new papers to archive (avoid duplicates)
        new_archived = []
        for paper in papers_to_archive:
            paper_id = paper.get('arxiv_id', '')
            if paper_id and paper_id not in existing_archive_ids:
                existing_archive.append(paper)
                existing_archive_ids.add(paper_id)
                new_archived.append(paper)
        
        # Sort archive by published date (newest first)
        existing_archive.sort(key=lambda x: x.get('published_raw', ''), reverse=True)
        
        # Save archive
        with open(ARCHIVE_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                'last_updated': int(time.time()),
                'papers': existing_archive
            }, f, indent=2)
        
        print(f"Added {len(new_archived)} papers to archive (total: {len(existing_archive)})")
    except (IOError, OSError) as e:
        print(f"Error saving archive: {str(e)}")

if __name__ == '__main__':
    papers = fetch_arxiv_papers()
    if papers:
        print("Papers updated successfully")
    else:
        print("Failed to update papers")