import os
os.environ["DATABASE_URL"] = "sqlite:///./openassess.db"

from backend.database import get_db
from backend.models.attempt import Attempt
from backend.models.user import User
from backend.models.topic import Topic
from sqlalchemy.orm import Session

db = next(get_db())
print("Testing proctoring sessions query...")

try:
    attempts = db.query(Attempt).filter(Attempt.completed_at.isnot(None)).limit(5).all()
    print(f"Found {len(attempts)} attempts")
    
    for attempt in attempts:
        print(f"Attempt ID: {attempt.id}, User ID: {attempt.user_id}, Topic ID: {attempt.topic_id}")
        print(f"  Score: {attempt.score}, Total: {attempt.total_questions}, Completed: {attempt.completed_at}")
        
        try:
            candidate = db.query(User).filter(User.id == attempt.user_id).first()
            print(f"  Candidate: {candidate.full_name if candidate else 'Not found'}")
        except Exception as e:
            print(f"  Candidate error: {e}")
            
        try:
            topic = db.query(Topic).filter(Topic.id == attempt.topic_id).first()
            print(f"  Topic: {topic.name if topic else 'Not found'}")
        except Exception as e:
            print(f"  Topic error: {e}")
            
except Exception as e:
    print(f"Query error: {e}")
    import traceback
    traceback.print_exc()
