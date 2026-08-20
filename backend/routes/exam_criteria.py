from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User
from backend.routes.admin import get_current_admin
from backend.schemas.exam_criteria import (
    ExamCriteriaCreate,
    ExamCriteriaListOut,
    ExamCriteriaOut,
    ExamCriteriaUpdate,
)
from backend.schemas.openapi import UNAUTHORIZED
from backend.services.exam_criteria_service import exam_criteria_service
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/exam-criteria", tags=["Exam Criteria"])


@router.get(
    "",
    response_model=ExamCriteriaListOut,
    summary="List active examination criteria",
    responses={**UNAUTHORIZED},
)
def list_exam_criteria(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = [exam_criteria_service.serialize(c) for c in exam_criteria_service.list_active(db)]
    return ExamCriteriaListOut(items=items, total=len(items))


@router.get(
    "/admin",
    response_model=ExamCriteriaListOut,
    summary="List all examination criteria for admins",
)
def admin_list_exam_criteria(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    items = [exam_criteria_service.serialize(c) for c in exam_criteria_service.list_all(db)]
    return ExamCriteriaListOut(items=items, total=len(items))


@router.get(
    "/{criteria_id}",
    response_model=ExamCriteriaOut,
    summary="Get one examination criteria",
    responses={**UNAUTHORIZED},
)
def get_exam_criteria(
    criteria_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    criteria = exam_criteria_service.get(db, criteria_id, active_only=current_user.role != "admin")
    if not criteria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam criteria not found")
    return exam_criteria_service.serialize(criteria)


@router.post(
    "",
    response_model=ExamCriteriaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create examination criteria",
)
def create_exam_criteria(
    data: ExamCriteriaCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        criteria = exam_criteria_service.create(db, data, admin)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return exam_criteria_service.serialize(criteria)


@router.put(
    "/{criteria_id}",
    response_model=ExamCriteriaOut,
    summary="Update examination criteria",
)
def update_exam_criteria(
    criteria_id: int,
    data: ExamCriteriaUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    criteria = exam_criteria_service.get(db, criteria_id)
    if not criteria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam criteria not found")
    try:
        criteria = exam_criteria_service.update(db, criteria, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return exam_criteria_service.serialize(criteria)


@router.delete(
    "/{criteria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate examination criteria",
)
def delete_exam_criteria(
    criteria_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    criteria = exam_criteria_service.get(db, criteria_id)
    if not criteria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam criteria not found")
    criteria.is_active = False
    db.commit()
    return None
