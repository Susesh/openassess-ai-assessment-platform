from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable, Optional

from sqlalchemy.orm import Session, joinedload

from backend.models.attempt import Attempt
from backend.models.exam_criteria import ExamCriteria
from backend.models.question import Question
from backend.models.topic import Subtopic, Topic
from backend.models.user import User
from backend.schemas.exam_criteria import ExamCriteriaCreate, ExamCriteriaOut, ExamCriteriaUpdate
from backend.services.adaptive_engine import AdaptiveEngine


MIN_EXAM_DURATION_MINUTES = 60
DEFAULT_EXAM_DURATION_MINUTES = 60


class ExamCriteriaService:
    @staticmethod
    def serialize(criteria: ExamCriteria) -> ExamCriteriaOut:
        return ExamCriteriaOut(
            id=criteria.id,
            exam_name=criteria.exam_name,
            board=criteria.board,
            subject=criteria.subject,
            topic_id=criteria.topic_id,
            subtopic_id=criteria.subtopic_id,
            difficulty=criteria.difficulty,
            total_questions=criteria.total_questions,
            total_marks=criteria.total_marks,
            passing_percentage=criteria.passing_percentage,
            negative_marking=criteria.negative_marking,
            maximum_attempts=criteria.maximum_attempts,
            duration_minutes=max(MIN_EXAM_DURATION_MINUTES, criteria.duration_minutes or DEFAULT_EXAM_DURATION_MINUTES),
            video_recording_enabled=criteria.video_recording_enabled,
            ai_proctoring_enabled=criteria.ai_proctoring_enabled,
            certificate_enabled=criteria.certificate_enabled,
            instructions=criteria.instructions,
            is_active=criteria.is_active,
            topic_name=criteria.topic.name if criteria.topic else None,
            subtopic_name=criteria.subtopic.name if criteria.subtopic else None,
            created_by=criteria.created_by,
            created_at=criteria.created_at,
            updated_at=criteria.updated_at,
        )

    @staticmethod
    def list_active(db: Session) -> list[ExamCriteria]:
        return (
            db.query(ExamCriteria)
            .options(joinedload(ExamCriteria.topic), joinedload(ExamCriteria.subtopic))
            .filter(ExamCriteria.is_active == True)
            .order_by(ExamCriteria.created_at.desc())
            .all()
        )

    @staticmethod
    def list_all(db: Session) -> list[ExamCriteria]:
        return (
            db.query(ExamCriteria)
            .options(joinedload(ExamCriteria.topic), joinedload(ExamCriteria.subtopic))
            .order_by(ExamCriteria.created_at.desc())
            .all()
        )

    @staticmethod
    def get(db: Session, criteria_id: int, active_only: bool = False) -> Optional[ExamCriteria]:
        query = (
            db.query(ExamCriteria)
            .options(joinedload(ExamCriteria.topic), joinedload(ExamCriteria.subtopic))
            .filter(ExamCriteria.id == criteria_id)
        )
        if active_only:
            query = query.filter(ExamCriteria.is_active == True)
        return query.first()

    @staticmethod
    def validate_topic(db: Session, topic_id: int, subtopic_id: Optional[int]) -> Topic:
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            raise ValueError("Topic not found")
        if subtopic_id is not None:
            subtopic = (
                db.query(Subtopic)
                .filter(Subtopic.id == subtopic_id, Subtopic.topic_id == topic_id)
                .first()
            )
            if not subtopic:
                raise ValueError("Subtopic does not belong to this topic")
        return topic

    @staticmethod
    def create(db: Session, data: ExamCriteriaCreate, user: User) -> ExamCriteria:
        ExamCriteriaService.validate_topic(db, data.topic_id, data.subtopic_id)
        criteria = ExamCriteria(
            **data.model_dump(),
            duration_minutes=max(MIN_EXAM_DURATION_MINUTES, data.duration_minutes),
            created_by=user.id,
        )
        db.add(criteria)
        db.commit()
        db.refresh(criteria)
        return criteria

    @staticmethod
    def update(db: Session, criteria: ExamCriteria, data: ExamCriteriaUpdate) -> ExamCriteria:
        values = data.model_dump(exclude_unset=True)
        topic_id = values.get("topic_id", criteria.topic_id)
        subtopic_id = values.get("subtopic_id", criteria.subtopic_id)
        if "topic_id" in values or "subtopic_id" in values:
            ExamCriteriaService.validate_topic(db, topic_id, subtopic_id)
        if "duration_minutes" in values:
            values["duration_minutes"] = max(MIN_EXAM_DURATION_MINUTES, values["duration_minutes"])
        for key, value in values.items():
            setattr(criteria, key, value)
        db.commit()
        db.refresh(criteria)
        return criteria

    @staticmethod
    def from_topic(db: Session, topic_id: int, subtopic_id: Optional[int], num_questions: int) -> ExamCriteria:
        topic = ExamCriteriaService.validate_topic(db, topic_id, subtopic_id)
        subtopic = db.query(Subtopic).filter(Subtopic.id == subtopic_id).first() if subtopic_id else None
        duration = max(MIN_EXAM_DURATION_MINUTES, topic.duration or DEFAULT_EXAM_DURATION_MINUTES)
        total_questions = num_questions or topic.total_questions or 10
        return ExamCriteria(
            id=0,
            exam_name=f"{topic.name} Assessment",
            board="Custom",
            subject=topic.subject or "General",
            topic_id=topic.id,
            subtopic_id=subtopic_id,
            difficulty="adaptive",
            total_questions=total_questions,
            total_marks=float(total_questions),
            passing_percentage=float(topic.passing_score or 40.0),
            negative_marking=0.0,
            maximum_attempts=0,
            duration_minutes=duration,
            video_recording_enabled=True,
            ai_proctoring_enabled=True,
            certificate_enabled=True,
            instructions=None,
            is_active=True,
            created_by=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            topic=topic,
            subtopic=subtopic,
        )

    @staticmethod
    def count_completed_attempts(db: Session, user_id: int, criteria_id: int) -> int:
        return (
            db.query(Attempt)
            .filter(
                Attempt.user_id == user_id,
                Attempt.exam_criteria_id == criteria_id,
                Attempt.completed_at.isnot(None),
            )
            .count()
        )

    @staticmethod
    def build_attempt_snapshot(criteria: ExamCriteria) -> dict:
        return {
            "exam_name": criteria.exam_name,
            "board": criteria.board,
            "subject": criteria.subject,
            "topic_id": criteria.topic_id,
            "subtopic_id": criteria.subtopic_id,
            "difficulty": criteria.difficulty,
            "total_questions": criteria.total_questions,
            "total_marks": criteria.total_marks,
            "passing_percentage": criteria.passing_percentage,
            "negative_marking": criteria.negative_marking,
            "maximum_attempts": criteria.maximum_attempts,
            "duration_minutes": max(MIN_EXAM_DURATION_MINUTES, criteria.duration_minutes),
            "video_recording_enabled": criteria.video_recording_enabled,
            "ai_proctoring_enabled": criteria.ai_proctoring_enabled,
            "certificate_enabled": criteria.certificate_enabled,
            "instructions": criteria.instructions,
        }

    @staticmethod
    def select_questions(
        db: Session,
        user_id: int,
        criteria: ExamCriteria,
    ) -> list[Question]:
        if criteria.difficulty == "adaptive":
            return AdaptiveEngine.get_adaptive_questions(
                db,
                user_id,
                criteria.topic_id,
                criteria.subtopic_id,
                criteria.total_questions,
            )

        query = db.query(Question).filter(Question.topic_id == criteria.topic_id)
        if criteria.subtopic_id is not None:
            query = query.filter(Question.subtopic_id == criteria.subtopic_id)
        query = query.filter(Question.difficulty.ilike(criteria.difficulty))
        questions = query.order_by(Question.id).limit(criteria.total_questions).all()
        if len(questions) < criteria.total_questions:
            existing_ids = [q.id for q in questions]
            backfill = (
                db.query(Question)
                .filter(Question.topic_id == criteria.topic_id, Question.id.notin_(existing_ids or [0]))
                .order_by(Question.id)
                .limit(criteria.total_questions - len(questions))
                .all()
            )
            questions.extend(backfill)
        return questions

    @staticmethod
    def deadline_from_now(duration_minutes: int) -> datetime:
        return datetime.utcnow() + timedelta(minutes=max(MIN_EXAM_DURATION_MINUTES, duration_minutes))

    @staticmethod
    def adaptive_recommendation(
        percentage: float,
        current_difficulty: str,
        confidence_score: float,
        previous_attempts: int = 0,
        mastery_level: str = "beginner",
        wrong_answer_patterns: Optional[dict] = None,
        learning_progress: float = 0.0,
    ) -> dict:
        ordered = ["easy", "medium", "hard"]
        normalized = current_difficulty if current_difficulty in ordered else "medium"
        index = ordered.index(normalized)
        if percentage > 90:
            next_difficulty = ordered[min(index + 1, len(ordered) - 1)]
            action = "increase"
        elif percentage < 70:
            next_difficulty = ordered[max(index - 1, 0)]
            action = "reduce"
        else:
            next_difficulty = normalized
            action = "maintain"
        return {
            "action": action,
            "current_difficulty": normalized,
            "next_difficulty": next_difficulty,
            "confidence_score": confidence_score,
            "previous_attempts": previous_attempts,
            "mastery_level": mastery_level,
            "wrong_answer_patterns": wrong_answer_patterns or {},
            "learning_progress": learning_progress,
        }


exam_criteria_service = ExamCriteriaService()
