"""
Test script for Gemini Vision pipeline on failed papers
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.scripts.import_pdf_paper import PDFQuestionExtractor, DatabaseImporter

# Test with a single vision-enabled paper (Karnataka KEA papers are image-based)
TEST_PAPERS = [
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/MCA_2024_18062026kannada.pdf", "exam_name": "KEA PGCET 2024", "subject": "MCA", "use_vision": True},
]

def main():
    print("\n🧪 Testing Gemini Vision Pipeline")
    print("=" * 70)
    
    # Download and test one paper
    import requests
    import urllib3
    import tempfile
    
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    paper = TEST_PAPERS[0]
    temp_dir = tempfile.mkdtemp(prefix="vision_test_")
    
    try:
        print(f"📥 Downloading {paper['exam_name']}...")
        session = requests.Session()
        session.verify = False
        response = session.get(paper['url'], timeout=60)
        response.raise_for_status()
        
        pdf_path = os.path.join(temp_dir, "test.pdf")
        with open(pdf_path, 'wb') as f:
            f.write(response.content)
        
        print(f"✓ Downloaded to {pdf_path}")
        
        # Test with vision enabled
        print(f"\n🔍 Testing with Vision fallback...")
        extractor = PDFQuestionExtractor(pdf_path, use_vision_fallback=True)
        questions = extractor.process_pdf()
        
        print(f"\n📊 Results:")
        print(f"   Questions extracted: {len(questions)}")
        
        if questions:
            print(f"\n✅ Vision pipeline working!")
            print(f"   Sample question: {questions[0].get('question_text', '')[:100]}...")
        else:
            print(f"\n⚠️  Vision pipeline needs configuration")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        # Cleanup
        import shutil
        try:
            shutil.rmtree(temp_dir)
        except:
            pass

if __name__ == "__main__":
    main()
