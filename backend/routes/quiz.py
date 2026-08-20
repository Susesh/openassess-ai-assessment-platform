import asyncio
import random
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models.attempt import Attempt
from backend.models.question import Question
from backend.models.result import Result
from backend.models.question_paper import QuestionPaper
from backend.models.topic import Subtopic, Topic
from backend.models.user import User
from backend.schemas.openapi import PROTECTED_ERRORS, UNAUTHORIZED
from backend.schemas.quiz import (
    QuestionResultItem,
    QuizAttemptSummary,
    QuizAutosave,
    QuizAutosaveOut,
    QuizQuestionOut,
    QuizResumeOut,
    QuizResult,
    QuizStart,
    QuizStartOut,
    QuizStatusOut,
    QuizSubmit,
)
from backend.services.ai_service import get_ai_explanation
from backend.services.certificate_service import (
    create_certificates_for_assessment,
    serialize_certificate,
)
from backend.services.adaptive_engine import AdaptiveEngine
from backend.services.adaptive_difficulty_service import adaptive_difficulty_service
from backend.services.exam_criteria_service import MIN_EXAM_DURATION_MINUTES, exam_criteria_service
from backend.services.question_paper_service import question_paper_service
from backend.services.portfolio_service import PortfolioService
from backend.services.subtopic_certification_service import subtopic_certification_service
from backend.services.assessment_service import assessment_service
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/quiz")

PASS_THRESHOLD_PERCENT = 80
OPTION_INDEX = {"A": 0, "B": 1, "C": 2, "D": 3}
MIN_QUESTION_PAPER_QUESTIONS = 60


def _fetch_random_questions(
    db: Session,
    topic_id: int,
    subtopic_id: Optional[int],
    limit: int,
    difficulty: Optional[str] = None,
    exam_module: Optional[str] = None,
) -> List[Question]:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    if subtopic_id is not None:
        subtopic = (
            db.query(Subtopic)
            .filter(Subtopic.id == subtopic_id, Subtopic.topic_id == topic_id)
            .first()
        )
        if not subtopic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subtopic not found for this topic",
            )

    query = db.query(Question).filter(Question.topic_id == topic_id)
    if subtopic_id is not None:
        query = query.filter(Question.subtopic_id == subtopic_id)
    if difficulty is not None:
        query = query.filter(Question.difficulty == difficulty)
    if exam_module is not None:
        query = query.filter(Question.exam_module == exam_module)

    questions = query.order_by(func.random()).limit(limit).all()
    if len(questions) < limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough questions available (found {len(questions)}, need {limit})",
        )
    return questions


def _format_option_label(options: List[str], letter: str) -> str:
    idx = OPTION_INDEX.get(letter)
    if idx is not None and idx < len(options):
        return f"{letter}: {options[idx]}"
    return letter


def _remaining_seconds(attempt: Attempt) -> int:
    if not attempt.deadline_at:
        return 0
    return max(0, int((attempt.deadline_at - datetime.utcnow()).total_seconds()))


def _normalize_answer(answer: Optional[str]) -> str:
    if answer is None:
        return ""
    return " ".join(answer.strip().lower().split())


def _is_correct_answer(question: Question, selected_option: Optional[str]) -> bool:
    """Enhanced answer validation supporting multiple question types."""
    if selected_option is None:
        return False

    question_type = (question.question_type or "mcq").lower()
    
    # Use assessment service for enhanced grading
    return assessment_service.grade_answer(question, selected_option)


def _ensure_attempt_open(attempt: Attempt):
    if attempt.completed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz attempt has already been submitted",
        )


def _answers_to_snapshot(answers: List) -> dict:
    return {
        str(answer.question_id): answer.selected_option
        for answer in answers
    }


def _time_to_snapshot(answers: List) -> dict:
    return {
        str(answer.question_id): max(0, answer.time_spent_seconds)
        for answer in answers
    }


def _merge_snapshots(attempt: Attempt, answers: List):
    saved_answers = dict(attempt.answers_snapshot or {})
    saved_time = dict(attempt.per_question_time or {})
    for answer in answers:
        key = str(answer.question_id)
        saved_answers[key] = answer.selected_option
        saved_time[key] = max(int(saved_time.get(key, 0) or 0), answer.time_spent_seconds)
    attempt.answers_snapshot = saved_answers
    attempt.per_question_time = saved_time


def _ordered_attempt_questions(db: Session, attempt: Attempt) -> List[Question]:
    ids = [int(qid) for qid in (attempt.question_ids or [])]
    if not ids:
        return []

    by_id = {
        q.id: q
        for q in db.query(Question).filter(Question.id.in_(ids)).all()
    }
    return [by_id[qid] for qid in ids if qid in by_id]


async def _attach_ai_explanations(
    breakdown: List[QuestionResultItem],
    questions_by_id: Dict[int, Question],
) -> List[QuestionResultItem]:
    wrong_items = [item for item in breakdown if not item.is_correct]
    if not wrong_items:
        return breakdown

    tasks = []
    for item in wrong_items:
        question = questions_by_id[item.question_id]
        selected_label = _format_option_label(question.options, item.selected_option)
        correct_label = _format_option_label(question.options, item.correct_option)
        tasks.append(
            get_ai_explanation(
                question_text=question.text,
                selected=selected_label,
                correct=correct_label,
                explanation=question.explanation,
            )
        )

    ai_texts = await asyncio.gather(*tasks)
    ai_by_id = {item.question_id: text for item, text in zip(wrong_items, ai_texts)}

    return [
        item.model_copy(update={"ai_explanation": ai_by_id.get(item.question_id)})
        if not item.is_correct
        else item
        for item in breakdown
    ]


@router.post(
    "/start",
    response_model=QuizStartOut,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new quiz attempt",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def start_quiz(
    body: QuizStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch random questions (adaptive), create an attempt, and return questions without answers."""
    try:
        # Reduced minimum for development/testing - can be increased for production
        minimum_question_count = 5

        if body.paper_id:
            paper = question_paper_service.get(db, body.paper_id, published_only=True)
            if not paper:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found")

            # Fast-fail when the stored paper metadata shows insufficient questions.
            if getattr(paper, "total_questions", 0) < minimum_question_count:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question paper must include at least {minimum_question_count} questions before assessment can start",
                )

            try:
                questions = question_paper_service.select_questions(
                    db,
                    body.paper_id,
                    topic_id=body.topic_id,
                    subtopic_id=body.subtopic_id,
                    question_type=None,
                    difficulty=None,
                    limit=None,
                )
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

            if len(questions) < minimum_question_count:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question paper must include at least {minimum_question_count} questions before assessment can start",
                )

            criteria = exam_criteria_service.from_topic(
                db,
                body.topic_id or questions[0].topic_id,
                body.subtopic_id,
                len(questions),
            )
            criteria.exam_name = paper.exam_name
            criteria.board = paper.board
            criteria.subject = paper.subject
            criteria.duration_minutes = max(MIN_EXAM_DURATION_MINUTES, len(questions) * 3)
            exam_criteria_id = None
        elif body.exam_criteria_id:
            criteria = exam_criteria_service.get(db, body.exam_criteria_id, active_only=True)
            if not criteria:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam criteria not found")
            if criteria.maximum_attempts > 0:
                attempts_used = exam_criteria_service.count_completed_attempts(
                    db, current_user.id, criteria.id
                )
                if attempts_used >= criteria.maximum_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Maximum attempts reached for this assessment",
                    )
            questions = exam_criteria_service.select_questions(db, current_user.id, criteria)
            exam_criteria_id = criteria.id
        else:
            if not body.topic_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="topic_id or exam_criteria_id is required")
            criteria = exam_criteria_service.from_topic(
                db, body.topic_id, body.subtopic_id, max(minimum_question_count, body.num_questions)
            )
            questions = AdaptiveEngine.get_adaptive_questions(
                db,
                current_user.id,
                criteria.topic_id,
                criteria.subtopic_id,
                criteria.total_questions,
            )
            exam_criteria_id = None
        
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough questions available",
            )

        if len(questions) < minimum_question_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Assessment must contain at least {minimum_question_count} questions",
            )

        random.shuffle(questions)

        server_started_at = datetime.utcnow()
        deadline_at = exam_criteria_service.deadline_from_now(criteria.duration_minutes)
        duration_minutes = assessment_service.validate_duration(criteria.duration_minutes)
        
        # Initialize question status tracking
        question_ids = [q.id for q in questions]
        question_status = assessment_service.initialize_question_status(question_ids)
        
        attempt = Attempt(
            user_id=current_user.id,
            topic_id=criteria.topic_id,
            exam_criteria_id=exam_criteria_id,
            question_paper_id=body.paper_id if body.paper_id else None,
            started_at=server_started_at,
            server_started_at=server_started_at,
            deadline_at=deadline_at,
            completed_at=None,
            score=0,
            raw_score=0.0,
            total_marks=float(criteria.total_marks),
            passing_percentage=float(criteria.passing_percentage),
            negative_marking=float(criteria.negative_marking),
            total_questions=len(questions),
            duration_minutes=duration_minutes,
            is_passed=False,
            question_ids=question_ids,
            answers_snapshot={str(q.id): None for q in questions},
            per_question_time={str(q.id): 0 for q in questions},
            question_status=question_status,
            marked_for_review=[],
            criteria_snapshot=exam_criteria_service.build_attempt_snapshot(criteria),
            proctoring_enabled=criteria.ai_proctoring_enabled,
            video_recording_enabled=criteria.video_recording_enabled,
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        return QuizStartOut(
            attempt_id=attempt.id,
            questions=[QuizQuestionOut.model_validate(q) for q in questions],
            exam_name=criteria.exam_name,
            duration_minutes=duration_minutes,
            server_started_at=server_started_at.isoformat(),
            deadline_at=deadline_at.isoformat(),
            remaining_seconds=_remaining_seconds(attempt),
            total_marks=float(criteria.total_marks),
            passing_percentage=float(criteria.passing_percentage),
            negative_marking=float(criteria.negative_marking),
            video_recording_enabled=criteria.video_recording_enabled,
            ai_proctoring_enabled=criteria.ai_proctoring_enabled,
            certificate_enabled=criteria.certificate_enabled,
            instructions=criteria.instructions,
            saved_answers={k: v for k, v in (attempt.answers_snapshot or {}).items() if v is not None},
            per_question_time=attempt.per_question_time or {},
            question_status=attempt.question_status or {},
            marked_for_review=attempt.marked_for_review or [],
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in start_quiz: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start quiz: {str(e)}"
        )


@router.get(
    "/history",
    response_model=List[QuizAttemptSummary],
    summary="List recent completed quiz attempts",
    responses={**UNAUTHORIZED},
)
def get_quiz_history(
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
        QuizAttemptSummary(
            attempt_id=attempt.id,
            topic_id=attempt.topic_id,
            topic_name=attempt.topic.name if attempt.topic else "Unknown",
            score=attempt.score,
            total_questions=attempt.total_questions,
            passed=attempt.is_passed,
            created_at=attempt.completed_at or attempt.started_at,
        )
        for attempt in attempts
    ]


@router.get(
    "/status/{attempt_id}",
    response_model=QuizStatusOut,
    summary="Get attempt timer and saved answer state",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def get_quiz_status(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    return QuizStatusOut(
        attempt_id=attempt.id,
        is_submitted=attempt.completed_at is not None,
        remaining_seconds=_remaining_seconds(attempt),
        server_now=datetime.utcnow(),
        deadline_at=attempt.deadline_at,
        saved_answers=attempt.answers_snapshot or {},
        per_question_time=attempt.per_question_time or {},
        question_status=attempt.question_status or {},
        marked_for_review=attempt.marked_for_review or [],
    )


@router.get(
    "/resume/{attempt_id}",
    response_model=QuizResumeOut,
    summary="Resume an existing quiz attempt",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def resume_quiz(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    questions = _ordered_attempt_questions(db, attempt)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions found for this attempt",
        )

    snapshot = attempt.criteria_snapshot or {}
    duration_minutes = max(
        MIN_EXAM_DURATION_MINUTES,
        int(snapshot.get("duration_minutes") or attempt.duration_minutes or MIN_EXAM_DURATION_MINUTES),
    )
    exam_name = snapshot.get("exam_name")
    if not exam_name:
        topic = db.query(Topic).filter(Topic.id == attempt.topic_id).first()
        exam_name = f"{topic.name} Assessment" if topic else "Assessment"

    return QuizResumeOut(
        attempt_id=attempt.id,
        questions=[QuizQuestionOut.model_validate(q) for q in questions],
        is_submitted=attempt.completed_at is not None,
        exam_name=exam_name,
        duration_minutes=duration_minutes,
        server_started_at=attempt.server_started_at.isoformat() if attempt.server_started_at else None,
        deadline_at=attempt.deadline_at.isoformat() if attempt.deadline_at else None,
        remaining_seconds=_remaining_seconds(attempt),
        total_marks=float(snapshot.get("total_marks") or attempt.total_marks or len(questions)),
        passing_percentage=float(snapshot.get("passing_percentage") or attempt.passing_percentage or 40.0),
        negative_marking=float(snapshot.get("negative_marking") or attempt.negative_marking or 0.0),
        video_recording_enabled=bool(snapshot.get("video_recording_enabled", True)),
        ai_proctoring_enabled=bool(snapshot.get("ai_proctoring_enabled", True)),
        certificate_enabled=bool(snapshot.get("certificate_enabled", True)),
        instructions=snapshot.get("instructions"),
        saved_answers=attempt.answers_snapshot or {},
        per_question_time=attempt.per_question_time or {},
        question_status=attempt.question_status or {},
        marked_for_review=attempt.marked_for_review or [],
    )


@router.post(
    "/autosave",
    response_model=QuizAutosaveOut,
    summary="Autosave answers for an in-progress attempt",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def autosave_quiz(
    body: QuizAutosave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == body.attempt_id, Attempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    _ensure_attempt_open(attempt)

    allowed_ids = set(attempt.question_ids or [])
    for answer in body.answers:
        if answer.question_id not in allowed_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Answers must match the questions from this attempt",
            )

    _merge_snapshots(attempt, body.answers)
    attempt.time_spent_seconds = sum(int(v or 0) for v in (attempt.per_question_time or {}).values())
    
    # Update question status if provided
    if hasattr(body, 'question_status') and body.question_status:
        attempt.question_status = body.question_status
    
    if hasattr(body, 'marked_for_review') and body.marked_for_review is not None:
        attempt.marked_for_review = body.marked_for_review
    
    db.commit()

    return QuizAutosaveOut(
        attempt_id=attempt.id,
        saved_at=datetime.utcnow(),
        remaining_seconds=_remaining_seconds(attempt),
        is_submitted=False,
    )


@router.post(
    "/submit",
    response_model=QuizResult,
    summary="Submit quiz answers",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
async def submit_quiz(
    body: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Grade answers, save results, update the attempt, and attach AI explanations for wrong items."""
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == body.attempt_id, Attempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    _ensure_attempt_open(attempt)

    server_timed_out = bool(attempt.deadline_at and datetime.utcnow() >= attempt.deadline_at)
    submission_reason = "timeout" if server_timed_out else body.submission_reason
    _merge_snapshots(attempt, body.answers)

    saved_answers = attempt.answers_snapshot or {}
    if len(saved_answers) != attempt.total_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {attempt.total_questions} answers, got {len(saved_answers)}",
        )

    allowed_ids = set(attempt.question_ids or [])
    submitted_ids = {int(qid) for qid in saved_answers.keys()}
    if submitted_ids != allowed_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answers must match the questions from this attempt",
        )

    correct_count = 0
    raw_score = 0.0
    breakdown: List[QuestionResultItem] = []
    questions_by_id: Dict[int, Question] = {}
    weak_topics: set[str] = set()
    marks_per_question = (
        float(attempt.total_marks) / attempt.total_questions
        if attempt.total_questions
        else 1.0
    )

    for question_id in attempt.question_ids or []:
        selected_option = saved_answers.get(str(question_id))
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question {question_id} not found",
            )

        questions_by_id[question.id] = question
        is_correct = _is_correct_answer(question, selected_option)
        if is_correct:
            correct_count += 1
            raw_score += marks_per_question
        elif selected_option is not None:
            raw_score -= float(attempt.negative_marking or 0.0)
            weak_topics.add(question.subtopic.name if question.subtopic else question.topic.name if question.topic else "General")

        breakdown.append(
            QuestionResultItem(
                question_id=question_id,
                selected_option=selected_option or "Unanswered",
                correct_option=question.correct_option,
                is_correct=is_correct,
                explanation=question.explanation if is_correct else None,
            )
        )

        db.add(
            Result(
                attempt_id=attempt.id,
                question_id=question_id,
                selected_option=selected_option or "Unanswered",
                is_correct=is_correct,
            )
        )

    total = attempt.total_questions
    topic = db.query(Topic).filter(Topic.id == attempt.topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    passing_threshold = float(attempt.passing_percentage or topic.passing_score or PASS_THRESHOLD_PERCENT)
    raw_score = max(0.0, raw_score)
    percentage = round((raw_score / float(attempt.total_marks or total)) * 100, 1) if total else 0.0
    passed = percentage >= passing_threshold
    completed_at = datetime.utcnow()

    attempt.score = correct_count
    attempt.raw_score = round(raw_score, 2)
    attempt.completed_at = completed_at
    attempt.submitted_at = completed_at
    attempt.submission_reason = submission_reason
    attempt.time_spent_seconds = sum(int(v or 0) for v in (attempt.per_question_time or {}).values())
    attempt.is_passed = passed
    confidence_score = adaptive_difficulty_service.get_confidence_score(db, current_user.id, attempt.topic_id)
    mastery = adaptive_difficulty_service.calculate_user_mastery(db, current_user.id, attempt.topic_id)
    wrong_patterns = adaptive_difficulty_service.get_wrong_answer_patterns(db, current_user.id, attempt.topic_id)
    learning_progress = round(float(mastery.get("recent_score", 0.0)) - float(mastery.get("average_score", 0.0)), 1)
    current_difficulty = (attempt.criteria_snapshot or {}).get("difficulty", "adaptive")
    if current_difficulty == "adaptive":
        current_difficulty = AdaptiveEngine.determine_target_difficulty(db, current_user.id, attempt.topic_id)
    attempt.adaptive_recommendation = exam_criteria_service.adaptive_recommendation(
        percentage,
        current_difficulty,
        confidence_score,
        previous_attempts=int(mastery.get("attempts_count", 0)),
        mastery_level=str(mastery.get("mastery_level", "beginner")),
        wrong_answer_patterns=wrong_patterns,
        learning_progress=learning_progress,
    )
    
    criteria_snapshot = attempt.criteria_snapshot or {}
    certificate_enabled = bool(criteria_snapshot.get("certificate_enabled", True))
    participation_cert = None
    achievement_cert = None
    if certificate_enabled:
        participation_cert, achievement_cert = create_certificates_for_assessment(
            db=db,
            user=current_user,
            topic=topic,
            score=correct_count,
            total=total,
            attempt=attempt,
        )
    subtopic_certifications_awarded = 0
    portfolio_updated = False

    if passed:
        try:
            cert_before = len(
                subtopic_certification_service.get_user_subtopic_certifications(db, current_user.id)
            )
            subtopic_certification_service.update_certificate_after_attempt(db, attempt.id)
            cert_after = len(
                subtopic_certification_service.get_user_subtopic_certifications(db, current_user.id)
            )
            subtopic_certifications_awarded = max(0, cert_after - cert_before)
        except Exception:
            subtopic_certifications_awarded = 0

        try:
            portfolio = PortfolioService.get_or_create_portfolio(db, current_user.id)
            portfolio.portfolio_data = PortfolioService.aggregate_portfolio_data(db, current_user.id)
            db.commit()
            portfolio_updated = True
        except Exception:
            portfolio_updated = False

    db.commit()
    if participation_cert:
        db.refresh(participation_cert)
    if achievement_cert:
        db.refresh(achievement_cert)

    breakdown = await _attach_ai_explanations(breakdown, questions_by_id)
    remedial_plan = [
        f"Review {name} and complete targeted practice before reattempting."
        for name in sorted(weak_topics)
    ] or ([] if passed else ["Review incorrect answers and complete the recommended remediation plan."])

    learning_resources = []
    if not passed:
        focus_topics = sorted(weak_topics)[:3]
        if focus_topics:
            learning_resources.append("Targeted practice for: " + ", ".join(focus_topics))
        learning_resources.extend(
            [
                "Open /dashboard/remediation for AI-generated gap analysis and study plan",
                "Reattempt after completing remediation tasks",
            ]
        )

    gap_analysis = None
    if not passed:
        wrong_total = len([item for item in breakdown if not item.is_correct])
        gap_analysis = (
            f"You missed {wrong_total} question(s). Focus on weak areas: "
            + (", ".join(sorted(weak_topics)) if weak_topics else "core concepts and fundamentals")
            + "."
        )

    next_difficulty_unlocked = None
    if passed and attempt.adaptive_recommendation and attempt.adaptive_recommendation.get("action") == "increase":
        next_difficulty_unlocked = attempt.adaptive_recommendation.get("next_difficulty")

    return QuizResult(
        score=correct_count,
        total=total,
        passed=passed,
        percentage=percentage,
        completed_at=completed_at.isoformat(),
        participation_certificate=serialize_certificate(participation_cert, total=total, include_qr=True)
        if participation_cert
        else None,
        achievement_certificate=serialize_certificate(
            achievement_cert,
            total=total,
            include_qr=True,
        ) if achievement_cert else None,
        results=breakdown,
        total_marks=float(attempt.total_marks or total),
        raw_score=round(raw_score, 2),
        passing_percentage=passing_threshold,
        submission_reason=submission_reason,
        adaptive_recommendation=attempt.adaptive_recommendation,
        weak_topics=sorted(weak_topics),
        remedial_plan=remedial_plan,
        gap_analysis=gap_analysis,
        learning_resources=learning_resources,
        reattempt_recommended=not passed,
        reattempt_available=True,
        subtopic_certifications_awarded=subtopic_certifications_awarded,
        portfolio_updated=portfolio_updated,
        next_difficulty_unlocked=next_difficulty_unlocked,
    )


@router.post(
    "/adaptive-adjustment",
    summary="Update difficulty during quiz based on performance",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def adaptive_difficulty_adjustment(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update difficulty during quiz based on consecutive correct/incorrect answers.
    This enables real-time adaptive difficulty adjustment.
    """
    attempt_id = body.get("attempt_id")
    current_difficulty = body.get("current_difficulty", "medium")
    answered_questions = body.get("answered_questions", {})  # {question_id: is_correct}
    
    if not attempt_id:
        raise HTTPException(status_code=400, detail="attempt_id is required")
    
    attempt = db.query(Attempt).filter(
        Attempt.id == attempt_id,
        Attempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.completed_at is not None:
        raise HTTPException(status_code=400, detail="Attempt already completed")
    
    # Set initial difficulty if not set
    if attempt.initial_difficulty is None:
        attempt.initial_difficulty = current_difficulty
    
    # Update difficulty using adaptive engine
    new_difficulty = AdaptiveEngine.update_difficulty_during_quiz(
        db=db,
        attempt_id=attempt_id,
        current_difficulty=current_difficulty,
        answered_questions=answered_questions
    )
    
    # Update final difficulty
    attempt.final_difficulty = new_difficulty
    db.commit()
    
    return {
        "current_difficulty": new_difficulty,
        "adjusted": new_difficulty != current_difficulty,
        "difficulty_progression": attempt.difficulty_progression
    }
