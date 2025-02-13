import urllib.request
import xml.etree.ElementTree as ET
import json
import time
from datetime import datetime
import os
from pathlib import Path

CACHE_FILE = '_data/arxiv_cache.json'
CACHE_DURATION = 86400  # 24 hours
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

def fetch_arxiv_papers():
    # Updated search query with proper encoding and exact phrase matching
    query_params = {
        'search_query': '(ti:"transfer learning" OR abs:"transfer learning" OR ti:"distributionally robust" OR abs:"distributionally robust")',
        'sortBy': 'submittedDate',
        'sortOrder': 'descending',
        'max_results': '50'  # Convert to string
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
            
            for entry in root.findall('.//atom:entry', namespaces):
                # Extract paper details with proper namespace handling
                title = entry.find('atom:title', namespaces).text.strip()
                
                # Only include papers that actually match our keywords
                keywords = ['transfer learning', 'distributionally robust']
                if not any(kw.lower() in title.lower() or 
                          kw.lower() in entry.find('atom:abstract', namespaces).text.lower() 
                          for kw in keywords):
                    continue
                    
                paper = {
                    'title': title,
                    'authors': [author.find('atom:name', namespaces).text.strip() 
                               for author in entry.findall('atom:author', namespaces)],
                    'abstract': entry.find('atom:summary', namespaces).text.strip(),
                    'published': format_date(entry.find('atom:published', namespaces).text),
                    'categories': [cat.get('term') for cat in entry.findall('atom:category', namespaces)],
                    'pdf_link': next((link.get('href') for link in entry.findall('atom:link', namespaces) 
                                    if link.get('title') == 'pdf'), ''),
                    'arxiv_url': next((link.get('href') for link in entry.findall('atom:link', namespaces) 
                                     if link.get('rel') == 'alternate'), '')
                }
                papers.append(paper)
            
            if papers:
                print(f"Successfully fetched {len(papers)} relevant papers")
                save_cache(papers)
                return papers
            else:
                print("No papers found matching the keywords")
                return load_cache()
                
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

def load_cache():
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r') as f:
                data = json.load(f)
                if time.time() - data['timestamp'] < CACHE_DURATION:
                    return data['papers']
    except Exception as e:
        print(f"Error loading cache: {str(e)}")
    return None

def save_cache(papers):
    try:
        Path('_data').mkdir(exist_ok=True)
        with open(CACHE_FILE, 'w') as f:
            json.dump({
                'timestamp': int(time.time()),
                'papers': papers
            }, f, indent=2)
    except Exception as e:
        print(f"Error saving cache: {str(e)}")

if __name__ == '__main__':
    papers = fetch_arxiv_papers()
    if papers:
        print("Papers updated successfully")
    else:
        print("Failed to update papers")