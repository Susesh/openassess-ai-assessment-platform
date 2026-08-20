import sys
import os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import SessionLocal
from backend.models.topic import Topic
from backend.models.question import Question


def report():
    db = SessionLocal()
    try:
        for t in db.query(Topic).all():
            cnt = db.query(Question).filter(Question.topic_id == t.id).count()
            print(f"{t.name}: {cnt} questions")
    finally:
        db.close()


if __name__ == '__main__':
    report()
