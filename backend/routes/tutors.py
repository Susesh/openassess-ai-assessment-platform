from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models.user import User
from backend.models.tutor import TutorProfile, TutorAvailability, TutorSession
from backend.schemas.tutor import TutorProfileOut, TutorAvailabilityOut, TutorSessionBook, TutorSessionOut
from backend.utils.auth_utils import get_current_user
import uuid

router = APIRouter(prefix="/tutors", tags=["Tutors"])

@router.get("/", response_model=List[TutorProfileOut])
def get_tutors(db: Session = Depends(get_db)):
    tutors = db.query(TutorProfile).filter(TutorProfile.is_active == True).all()
    return tutors

@router.get("/{tutor_id}/availability", response_model=List[TutorAvailabilityOut])
def get_tutor_availability(tutor_id: int, db: Session = Depends(get_db)):
    tutor = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if not tutor:
        raise HTTPException(status_code=404, detail="Tutor not found")
        
    availabilities = db.query(TutorAvailability).filter(
        TutorAvailability.tutor_id == tutor_id,
        TutorAvailability.is_booked == False
    ).all()
    return availabilities

@router.post("/book", response_model=TutorSessionOut)
def book_tutor_session(
    body: TutorSessionBook,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tutor = db.query(TutorProfile).filter(TutorProfile.id == body.tutor_id).first()
    if not tutor:
        raise HTTPException(status_code=404, detail="Tutor not found")
        
    session = TutorSession(
        tutor_id=body.tutor_id,
        student_id=current_user.id,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        status="scheduled",
        meeting_link=f"https://meet.openassess.com/{uuid.uuid4().hex[:8]}"
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/my", response_model=List[TutorSessionOut])
def get_my_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(TutorSession).filter(
        TutorSession.student_id == current_user.id
    ).order_by(TutorSession.scheduled_at.desc()).all()
    return sessions
