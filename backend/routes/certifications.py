import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.attempt import Attempt
from backend.models.certification import Certification
from backend.models.topic import Topic
from backend.models.user import User
from backend.schemas.certification import CertificationGenerate, CertificationOut
from backend.schemas.openapi import CONFLICT, PROTECTED_ERRORS, UNAUTHORIZED
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/certifications")

PASS_THRESHOLD = 80


def _topic_average_score(db: Session, user_id: int, topic_id: int) -> float:
    attempts = (
        db.query(Attempt)
        .filter(
            Attempt.user_id == user_id,
            Attempt.topic_id == topic_id,
            Attempt.completed_at.isnot(None),
        )
        .all()
    )
    if not attempts:
        return 0.0
    return round(sum(a.percentage for a in attempts) / len(attempts), 1)


@router.post(
    "/generate",
    response_model=CertificationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a topic certificate",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS, **CONFLICT},
)
def generate_certification(
    body: CertificationGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Issue a certificate when the user's average score on a topic is at least 80%."""
    topic = db.query(Topic).filter(Topic.id == body.topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    existing = (
        db.query(Certification)
        .filter(
            Certification.user_id == current_user.id,
            Certification.topic_id == body.topic_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Certification already exists for this topic",
        )

    avg_score = _topic_average_score(db, current_user.id, body.topic_id)
    # Use topic's configurable passing_score, default to 80 if not set
    passing_threshold = topic.passing_score if topic and topic.passing_score else 80.0
    if avg_score < passing_threshold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Average score {avg_score}% is below the {passing_threshold}% requirement",
        )

    cert = Certification(
        user_id=current_user.id,
        topic_id=body.topic_id,
        score=avg_score,
        certificate_code=str(uuid.uuid4()),
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return CertificationOut(
        id=cert.id,
        topic_id=cert.topic_id,
        topic_name=topic.name,
        score=cert.score,
        issued_at=cert.issued_at,
        certificate_code=cert.certificate_code,
    )


@router.get(
    "/me",
    response_model=List[CertificationOut],
    summary="List my certifications",
    responses={**UNAUTHORIZED},
)
def get_my_certifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return every certificate earned by the authenticated user, newest first."""
    certs = (
        db.query(Certification)
        .filter(Certification.user_id == current_user.id)
        .order_by(Certification.issued_at.desc())
        .all()
    )

    result = []
    for cert in certs:
        topic = db.query(Topic).filter(Topic.id == cert.topic_id).first()
        result.append(
            CertificationOut(
                id=cert.id,
                topic_id=cert.topic_id,
                topic_name=topic.name if topic else "Unknown",
                score=cert.score,
                issued_at=cert.issued_at,
                certificate_code=cert.certificate_code,
            )
        )
    return result
