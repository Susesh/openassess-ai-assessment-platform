import uuid

from sqlalchemy.orm import Session

from backend.models.certification import Certification

PASS_THRESHOLD = 80


def check_and_award_cert(user_id: int, topic_id: int, percentage: float, db: Session) -> bool:
    """
    Awards a certificate if user scored 80%+ on a topic they haven't certified yet.
    Returns True if a new cert was awarded, False otherwise.
    """
    if percentage < PASS_THRESHOLD:
        return False

    existing = db.query(Certification).filter_by(
        user_id=user_id,
        topic_id=topic_id,
    ).first()

    if existing:
        return False

    cert = Certification(
        user_id=user_id,
        topic_id=topic_id,
        score=percentage,
        certificate_code=str(uuid.uuid4()),
    )
    db.add(cert)
    db.commit()
    return True
