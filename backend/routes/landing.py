from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.models.user import User
from backend.models.topic import Topic
from backend.models.question import Question
from backend.models.attempt import Attempt

router = APIRouter(prefix="/landing", tags=["landing"])


@router.get("/stats")
def get_landing_stats(db: Session = Depends(get_db)):
    """Get real statistics for the landing page."""
    # Temporarily return hardcoded values to isolate the 500 error
    return {
        "total_users": 0,
        "total_topics": 0,
        "total_questions": 0,
        "total_attempts": 0,
        "total_subjects": 0,
        "subject_categories": []
    }
