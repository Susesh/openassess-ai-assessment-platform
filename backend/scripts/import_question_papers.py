"""
Script to download and import real question papers from official sources.
Downloads PDFs and creates QuestionPaper records in the database.
"""

import os
import sys
import requests
import urllib3
from pathlib import Path
from datetime import datetime
from typing import List, Dict

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

# Force SQLite for local development
os.environ["DATABASE_URL"] = "sqlite:///./openassess.db"

from sqlalchemy.orm import Session
from backend.database import engine, get_db
from backend.models.question_paper import QuestionPaper


# Question paper data from the provided links
PAPERS = [
    # --- NTA Papers (JEE / NEET / CUET) ---
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20201105052840.pdf", "exam_name": "NTA Official Paper 1", "subject": "General Science"},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20201105053734.pdf", "exam_name": "NTA Official Paper 2", "subject": "General Science"},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20201106054349.pdf", "exam_name": "NTA Official Paper 3", "subject": "General Science"},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20260623154909.pdf", "exam_name": "NTA Paper 2026 Archive", "subject": "General Science"},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20251223094412_6025acb3.pdf", "exam_name": "NTA Official Shift A", "subject": "Physics"},
    {"url": "https://nta.ac.in/Download/ExamPaper/Paper_20251223094412_864feb08.pdf", "exam_name": "NTA Official Shift B", "subject": "Chemistry"},

    # --- CBSE Class X Question Banks & SQP ---
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassX/EnglishX.pdf", "exam_name": "CBSE 10th Question Bank", "subject": "English"},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassX/MathsX.pdf", "exam_name": "CBSE 10th Question Bank", "subject": "Mathematics"},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassX/ScienceX.pdf", "exam_name": "CBSE 10th Question Bank", "subject": "Science"},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassX_2022_23/Science-SQP.pdf", "exam_name": "CBSE 10th SQP 2022-23", "subject": "Science"},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassX_2022_23/MathsStandard-SQP.pdf", "exam_name": "CBSE 10th SQP 2022-23", "subject": "Mathematics"},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassX_2022_23/Kannada-SQP.pdf", "exam_name": "CBSE 10th SQP 2022-23", "subject": "Kannada"},

    # --- CBSE Class XII Question Banks & SQP ---
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassXII/ChemistryXII.pdf", "exam_name": "CBSE 12th Question Bank", "subject": "Chemistry"},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassXII/EconomicsXII.pdf", "exam_name": "CBSE 12th Question Bank", "subject": "Economics"},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassXII/PoliticalScienceXII.pdf", "exam_name": "CBSE 12th Question Bank", "subject": "Political Science"},
    {"url": "https://cbseacademic.nic.in/web_material/QuestionBank/ClassXII/MathematicsXII.pdf", "exam_name": "CBSE 12th Question Bank", "subject": "Mathematics"},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2020_21/Biology-SQP.pdf", "exam_name": "CBSE 12th SQP 2020-21", "subject": "Biology"},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2020_21/Chemistry-SQP.pdf", "exam_name": "CBSE 12th SQP 2020-21", "subject": "Chemistry"},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2020_21/Maths-SQP.pdf", "exam_name": "CBSE 12th SQP 2020-21", "subject": "Mathematics"},
    {"url": "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2020_21/Physics-SQP.pdf", "exam_name": "CBSE 12th SQP 2020-21", "subject": "Physics"},

    # --- UPSC Papers ---
    {"url": "https://www.upsc.gov.in/sites/default/files/QP-CSP-24-GENERAL-STUDIES-PAPER-II-180624.pdf", "exam_name": "UPSC Prelims 2024", "subject": "General Studies II (CSAT)"},
    {"url": "https://www.upsc.gov.in/sites/default/files/QP-IES-ISS-26-220626-INDIAN-ECONOMICS.pdf", "exam_name": "UPSC IES/ISS 2024", "subject": "Indian Economics"},
    {"url": "https://www.upsc.gov.in/sites/default/files/QP-CGeoScnstM-26-220626-CHEMISTRY-PAPER-1.pdf", "exam_name": "UPSC Combined Geo-Scientist", "subject": "Chemistry Paper 1"},

    # --- Karnataka KEA / CET / PGCET Papers ---
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/2024_UG_CET_M_18062026kannada.pdf", "exam_name": "KCET 2024", "subject": "Mathematics (Kannada/English)"},
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/UG_CET_2024_C_18062026kannada.pdf", "exam_name": "KCET 2024", "subject": "Chemistry (Kannada/English)"},
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/MCA_2024_18062026kannada.pdf", "exam_name": "KEA PGCET 2024", "subject": "MCA"},
    {"url": "https://cetonline.karnataka.gov.in/keawebentry456/QP2024/MBA_2024_18062026kannada.pdf", "exam_name": "KEA PGCET 2024", "subject": "MBA"}
]


def determine_exam_category(url: str, exam_name: str) -> str:
    """Determine exam category based on URL and exam name."""
    if "nta.ac.in" in url:
        return "NEET"
    elif "cbseacademic.nic.in" in url:
        return "CBSE"
    elif "upsc.gov.in" in url:
        return "UPSC"
    elif "karnataka.gov.in" in url:
        return "State Board"
    else:
        return "Custom Assessments"


def determine_board(exam_category: str) -> str:
    """Determine board based on exam category."""
    if exam_category == "CBSE":
        return "CBSE"
    elif exam_category == "UPSC":
        return "UPSC"
    elif exam_category == "State Board":
        return "Karnataka Board"
    elif exam_category == "NEET":
        return "NTA"
    else:
        return "Other"


def determine_class_name(exam_name: str) -> str:
    """Determine class name from exam name."""
    if "10th" in exam_name or "ClassX" in exam_name:
        return "10"
    elif "12th" in exam_name or "ClassXII" in exam_name:
        return "12"
    elif "KCET" in exam_name:
        return "12"
    elif "PGCET" in exam_name:
        return "Graduate"
    else:
        return None


def determine_year(exam_name: str) -> int:
    """Extract year from exam name or use current year."""
    import re
    year_match = re.search(r'20\d{2}', exam_name)
    if year_match:
        return int(year_match.group())
    return 2024  # Default to current year


def download_pdf(url: str, save_path: Path) -> bool:
    """Download PDF from URL to local path."""
    try:
        print(f"Downloading: {url}")
        # Disable SSL verification for problematic servers
        response = requests.get(url, timeout=30, verify=False)
        response.raise_for_status()
        
        save_path.parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, 'wb') as f:
            f.write(response.content)
        print(f"Saved to: {save_path}")
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False


def import_question_papers(db: Session):
    """Import question papers from the provided URLs."""
    papers_dir = Path(__file__).parent.parent / "static" / "papers"
    papers_dir.mkdir(parents=True, exist_ok=True)
    
    imported_count = 0
    failed_count = 0
    
    for paper_data in PAPERS:
        url = paper_data["url"]
        exam_name = paper_data["exam_name"]
        subject = paper_data["subject"]
        
        # Determine metadata
        exam_category = determine_exam_category(url, exam_name)
        board = determine_board(exam_category)
        class_name = determine_class_name(exam_name)
        year = determine_year(exam_name)
        
        # Generate filename from URL
        filename = url.split("/")[-1]
        local_path = papers_dir / filename
        
        # Download PDF
        if not download_pdf(url, local_path):
            failed_count += 1
            continue
        
        # Check if paper already exists
        existing = db.query(QuestionPaper).filter(
            QuestionPaper.pdf_url == url
        ).first()
        
        if existing:
            print(f"Paper already exists: {exam_name}")
            imported_count += 1
            continue
        
        # Create QuestionPaper record
        paper = QuestionPaper(
            exam_category=exam_category,
            board=board,
            exam_name=exam_name,
            year=year,
            class_name=class_name,
            subject=subject,
            pdf_url=url,
            source=url,
            total_questions=0,  # Will be updated when questions are extracted
            total_marks=0,  # Will be updated when questions are extracted
            is_published=True,
            meta_data={
                "original_filename": filename,
                "local_path": str(local_path),
                "imported_at": datetime.utcnow().isoformat()
            }
        )
        
        db.add(paper)
        db.commit()
        db.refresh(paper)
        
        print(f"Imported: {exam_name} ({subject}) - ID: {paper.id}")
        imported_count += 1
    
    print(f"\nImport complete: {imported_count} imported, {failed_count} failed")


if __name__ == "__main__":
    db = next(get_db())
    try:
        import_question_papers(db)
    finally:
        db.close()
