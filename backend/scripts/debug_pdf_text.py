"""
Debug script to examine extracted PDF text for pattern matching.
"""

import sys
import os
import fitz
import requests
import tempfile
import urllib3

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def download_and_extract_text(url: str) -> str:
    """Download PDF and extract text."""
    print(f"📥 Downloading PDF from {url}")
    
    session = requests.Session()
    session.verify = False
    response = session.get(url, timeout=60)
    response.raise_for_status()
    
    temp_dir = tempfile.mkdtemp(prefix="debug_pdf_")
    pdf_path = os.path.join(temp_dir, "test.pdf")
    
    with open(pdf_path, 'wb') as f:
        f.write(response.content)
    
    print(f"✓ Downloaded to {pdf_path}")
    
    # Extract text
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    text_chunks = []
    
    for page_num in range(min(5, page_count)):  # First 5 pages only
        page = doc[page_num]
        text = page.get_text()
        text_chunks.append(f"--- Page {page_num + 1} ---\n{text}")
    
    doc.close()
    
    full_text = "\n\n".join(text_chunks)
    print(f"✓ Extracted text from {min(5, page_count)} pages")
    print(f"📄 Total characters: {len(full_text)}")
    
    return full_text

def main():
    """Main debug function."""
    test_url = "https://nta.ac.in/Download/ExamPaper/Paper_20201105052840.pdf"
    
    print("=" * 70)
    print("🔍 PDF Text Extraction Debug")
    print("=" * 70)
    
    text = download_and_extract_text(test_url)
    
    print("\n" + "=" * 70)
    print("📄 First 2000 characters of extracted text:")
    print("=" * 70)
    print(text[:2000])
    
    print("\n" + "=" * 70)
    print("🔍 Looking for question patterns...")
    print("=" * 70)
    
    import re
    
    # Check for various patterns
    patterns = [
        r'\d+\.',
        r'\d+\)',
        r'Q\d+\.',
        r'Question\s+\d+',
        r'\([A-D]\)',
        r'[A-D]\.',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text[:5000])
        if matches:
            print(f"✓ Pattern '{pattern}': Found {len(matches)} matches")
            print(f"  Examples: {matches[:5]}")
        else:
            print(f"✗ Pattern '{pattern}': No matches")

if __name__ == "__main__":
    main()
