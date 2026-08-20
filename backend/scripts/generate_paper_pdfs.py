"""Generate PDF files for QuestionPapers that don't have `pdf_url` set.

Creates `backend/static/papers/{paper.id}.pdf` and updates `paper.pdf_url`.
Requires `reportlab` (already in requirements.txt).

Run:
    D:/project/OpenAssess-main/.venv/Scripts/python.exe backend/scripts/generate_paper_pdfs.py
"""
import os
import sys
from pathlib import Path

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import SessionLocal
from backend.services.question_paper_service import question_paper_service
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


OUT_DIR = Path(ROOT) / 'backend' / 'static' / 'papers'
OUT_DIR.mkdir(parents=True, exist_ok=True)


def render_pdf(paper_detail, path: Path):
    c = canvas.Canvas(str(path), pagesize=letter)
    width, height = letter
    y = height - 40
    c.setFont('Helvetica-Bold', 14)
    c.drawString(40, y, f"{paper_detail['exam_name']} ({paper_detail.get('year', '')})")
    y -= 24
    c.setFont('Helvetica', 10)
    c.drawString(40, y, f"Subject: {paper_detail.get('subject', '')}  |  Topic: {paper_detail.get('topic_name', '')}")
    y -= 20
    c.drawString(40, y, "")
    y -= 20

    for item in paper_detail.get('questions', []):
        text = item.get('question_text_snapshot') or ''
        if y < 80:
            c.showPage()
            y = height - 40
        c.setFont('Helvetica', 9)
        c.drawString(40, y, f"{item.get('question_number')}. {text[:200]}")
        y -= 36

    c.save()


def main():
    db = SessionLocal()
    try:
        papers = db.query(question_paper_service.__class__.__name__)
    except Exception:
        # fallback: query model directly
        from backend.models.question_paper import QuestionPaper
        papers = db.query(QuestionPaper).all()

    updated = 0
    for paper in papers:
        if getattr(paper, 'pdf_url', None):
            continue
        try:
            detail = question_paper_service.serialize_detail(paper).model_dump()
            out_path = OUT_DIR / f"paper_{paper.id}.pdf"
            render_pdf(detail, out_path)
            paper.pdf_url = f"/static/papers/{out_path.name}"
            db.commit()
            updated += 1
            print(f"Generated PDF for paper id={paper.id}")
        except Exception as e:
            print(f"Failed PDF for paper id={paper.id}: {e}")

    print(f"PDF generation complete. Updated {updated} papers.")


if __name__ == '__main__':
    main()
