"""
Batch PDF Question Paper Importer for OpenAssess

This script iterates through a pre-configured list of official PDF URLs
and imports them into the Supabase database using the PDF ingestion pipeline.

Usage:
    python backend/scripts/batch_import_papers.py
"""

import sys
import os
import requests
import tempfile
import time
import urllib3
from typing import List, Dict, Any
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.scripts.import_pdf_paper import PDFQuestionExtractor, DatabaseImporter


PAPERS = [
    # --- NTA Papers (JEE / NEET / CUET) ---
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20201105052840.pdf", "exam_name": "NTA Official Paper 1", "subject": "General Science", "use_vision": False},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20201105053734.pdf", "exam_name": "NTA Official Paper 2", "subject": "General Science", "use_vision": False},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20201106054349.pdf", "exam_name": "NTA Official Paper 3", "subject": "General Science", "use_vision": False},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20260623154909.pdf", "exam_name": "NTA Paper 2026 Archive", "subject": "General Science", "use_vision": False},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20251223094412_6025acb3.pdf", "exam_name": "NTA Official Shift A", "subject": "Physics", "use_vision": False},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20251223094412_864feb08.pdf", "exam_name": "NTA Official Shift B", "subject": "Chemistry", "use_vision": False},

    # --- CBSE Class X Question Banks & SQP ---
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassX/EnglishX.pdf", "exam_name": "CBSE 10th Question Bank", "subject": "English", "use_vision": False},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassX/MathsX.pdf", "exam_name": "CBSE 10th Question Bank", "subject": "Mathematics", "use_vision": False},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassX/ScienceX.pdf", "exam_name": "CBSE 10th Question Bank", "subject": "Science", "use_vision": False},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassX_2022_23/Science-SQP.pdf", "exam_name": "CBSE 10th SQP 2022-23", "subject": "Science", "use_vision": True},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassX_2022_23/MathsStandard-SQP.pdf", "exam_name": "CBSE 10th SQP 2022-23", "subject": "Mathematics", "use_vision": True},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassX_2022_23/Kannada-SQP.pdf", "exam_name": "CBSE 10th SQP 2022-23", "subject": "Kannada", "use_vision": True},

    # --- CBSE Class XII Question Banks & SQP ---
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassXII/ChemistryXII.pdf", "exam_name": "CBSE 12th Question Bank", "subject": "Chemistry", "use_vision": False},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassXII/EconomicsXII.pdf", "exam_name": "CBSE 12th Question Bank", "subject": "Economics", "use_vision": False},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassXII/PoliticalScienceXII.pdf", "exam_name": "CBSE 12th Question Bank", "subject": "Political Science", "use_vision": False},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassXII/MathematicsXII.pdf", "exam_name": "CBSE 12th Question Bank", "subject": "Mathematics", "use_vision": False},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2020_21/Biology-SQP.pdf", "exam_name": "CBSE 12th SQP 2020-21", "subject": "Biology", "use_vision": True},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2020_21/Chemistry-SQP.pdf", "exam_name": "CBSE 12th SQP 2020-21", "subject": "Chemistry", "use_vision": True},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2020_21/Maths-SQP.pdf", "exam_name": "CBSE 12th SQP 2020-21", "subject": "Mathematics", "use_vision": True},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2020_21/Physics-SQP.pdf", "exam_name": "CBSE 12th SQP 2020-21", "subject": "Physics", "use_vision": True},

    # --- UPSC Papers ---
    {"url": "https://www.upsc.gov.in/sites/default/files/QP-CSP-24-GENERAL-STUDIES-PAPER-II-180624.pdf", "exam_name": "UPSC Prelims 2024", "subject": "General Studies II (CSAT)", "use_vision": True},
    {"url": "https://www.upsc.gov.in/sites/default/files/QP-IES-ISS-26-220626-INDIAN-ECONOMICS.pdf", "exam_name": "UPSC IES/ISS 2024", "subject": "Indian Economics", "use_vision": True},
    {"url": "https://www.upsc.gov.in/sites/default/files/QP-CGeoScnstM-26-220626-CHEMISTRY-PAPER-1.pdf", "exam_name": "UPSC Combined Geo-Scientist", "subject": "Chemistry Paper 1", "use_vision": True},

    # --- Karnataka KEA / CET / PGCET Papers ---
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/2024_UG_CET_M_18062026kannada.pdf", "exam_name": "KCET 2024", "subject": "Mathematics (Kannada/English)", "use_vision": True},
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/UG_CET_2024_C_18062026kannada.pdf", "exam_name": "KCET 2024", "subject": "Chemistry (Kannada/English)", "use_vision": True},
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/MCA_2024_18062026kannada.pdf", "exam_name": "KEA PGCET 2024", "subject": "MCA", "use_vision": True},
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/MBA_2024_18062026kannada.pdf", "exam_name": "KEA PGCET 2024", "subject": "MBA", "use_vision": True}
]


class BatchPDFImporter:
    """Batch import PDF papers from URLs."""
    
    def __init__(self, papers: List[Dict[str, str]]):
        self.papers = papers
        self.total_questions_imported = 0
        self.successful_imports = 0
        self.failed_imports = 0
        self.temp_dir = tempfile.mkdtemp(prefix="openassess_pdfs_")
        
    def download_pdf(self, url: str, index: int) -> str:
        """Download PDF from URL to temporary file with SSL verification bypass for problematic domains."""
        try:
            print(f"  📥 Downloading PDF from {url}")
            
            # Disable SSL warnings for problematic domains
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            
            # Use SSL verification bypass for problematic domains
            session = requests.Session()
            session.verify = False  # Bypass SSL verification
            
            response = session.get(url, timeout=60)
            response.raise_for_status()
            
            pdf_path = os.path.join(self.temp_dir, f"paper_{index}.pdf")
            with open(pdf_path, 'wb') as f:
                f.write(response.content)
            
            print(f"  ✓ Downloaded to {pdf_path}")
            return pdf_path
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Failed to download PDF: {e}")
            return None
        except Exception as e:
            print(f"  ✗ Error downloading PDF: {e}")
            return None
    
    def process_paper(self, paper: Dict[str, str], index: int) -> int:
        """Process a single paper and return number of questions imported."""
        print(f"\n[Processing {index + 1}/{len(self.papers)}] Importing {paper['exam_name']} - {paper['subject']}")
        print("=" * 70)
        
        # Download PDF
        pdf_path = self.download_pdf(paper['url'], index)
        if not pdf_path:
            return 0
        
        try:
            # Extract questions with vision fallback if enabled
            use_vision = paper.get('use_vision', False)
            if use_vision:
                print(f"  🔍 Vision fallback enabled for this paper")
            
            extractor = PDFQuestionExtractor(pdf_path, use_vision_fallback=use_vision)
            questions = extractor.process_pdf()
            
            if not questions:
                print("  ✗ No questions extracted from PDF")
                return 0
            
            # Import to database
            importer = DatabaseImporter(
                exam_name=paper['exam_name'],
                subject=paper['subject'],
                subtopic_id=None
            )
            
            # Create question paper
            question_paper = importer.create_question_paper()
            
            # Import questions
            imported_count = importer.import_questions(questions, question_paper.id)
            
            # Update question paper count
            importer.update_question_paper_count(question_paper.id, imported_count)
            
            # Close database connection
            importer.close()
            
            print(f"  ✅ Successfully imported {imported_count} questions")
            return imported_count
            
        except Exception as e:
            print(f"  ✗ Error processing paper: {e}")
            return 0
        finally:
            # Clean up temporary PDF file
            if pdf_path and os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                except:
                    pass
    
    def run_batch_import(self):
        """Run batch import for all papers."""
        print("\n" + "=" * 70)
        print("🎓 Batch PDF Question Paper Importer for OpenAssess")
        print("=" * 70)
        print(f"📋 Total papers to process: {len(self.papers)}")
        print(f"📁 Temporary directory: {self.temp_dir}")
        print("=" * 70)
        
        for i, paper in enumerate(self.papers):
            try:
                questions_imported = self.process_paper(paper, i)
                
                if questions_imported > 0:
                    self.total_questions_imported += questions_imported
                    self.successful_imports += 1
                else:
                    self.failed_imports += 1
                    
            except KeyboardInterrupt:
                print("\n\n⚠️  Batch import interrupted by user")
                break
            except Exception as e:
                print(f"\n✗ Unexpected error processing paper {i + 1}: {e}")
                self.failed_imports += 1
                continue
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print import summary."""
        print("\n" + "=" * 70)
        print("📊 BATCH IMPORT SUMMARY")
        print("=" * 70)
        print(f"📋 Total papers processed: {len(self.papers)}")
        print(f"✅ Successful imports: {self.successful_imports}")
        print(f"❌ Failed imports: {self.failed_imports}")
        print(f"📝 Total questions imported: {self.total_questions_imported}")
        print("=" * 70)
        
        # Clean up temporary directory
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up temporary directory")
        except Exception as e:
            print(f"⚠️  Could not clean up temporary directory: {e}")


def main():
    """Main entry point."""
    print("\n🚀 Starting batch PDF import process...")
    
    # Test with vision-enabled papers first
    vision_papers = [p for p in PAPERS if p.get('use_vision', False)]
    print(f📋 Testing {len(vision_papers)} papers with Vision fallback...")
    
    importer = BatchPDFImporter(vision_papers[:2])  # Test with first 2 vision papers
    importer.run_batch_import()
    
    print("\n✅ Vision pipeline test completed!")
    print(f"� Total questions ingested: {importer.total_questions_imported}")
    
    # If vision works, process remaining papers
    if importer.total_questions_imported > 0:
        print("\n🚀 Vision pipeline working, processing remaining papers...")
        remaining_papers = [p for p in PAPERS if not p.get('use_vision', False)]
        importer2 = BatchPDFImporter(remaining_papers)
        importer2.run_batch_import()
        print(f"\n✅ Full batch import completed!")
        print(f"📝 Total questions ingested: {importer.total_questions_imported + importer2.total_questions_imported}")


if __name__ == "__main__":
    main()
