from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from backend.database import get_db
from backend.models.attempt import Attempt
from backend.models.proctor_log import ProctorLog
from backend.models.ai_violation import AIViolation
from backend.models.user import User
from backend.schemas.openapi import PROTECTED_ERRORS, UNAUTHORIZED
from backend.schemas.proctoring import (
    AdminProctoringReportItem,
    AdminProctoringReportResponse,
    ProctorLogCreate,
    ProctorLogSuccess,
    ProctorReportOut,
)
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/proctoring")

# Temporary feature flag to disable proctoring endpoints until re-implementation
PROCTORING_ENABLED = True


class ViolationRequest(BaseModel):
    test_id: int
    violation_type: str
    timestamp: str


def _get_user_attempt(db: Session, attempt_id: int, user_id: int) -> Attempt:
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == attempt_id, Attempt.user_id == user_id)
        .first()
    )
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found",
        )
    return attempt


def _warning_count(logs: list[ProctorLog]) -> int:
    return sum(1 for log in logs if log.severity in {"warning", "critical"})


def _risk_level(warning_count: int) -> str:
    if warning_count >= 3:
        return "high"
    if warning_count >= 2:
        return "medium"
    return "low"


def _proctor_log_to_dict(log: ProctorLog) -> dict:
    """Convert ProctorLog object to dictionary for API response."""
    return {
        "id": log.id,
        "user_id": log.user_id,
        "attempt_id": log.attempt_id,
        "event_type": log.event_type,
        "event_description": log.event_description,
        "severity": log.severity,
        "timestamp": log.timestamp.isoformat() if log.timestamp else None
    }


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this resource",
        )
    return current_user


@router.post(
    "/violation",
    response_model=ProctorLogSuccess,
    status_code=status.HTTP_201_CREATED,
    summary="Log a proctoring violation",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def log_violation(
    data: ViolationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a proctoring violation event for an attempt and return warning state."""
    if not PROCTORING_ENABLED:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Proctoring is temporarily disabled")

    _get_user_attempt(db, data.test_id, current_user.id)

    log = ProctorLog(
        user_id=current_user.id,
        attempt_id=data.test_id,
        event_type=data.violation_type,
        event_description=f"AI Proctoring violation: {data.violation_type}",
        severity="warning",
        timestamp=datetime.fromisoformat(data.timestamp),
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    all_logs = (
        db.query(ProctorLog)
        .filter(ProctorLog.attempt_id == data.test_id)
        .order_by(ProctorLog.timestamp.asc())
        .all()
    )
    warning_count = _warning_count(all_logs)

    return ProctorLogSuccess(
        message="Violation logged successfully",
        log_id=log.id,
        warning_count=warning_count,
        should_auto_submit=warning_count >= 3,
    )


@router.post(
    "/log",
    response_model=ProctorLogSuccess,
    status_code=status.HTTP_201_CREATED,
    summary="Log a proctoring event",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def log_proctor_event(
    data: ProctorLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a proctoring integrity event for an attempt and return warning state."""
    if not PROCTORING_ENABLED:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Proctoring is temporarily disabled")

    _get_user_attempt(db, data.attempt_id, current_user.id)

    log = ProctorLog(
        user_id=current_user.id,
        attempt_id=data.attempt_id,
        event_type=data.event_type,
        event_description=data.event_description,
        severity=data.severity,
        timestamp=data.timestamp,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    all_logs = (
        db.query(ProctorLog)
        .filter(ProctorLog.attempt_id == data.attempt_id)
        .order_by(ProctorLog.timestamp.asc())
        .all()
    )
    warning_count = _warning_count(all_logs)

    return ProctorLogSuccess(
        message="logged successfully",
        log_id=log.id,
        warning_count=warning_count,
        should_auto_submit=warning_count >= 3,
    )


@router.get(
    "/report/{attempt_id}",
    response_model=ProctorReportOut,
    summary="Proctoring report for an attempt",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def get_proctoring_report(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all proctoring events logged during a specific quiz attempt."""
    try:
        if not PROCTORING_ENABLED:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Proctoring is temporarily disabled")

        _get_user_attempt(db, attempt_id, current_user.id)

        # Get traditional proctoring logs
        try:
            logs = (
                db.query(ProctorLog)
                .filter(ProctorLog.attempt_id == attempt_id)
                .order_by(ProctorLog.timestamp.asc())
                .all()
            )
        except Exception as log_error:
            print(f"Error querying proctor logs: {log_error}")
            logs = []

        # Get AI violations and convert to ProctorLog format
        try:
            ai_violations = (
                db.query(AIViolation)
                .filter(AIViolation.attempt_id == attempt_id)
                .order_by(AIViolation.detection_timestamp.asc())
                .all()
            )
        except Exception as ai_error:
            print(f"Error querying AI violations: {ai_error}")
            ai_violations = []

        # Convert AI violations to ProctorLog format for the report
        for ai_violation in ai_violations:
            try:
                severity_map = {
                    'low': 'info',
                    'medium': 'warning',
                    'high': 'warning',
                    'critical': 'critical'
                }
                proctor_log = ProctorLog(
                    user_id=ai_violation.user_id,
                    attempt_id=ai_violation.attempt_id,
                    event_type=ai_violation.violation_type,
                    event_description=f"AI Proctoring: {ai_violation.violation_type}",
                    severity=severity_map.get(ai_violation.severity, 'warning'),
                    timestamp=ai_violation.detection_timestamp or datetime.utcnow()
                )
                logs.append(proctor_log)
            except Exception as conversion_error:
                print(f"Error converting AI violation to proctor log: {conversion_error}")
                continue

        # Sort all logs by timestamp
        try:
            logs.sort(key=lambda x: x.timestamp)
        except Exception as sort_error:
            print(f"Error sorting logs: {sort_error}")

        warning_count = _warning_count(logs)

        return ProctorReportOut(
            attempt_id=attempt_id,
            total_events=len(logs),
            warning_count=warning_count,
            events=[_proctor_log_to_dict(log) for log in logs]
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_proctoring_report: {e}")
        import traceback
        traceback.print_exc()
        # Return empty report if error occurs
        return ProctorReportOut(
            attempt_id=attempt_id,
            total_events=0,
            warning_count=0,
            events=[]
        )


@router.get(
    "/admin/reports",
    response_model=AdminProctoringReportResponse,
    summary="Admin proctoring reports",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def get_admin_proctoring_reports(
    db: Session = Depends(get_db),
    admin_user: User = Depends(_require_admin),
):
    """Return per-assessment proctoring summaries for admin dashboard views."""
    if not PROCTORING_ENABLED:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Proctoring is temporarily disabled")

    _ = admin_user
    attempts = (
        db.query(Attempt)
        .order_by(Attempt.started_at.desc())
        .all()
    )

    reports: list[AdminProctoringReportItem] = []
    for attempt in attempts:
        logs = (
            db.query(ProctorLog)
            .filter(ProctorLog.attempt_id == attempt.id)
            .order_by(ProctorLog.timestamp.asc())
            .all()
        )
        warning_count = _warning_count(logs)
        risk_level = _risk_level(warning_count)
        student_name = attempt.user.full_name if attempt.user else f"User {attempt.user_id}"
        report = ProctorReportOut(
            attempt_id=attempt.id,
            total_events=len(logs),
            warning_count=warning_count,
            risk_level=risk_level,
            events=logs,
        )

        reports.append(
            AdminProctoringReportItem(
                assessment_id=attempt.id,
                student_name=student_name,
                violation_count=warning_count,
                risk_level=risk_level,
                proctoring_report=report,
            )
        )

    return AdminProctoringReportResponse(reports=reports)
