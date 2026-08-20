"""Calendar Routes - API endpoints for calendar integration."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.tutor import TutorSession
from backend.models.user import User
from backend.services.calendar_service import calendar_service
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get(
    "/session/{session_id}/ical",
    summary="Download iCal file for a session",
)
def get_session_ical(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and download an iCal file for a tutoring session."""
    session = db.query(TutorSession).filter(
        TutorSession.id == session_id,
        TutorSession.student_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    tutor_name = session.tutor.name if session.tutor else "Tutor"
    ical_content = calendar_service.generate_ical_event(session, current_user, tutor_name)
    
    return Response(
        content=ical_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename=remedial-session-{session_id}.ics"
        }
    )


@router.get(
    "/session/{session_id}/google",
    summary="Get Google Calendar link for a session",
)
def get_google_calendar_link(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a Google Calendar link for a tutoring session."""
    session = db.query(TutorSession).filter(
        TutorSession.id == session_id,
        TutorSession.student_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    tutor_name = session.tutor.name if session.tutor else "Tutor"
    link = calendar_service.generate_google_calendar_link(session, tutor_name)
    
    return {"google_calendar_link": link}


@router.get(
    "/session/{session_id}/outlook",
    summary="Get Outlook Calendar link for a session",
)
def get_outlook_calendar_link(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get an Outlook Calendar link for a tutoring session."""
    session = db.query(TutorSession).filter(
        TutorSession.id == session_id,
        TutorSession.student_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    tutor_name = session.tutor.name if session.tutor else "Tutor"
    link = calendar_service.generate_outlook_calendar_link(session, tutor_name)
    
    return {"outlook_calendar_link": link}
