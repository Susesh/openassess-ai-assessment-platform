from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User
from backend.routes.admin import get_current_admin
from backend.schemas.openapi import UNAUTHORIZED
from backend.schemas.question_paper import (
    ExamModuleDetail,
    ExamModuleListOut,
    QuestionPaperCreate,
    QuestionPaperImportPayload,
    QuestionPaperListOut,
    QuestionPaperOut,
    QuestionPaperUpdate,
)
from backend.services.question_paper_service import question_paper_service
from backend.utils.auth_utils import get_current_user
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/question-papers", tags=["Question Papers"])


@router.get("/exam-modules", response_model=ExamModuleListOut, responses={**UNAUTHORIZED})
def list_exam_modules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    published_only = current_user.role != "admin"
    items = question_paper_service.list_exam_modules(db, published_only=published_only)
    return ExamModuleListOut(items=items, total=len(items))


@router.get("/exam-modules/{exam_slug}", response_model=ExamModuleDetail, responses={**UNAUTHORIZED})
def get_exam_module(
    exam_slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = question_paper_service.category_from_slug(exam_slug)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam module not found")

    published_only = current_user.role != "admin"
    return question_paper_service.get_exam_module(db, category, published_only=published_only)


@router.get("", response_model=QuestionPaperListOut, responses={**UNAUTHORIZED})
def list_question_papers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    query: str | None = Query(None),
    exam_category: str | None = Query(None),
    board: str | None = Query(None),
    subject: str | None = Query(None),
    year: int | None = Query(None),
    class_name: str | None = Query(None),
    question_type: str | None = Query(None),
    difficulty: str | None = Query(None),
):
    published_only = current_user.role != "admin"
    items = question_paper_service.list(
        db,
        query=query,
        exam_category=exam_category,
        board=board,
        subject=subject,
        year=year,
        class_name=class_name,
        question_type=question_type,
        difficulty=difficulty,
        published_only=published_only,
    )
    return QuestionPaperListOut(items=[question_paper_service.serialize_summary(item) for item in items], total=len(items))


@router.get("/{paper_id}", response_model=QuestionPaperOut, responses={**UNAUTHORIZED})
def get_question_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = question_paper_service.get(db, paper_id, published_only=current_user.role != "admin")
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found")
    return question_paper_service.serialize_detail(paper)


@router.post("", response_model=QuestionPaperOut, status_code=status.HTTP_201_CREATED)
def create_question_paper(
    data: QuestionPaperCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        paper = question_paper_service.create(db, data, admin.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return question_paper_service.serialize_detail(paper)


@router.put("/{paper_id}", response_model=QuestionPaperOut)
def update_question_paper(
    paper_id: int,
    data: QuestionPaperUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    paper = question_paper_service.get(db, paper_id, published_only=False)
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found")
    paper = question_paper_service.update(db, paper, data)
    return question_paper_service.serialize_detail(paper)


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    paper = question_paper_service.get(db, paper_id, published_only=False)
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found")
    question_paper_service.delete(db, paper)
    return None


@router.post("/import", response_model=QuestionPaperOut, status_code=status.HTTP_201_CREATED)
def import_question_paper(
    data: QuestionPaperImportPayload,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    paper = question_paper_service.create(db, data.paper, admin.id)
    return question_paper_service.serialize_detail(paper)


@router.get("/{paper_id}/download")
def download_question_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = question_paper_service.get(db, paper_id, published_only=current_user.role != "admin")
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found")
    payload = question_paper_service.serialize_detail(paper).model_dump()
    filename = f"{paper.exam_name.replace(' ', '_')}_{paper.year}.json"
    headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
    return JSONResponse(content=payload, headers=headers)