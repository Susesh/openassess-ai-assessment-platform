from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import base64
import numpy as np

from backend.database import get_db
from backend.models.user import User
from backend.schemas.ai_proctoring import (
    AIViolationCreate,
    AIViolationOut,
    ProctoringSessionCreate,
    ProctoringSessionOut,
    EnvironmentViolationCreate,
    ProctoringSummary,
)
from backend.services.ai_proctoring_service import ai_proctoring_service
import os
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/ai-proctoring", tags=["AI Proctoring"])

# Enable AI proctoring when the service has been initialized successfully.
# This defers to the service runtime readiness (imports, libs present).
# Keep the routes available in a degraded mode so assessments can still start.
PROCTORING_ENABLED = getattr(ai_proctoring_service, "enabled", False)


@router.post(
    "/session/start",
    response_model=ProctoringSessionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Start AI proctoring session"
)
def start_proctoring_session(
    data: ProctoringSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize AI proctoring when assessment begins."""
    if not PROCTORING_ENABLED:
        return {
            "attempt_id": data.attempt_id,
            "user_id": current_user.id,
            "status": "disabled",
            "integrity_score": 100.0,
            "is_flagged": False,
            "auto_submit_triggered": False,
            "started_at": None,
            "ended_at": None,
            "ai_models_used": [],
        }

    try:
        session = ai_proctoring_service.create_proctoring_session(
            db=db,
            attempt_id=data.attempt_id,
            user_id=current_user.id
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/session/end",
    response_model=ProctoringSessionOut,
    summary="End AI proctoring session"
)
def end_proctoring_session(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """End proctoring session when assessment completes."""
    if not PROCTORING_ENABLED:
        return {
            "attempt_id": attempt_id,
            "user_id": current_user.id,
            "status": "disabled",
            "integrity_score": 100.0,
            "is_flagged": False,
            "auto_submit_triggered": False,
            "started_at": None,
            "ended_at": None,
            "ai_models_used": [],
        }

    try:
        session = ai_proctoring_service.end_proctoring_session(
            db=db,
            attempt_id=attempt_id
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/session/{attempt_id}",
    response_model=ProctoringSessionOut,
    summary="Get proctoring session"
)
def get_proctoring_session(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve proctoring session for an attempt."""
    from backend.models.ai_violation import ProctoringSession
    
    session = db.query(ProctoringSession).filter(
        ProctoringSession.attempt_id == attempt_id,
        ProctoringSession.user_id == current_user.id
    ).first()

    if not session and not PROCTORING_ENABLED:
        return {
            "attempt_id": attempt_id,
            "user_id": current_user.id,
            "status": "disabled",
            "integrity_score": 100.0,
            "is_flagged": False,
            "auto_submit_triggered": False,
            "started_at": None,
            "ended_at": None,
            "ai_models_used": [],
        }
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proctoring session not found"
        )
    
    return session


@router.post(
    "/violations",
    response_model=AIViolationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Log AI-detected violation"
)
def log_violation(
    data: AIViolationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log an AI-detected proctoring violation."""
    if not PROCTORING_ENABLED:
        return {
            "id": 0,
            "attempt_id": data.attempt_id,
            "user_id": current_user.id,
            "violation_type": data.violation_type,
            "severity": "low",
            "confidence_score": data.confidence_score,
            "violation_data": data.violation_data,
            "question_id": data.question_id,
            "session_time_seconds": data.session_time_seconds,
            "detection_timestamp": None,
        }

    try:
        violation = ai_proctoring_service.log_violation(
            db=db,
            attempt_id=data.attempt_id,
            user_id=current_user.id,
            violation_type=data.violation_type,
            violation_data=data.violation_data,
            confidence_score=data.confidence_score,
            question_id=data.question_id,
            session_time_seconds=data.session_time_seconds
        )
        return violation
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/violations/environment",
    response_model=AIViolationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Log environment violation"
)
def log_environment_violation(
    data: EnvironmentViolationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log environment-based violations (tab switch, copy-paste, etc.)."""
    if not PROCTORING_ENABLED:
        return {
            "id": 0,
            "attempt_id": data.attempt_id,
            "user_id": current_user.id,
            "violation_type": data.violation_type,
            "severity": "low",
            "confidence_score": None,
            "violation_data": None,
            "question_id": None,
            "session_time_seconds": data.session_time_seconds,
            "detection_timestamp": None,
        }

    try:
        violation = ai_proctoring_service.log_environment_violation(
            db=db,
            attempt_id=data.attempt_id,
            user_id=current_user.id,
            violation_type=data.violation_type,
            session_time_seconds=data.session_time_seconds
        )
        return violation
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/violations/{attempt_id}",
    response_model=List[AIViolationOut],
    summary="Get violations for attempt"
)
def get_attempt_violations(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all violations for a specific attempt."""
    if not PROCTORING_ENABLED:
        return []

    try:
        violations = ai_proctoring_service.get_session_violations(
            db=db,
            attempt_id=attempt_id
        )
        return violations
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/summary/{attempt_id}",
    response_model=ProctoringSummary,
    summary="Get proctoring summary"
)
def get_proctoring_summary(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete proctoring summary including session and violations."""
    from backend.models.ai_violation import ProctoringSession
    
    session = db.query(ProctoringSession).filter(
        ProctoringSession.attempt_id == attempt_id,
        ProctoringSession.user_id == current_user.id
    ).first()
    
    if not session and not PROCTORING_ENABLED:
        return ProctoringSummary(
            session=None,
            violations=[],
            integrity_score=100.0,
            is_flagged=False,
            should_auto_submit=False,
        )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proctoring session not found"
        )
    
    violations = ai_proctoring_service.get_session_violations(db=db, attempt_id=attempt_id)
    
    return ProctoringSummary(
        session=session,
        violations=violations,
        integrity_score=session.integrity_score,
        is_flagged=session.is_flagged,
        should_auto_submit=session.auto_submit_triggered
    )


@router.post(
    "/process-frame",
    summary="Process video frame for AI proctoring"
)
def process_frame(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process a video frame from frontend for AI proctoring analysis."""
    print(f"AI Proctoring - Process frame called. PROCTORING_ENABLED: {PROCTORING_ENABLED}")
    
    if not PROCTORING_ENABLED:
        print("AI Proctoring - Service disabled, returning empty response")
        return {
            "faces_detected": 0,
            "head_pose": "unknown",
            "alerts": ["AI proctoring not enabled"],
            "violations_detected": 0,
            "violations": []
        }

    try:
        attempt_id = data.get("attempt_id")
        frame_data = data.get("frame_data")  # base64 encoded image
        session_time_seconds = data.get("session_time_seconds", 0)

        print(f"AI Proctoring - Received frame for attempt_id: {attempt_id}, session_time: {session_time_seconds}")

        if not attempt_id or not frame_data:
            print("AI Proctoring - Missing required fields")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="attempt_id and frame_data are required"
            )

        # Decode base64 image to numpy array
        image_bytes = base64.b64decode(frame_data.split(',')[1] if ',' in frame_data else frame_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image using OpenCV
        import cv2
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            print("AI Proctoring - Failed to decode image frame")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to decode image frame"
            )

        print(f"AI Proctoring - Frame decoded successfully, shape: {frame.shape}")

        # Process frame with AI proctoring service
        result = ai_proctoring_service.process_frame(
            db=db,
            attempt_id=attempt_id,
            user_id=current_user.id,
            frame=frame,
            frame_timestamp=0.0,
            session_time_seconds=session_time_seconds
        )

        print(f"AI Proctoring - Processing complete. Faces detected: {result.get('faces_detected')}, Violations: {result.get('violations_detected')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"AI Proctoring - Error processing frame: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Frame processing failed: {str(e)}"
        )


@router.get(
    "/my-sessions",
    response_model=List[ProctoringSessionOut],
    summary="Get user proctoring sessions"
)
def get_my_proctoring_sessions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all proctoring sessions for the authenticated user."""
    from backend.models.ai_violation import ProctoringSession
    
    sessions = db.query(ProctoringSession).filter(
        ProctoringSession.user_id == current_user.id
    ).order_by(ProctoringSession.started_at.desc()).limit(limit).all()
    
    return sessions
