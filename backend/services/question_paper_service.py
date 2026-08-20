from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session, joinedload

from backend.models.question import Question
from types import SimpleNamespace
from backend.models.question_paper import QuestionPaper, QuestionPaperQuestion
from backend.schemas.question_paper import (
    ExamModuleDetail,
    ExamModuleRuleSet,
    ExamModuleSummary,
    QuestionPaperCreate,
    QuestionPaperOut,
    QuestionPaperQuestionCreate,
    QuestionPaperQuestionOut,
    QuestionPaperSummary,
    QuestionPaperUpdate,
)


EXAM_MODULE_DESCRIPTIONS = {
    "CBSE": "Central Board paper practice with year-wise, subject-wise, and topic-wise preparation.",
    "ICSE": "ICSE previous year paper preparation with balanced theory and application coverage.",
    "State Board": "State board aligned paper practice with board and subject specific filtering.",
    "IIT-JEE": "Engineering entrance preparation with advanced physics, chemistry, and math papers.",
    "NEET": "Medical entrance preparation with biology, chemistry, and physics paper drills.",
    "UPSC": "Civil services paper practice with objective and descriptive preparation support.",
    "University Exams": "University-semester and annual paper practice with subject-focused browsing.",
}


class QuestionPaperService:
    @staticmethod
    def to_slug(exam_category: str) -> str:
        return "-".join(part for part in exam_category.lower().replace("&", "and").replace("/", " ").split() if part)

    @staticmethod
    def category_from_slug(slug: str) -> Optional[str]:
        normalized = slug.strip().lower()
        for category in EXAM_MODULE_DESCRIPTIONS:
            if QuestionPaperService.to_slug(category) == normalized:
                return category
        return None

    @staticmethod
    def _module_summary(exam_category: str, papers: list[QuestionPaper]) -> ExamModuleSummary:
        years = sorted({paper.year for paper in papers}, reverse=True)
        subjects = sorted({paper.subject for paper in papers if paper.subject})
        topics = sorted({paper.topic_name for paper in papers if paper.topic_name})
        published_papers = sum(1 for paper in papers if paper.is_published)
        return ExamModuleSummary(
            exam_category=exam_category,
            slug=QuestionPaperService.to_slug(exam_category),
            display_name=exam_category,
            description=EXAM_MODULE_DESCRIPTIONS.get(exam_category, "Previous year question paper practice module."),
            instructions=[
                "Each assessment runs for a minimum of 60 minutes.",
                "Use fullscreen mode and keep proctoring checks active during attempts.",
                "Papers with fewer than 41 imported questions are preview-only.",
            ],
            rules=ExamModuleRuleSet(),
            total_papers=len(papers),
            published_papers=published_papers,
            years=years,
            subjects=subjects,
            topics=topics,
        )

    @staticmethod
    def serialize_summary(paper: QuestionPaper) -> QuestionPaperSummary:
        return QuestionPaperSummary(
            id=paper.id,
            exam_category=paper.exam_category,
            board=paper.board,
            exam_name=paper.exam_name,
            year=paper.year,
            academic_year=paper.academic_year,
            class_name=paper.class_name,
            subject=paper.subject,
            topic_name=paper.topic_name,
            subtopic_name=paper.subtopic_name,
            question_type=paper.question_type,
            difficulty=paper.difficulty,
            language=paper.language,
            total_questions=paper.total_questions,
            total_marks=paper.total_marks,
            pdf_url=paper.pdf_url,
            answer_key_url=paper.answer_key_url,
            source=paper.source,
            is_published=paper.is_published,
            created_at=paper.created_at.isoformat(),
            updated_at=paper.updated_at.isoformat(),
        )

    @staticmethod
    def serialize_item(item: QuestionPaperQuestion) -> QuestionPaperQuestionOut:
        question = item.question
        options = item.options_snapshot if item.options_snapshot is not None else (question.options if question else None)
        explanation = item.explanation_snapshot if item.explanation_snapshot is not None else (question.explanation if question else None)
        return QuestionPaperQuestionOut(
            id=item.id,
            question_number=item.question_number,
            question_id=item.question_id,
            topic_id=item.topic_id,
            subtopic_id=item.subtopic_id,
            question_type=item.question_type,
            difficulty=item.difficulty,
            marks=item.marks,
            question_text_snapshot=item.question_text_snapshot or (question.text if question else None),
            options_snapshot=options,
            correct_option_snapshot=item.correct_option_snapshot or (question.correct_option if question else None),
            explanation_snapshot=explanation,
            meta_data=item.meta_data,
        )

    @staticmethod
    def serialize_detail(paper: QuestionPaper) -> QuestionPaperOut:
        return QuestionPaperOut(
            **QuestionPaperService.serialize_summary(paper).model_dump(),
            meta_data=paper.meta_data,
            questions=[QuestionPaperService.serialize_item(item) for item in paper.questions],
        )

    @staticmethod
    def _apply_question_snapshot(question: Question, data: QuestionPaperQuestionCreate) -> QuestionPaperQuestion:
        return QuestionPaperQuestion(
            question_id=question.id,
            question_number=data.question_number,
            topic_id=data.topic_id or question.topic_id,
            subtopic_id=data.subtopic_id if data.subtopic_id is not None else question.subtopic_id,
            question_type=data.question_type,
            difficulty=data.difficulty,
            marks=data.marks,
            question_text_snapshot=data.question_text_snapshot or question.text,
            options_snapshot=data.options_snapshot or list(question.options or []),
            correct_option_snapshot=data.correct_option_snapshot or question.correct_option,
            explanation_snapshot=data.explanation_snapshot or question.explanation,
            meta_data=data.meta_data,
        )

    @staticmethod
    def create(db: Session, data: QuestionPaperCreate, created_by_id: Optional[int] = None) -> QuestionPaper:
        paper = QuestionPaper(
            exam_category=data.exam_category,
            board=data.board,
            exam_name=data.exam_name,
            year=data.year,
            academic_year=data.academic_year,
            class_name=data.class_name,
            subject=data.subject,
            topic_name=data.topic_name,
            subtopic_name=data.subtopic_name,
            question_type=data.question_type,
            difficulty=data.difficulty,
            language=data.language,
            total_marks=data.total_marks,
            pdf_url=data.pdf_url,
            answer_key_url=data.answer_key_url,
            source=data.source,
            meta_data=data.meta_data,
            is_published=data.is_published,
            created_by=created_by_id,
        )
        db.add(paper)
        db.flush()

        for question_input in data.questions:
            question = db.query(Question).filter(Question.id == question_input.question_id).first()
            if not question:
                raise ValueError(f"Question {question_input.question_id} not found")
            paper.questions.append(QuestionPaperService._apply_question_snapshot(question, question_input))

        paper.total_questions = len(paper.questions)
        if paper.total_marks <= 0:
            paper.total_marks = sum(item.marks for item in paper.questions)

        db.commit()
        db.refresh(paper)
        return paper

    @staticmethod
    def update(db: Session, paper: QuestionPaper, data: QuestionPaperUpdate) -> QuestionPaper:
        values = data.model_dump(exclude_unset=True)
        for key, value in values.items():
            setattr(paper, key, value)
        db.commit()
        db.refresh(paper)
        return paper

    @staticmethod
    def delete(db: Session, paper: QuestionPaper) -> None:
        db.delete(paper)
        db.commit()

    @staticmethod
    def list(
        db: Session,
        *,
        query: Optional[str] = None,
        exam_category: Optional[str] = None,
        board: Optional[str] = None,
        subject: Optional[str] = None,
        year: Optional[int] = None,
        class_name: Optional[str] = None,
        question_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        published_only: bool = True,
    ) -> list[QuestionPaper]:
        q = db.query(QuestionPaper)
        if published_only:
            q = q.filter(QuestionPaper.is_published.is_(True))
        if query:
            wildcard = f"%{query}%"
            q = q.filter(
                (QuestionPaper.exam_name.ilike(wildcard))
                | (QuestionPaper.subject.ilike(wildcard))
                | (QuestionPaper.board.ilike(wildcard))
                | (QuestionPaper.topic_name.ilike(wildcard))
            )
        if exam_category:
            q = q.filter(QuestionPaper.exam_category == exam_category)
        if board:
            q = q.filter(QuestionPaper.board == board)
        if subject:
            q = q.filter(QuestionPaper.subject == subject)
        if year:
            q = q.filter(QuestionPaper.year == year)
        if class_name:
            q = q.filter(QuestionPaper.class_name == class_name)
        if question_type:
            q = q.filter(QuestionPaper.question_type == question_type)
        if difficulty:
            q = q.filter(QuestionPaper.difficulty == difficulty)
        return q.order_by(QuestionPaper.year.desc(), QuestionPaper.created_at.desc()).all()

    @staticmethod
    def get(db: Session, paper_id: int, published_only: bool = True) -> Optional[QuestionPaper]:
        q = (
            db.query(QuestionPaper)
            .options(joinedload(QuestionPaper.questions).joinedload(QuestionPaperQuestion.question))
            .filter(QuestionPaper.id == paper_id)
        )
        if published_only:
            q = q.filter(QuestionPaper.is_published.is_(True))
        return q.first()

    @staticmethod
    def select_questions(
        db: Session,
        paper_id: int,
        topic_id: Optional[int] = None,
        subtopic_id: Optional[int] = None,
        question_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> list[Question]:
        paper = QuestionPaperService.get(db, paper_id, published_only=True)
        if not paper:
            raise ValueError("Question paper not found")
        items = list(paper.questions)
        if topic_id is not None:
            items = [item for item in items if item.topic_id == topic_id]
        if subtopic_id is not None:
            items = [item for item in items if item.subtopic_id == subtopic_id]
        if question_type is not None:
            items = [item for item in items if item.question_type == question_type]
        if difficulty is not None:
            items = [item for item in items if item.difficulty == difficulty]
        if limit is not None:
            items = items[:limit]

        # Resolve Question objects: prefer the joined relationship but fall back
        # to constructing lightweight objects from the paper snapshots when the
        # original Question rows are missing. This ensures previews and starts
        # can operate using the stored snapshots.
        resolved: list[Question] = []
        missing_ids: list[int] = []
        item_map: dict[int, 'QuestionPaperQuestion'] = {}
        for item in items:
            item_map[item.question_number] = item
            if item.question is not None:
                resolved.append(item.question)
            else:
                if item.question_id is not None:
                    missing_ids.append(item.question_id)

        found = []
        if missing_ids:
            found = db.query(Question).filter(Question.id.in_(missing_ids)).all()

        found_map = {q.id: q for q in found}

        # Build final list preserving the paper ordering
        ordered: list[Question] = []
        for item in items:
            if item.question is not None:
                ordered.append(item.question)
                continue

            qid = item.question_id
            if qid in found_map:
                ordered.append(found_map[qid])
                continue

            # Construct lightweight question-like object from snapshots
            # so calling code can access expected attributes.
            temp = SimpleNamespace(
                id=item.question_id or 0,
                topic_id=item.topic_id,
                subtopic_id=item.subtopic_id,
                question_type=item.question_type,
                difficulty=item.difficulty,
                marks=item.marks,
                text=item.question_text_snapshot,
                options=item.options_snapshot,
                correct_option=item.correct_option_snapshot,
                explanation=item.explanation_snapshot,
            )
            ordered.append(temp)

        if not ordered:
            raise ValueError("No questions available for this question paper")

        return ordered

    @staticmethod
    def list_exam_modules(db: Session, published_only: bool = True) -> list[ExamModuleSummary]:
        q = db.query(QuestionPaper)
        if published_only:
            q = q.filter(QuestionPaper.is_published.is_(True))
        papers = q.order_by(QuestionPaper.year.desc(), QuestionPaper.created_at.desc()).all()

        grouped: dict[str, list[QuestionPaper]] = {}
        for paper in papers:
            grouped.setdefault(paper.exam_category, []).append(paper)

        modules: list[ExamModuleSummary] = []
        for category in EXAM_MODULE_DESCRIPTIONS:
            category_papers = grouped.get(category, [])
            modules.append(QuestionPaperService._module_summary(category, category_papers))

        return modules

    @staticmethod
    def get_exam_module(db: Session, exam_category: str, published_only: bool = True) -> ExamModuleDetail:
        papers = QuestionPaperService.list(
            db,
            exam_category=exam_category,
            published_only=published_only,
        )
        recent_years = sorted({paper.year for paper in papers}, reverse=True)[:10]
        if recent_years:
            papers = [paper for paper in papers if paper.year in set(recent_years)]
        summary = QuestionPaperService._module_summary(exam_category, papers)
        return ExamModuleDetail(
            **summary.model_dump(),
            papers=[QuestionPaperService.serialize_summary(item) for item in papers],
        )


question_paper_service = QuestionPaperService()