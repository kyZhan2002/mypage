
import urllib.request
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import time
import os

CACHE_FILE = '_data/arxiv_cache.json'
CACHE_DURATION = 86400  # 24 hours

def sanitize_text(text):
    return ' '.join(text.split())

def format_date(date_str):
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%SZ')
        return dt.strftime('%B %d, %Y')
    except:
        return date_str

def fetch_papers():
    query = ('search_query=cat:cs.LG+AND+(all:"transfer+learning"+OR+all:'
             '"distributionally+robust")'
             '&sortBy=submittedDate&sortOrder=descending&max_results=50')
    url = f"http://export.arxiv.org/api/query?{query}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Paper Fetcher; mailto:kzhan@g.harvard.edu)'
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        papers = []
        
        for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
            paper = {
                'title': sanitize_text(entry.find('{http://www.w3.org/2005/Atom}title').text),
                'authors': [sanitize_text(author.find('{http://www.w3.org/2005/Atom}name').text) 
                           for author in entry.findall('{http://www.w3.org/2005/Atom}author')],
                'abstract': sanitize_text(entry.find('{http://www.w3.org/2005/Atom}summary').text),
                'published': format_date(entry.find('{http://www.w3.org/2005/Atom}published').text),
                'categories': [cat.get('term') for cat in entry.findall('{http://www.w3.org/2005/Atom}category')]
            }
            
            for link in entry.findall('{http://www.w3.org/2005/Atom}link'):
                if link.get('title') == 'pdf':
                    paper['pdf_link'] = link.get('href')
                elif link.get('rel') == 'alternate':
                    paper['arxiv_url'] = link.get('href')
                    
            papers.append(paper)
            
        return papers
    except Exception as e:
        print(f"Error fetching papers: {str(e)}")
        return None

def load_cache():
    if not os.path.exists(CACHE_FILE):
        return None
        
    try:
        with open(CACHE_FILE, 'r') as f:
            cache = json.load(f)
            if time.time() - cache['timestamp'] < CACHE_DURATION:
                return cache['papers']
    except:
        pass
    return None

def save_cache(papers):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, 'w') as f:
        json.dump({
            'timestamp': int(time.time()),
            'papers': papers
        }, f, indent=2)

def main():
    papers = load_cache()
    if not papers:
        papers = fetch_papers()
        if papers:
            save_cache(papers)
    
    if papers:
        print(f"Successfully processed {len(papers)} papers")
    else:
        print("No papers found or error occurred")

if __name__ == '__main__':
    main()