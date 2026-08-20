"""Archive (unpublish) question papers that have fewer than MIN_QUESTIONS questions.

Run:
    backend\venv\Scripts\python.exe backend\scripts\archive_incomplete_papers.py
"""
import sys
import os
import json

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import SessionLocal
from backend.models.question_paper import QuestionPaper

MIN_QUESTIONS = 70


def archive_incomplete():
    db = SessionLocal()
    try:
        papers = db.query(QuestionPaper).filter(QuestionPaper.total_questions < MIN_QUESTIONS, QuestionPaper.is_published.is_(True)).all()
        print(f"Found {len(papers)} published papers with fewer than {MIN_QUESTIONS} questions")
        for p in papers:
            print(f"Archiving paper id={p.id} name={p.exam_name} total_questions={p.total_questions}")
            p.is_published = False
            meta = dict(p.meta_data or {})
            meta.update({"archived": True, "archived_reason": f"<{MIN_QUESTIONS} questions"})
            p.meta_data = meta
        db.commit()
    finally:
        db.close()


if __name__ == '__main__':
    archive_incomplete()
