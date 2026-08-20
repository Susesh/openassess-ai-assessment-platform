import os
import sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import SessionLocal
from backend.services.question_paper_service import EXAM_MODULE_DESCRIPTIONS
from backend.models.question_paper import QuestionPaper

if __name__ == '__main__':
    db = SessionLocal()
    try:
        for category in EXAM_MODULE_DESCRIPTIONS:
            papers = db.query(QuestionPaper).filter(QuestionPaper.exam_category==category).all()
            print(f"{category}: {len(papers)} papers")
            for p in papers[:10]:
                print(f"  id={p.id} year={p.year} name={p.exam_name!r} total_questions={p.total_questions} linked_items={len(p.questions)}")
    finally:
        db.close()
