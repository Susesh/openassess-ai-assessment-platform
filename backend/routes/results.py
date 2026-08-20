from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models.attempt import Attempt
from backend.models.user import User
from backend.schemas.openapi import UNAUTHORIZED
from backend.schemas.result import ResultSummaryOut
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/results")


@router.get(
    "",
    response_model=List[ResultSummaryOut],
    summary="List my completed assessment results",
    responses={**UNAUTHORIZED},
)
def get_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = (
        db.query(Attempt)
        .options(joinedload(Attempt.topic))
        .filter(Attempt.user_id == current_user.id, Attempt.completed_at.isnot(None))
        .order_by(Attempt.completed_at.desc())
        .all()
    )
    return [
        ResultSummaryOut(
            attempt_id=attempt.id,
            topic_id=attempt.topic_id,
            topic_name=attempt.topic.name if attempt.topic else "Unknown",
            score=attempt.score,
            total=attempt.total_questions,
            percentage=attempt.percentage,
            passed=attempt.is_passed,
            completed_at=attempt.completed_at,
        )
        for attempt in attempts
    ]
