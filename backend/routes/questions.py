from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models.question import Question
from backend.models.topic import Topic
from backend.schemas.question import QuestionOut, TopicWithSubtopics

router = APIRouter(prefix="/questions")
public_router = APIRouter()


def _get_topics_with_subtopics(db: Session) -> List[Topic]:
    topics = (
        db.query(Topic)
        .options(joinedload(Topic.subtopics))
        .order_by(Topic.name)
        .all()
    )
    canonical_topics: dict[str, Topic] = {}
    for topic in topics:
        key = topic.name.strip().lower()
        if key not in canonical_topics or topic.id < canonical_topics[key].id:
            canonical_topics[key] = topic
    return sorted(canonical_topics.values(), key=lambda topic: topic.name)


def _serialize_topic(topic: Topic, db: Session) -> dict:
    return {
        "id": topic.id,
        "name": topic.name,
        "description": topic.description,
        "subtopics": topic.subtopics,
        "question_count": db.query(func.count(Question.id))
        .filter(Question.topic_id == topic.id)
        .scalar()
        or 0,
        "subject": topic.subject,
        "duration": topic.duration,
        "total_questions": topic.total_questions,
        "passing_score": topic.passing_score,
    }


@router.get(
    "/topics",
    response_model=List[TopicWithSubtopics],
    summary="List all topics with subtopics",
)
def get_topics_with_subtopics(db: Session = Depends(get_db)):
    """Return the full curriculum tree: every topic and its nested subtopics."""
    return [_serialize_topic(topic, db) for topic in _get_topics_with_subtopics(db)]


@public_router.get(
    "/topics",
    response_model=List[TopicWithSubtopics],
    summary="List all topics with subtopics",
)
def get_topics_alias(db: Session = Depends(get_db)):
    """Compatibility alias for clients that call GET /topics."""
    return [_serialize_topic(topic, db) for topic in _get_topics_with_subtopics(db)]


@public_router.get(
    "/topics/{topic_id}",
    response_model=TopicWithSubtopics,
    summary="Get a topic with subtopics",
)
def get_topic_by_id(topic_id: int, db: Session = Depends(get_db)):
    """Return one topic, its subtopics, and its question count."""
    topic = (
        db.query(Topic)
        .options(joinedload(Topic.subtopics))
        .filter(Topic.id == topic_id)
        .first()
    )
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return _serialize_topic(topic, db)


def _serialize_question(question: Question) -> dict:
    """Serialize a question with properly formatted options."""
    options_data = question.options if question.options else []
    # Convert options list to QuestionOption format
    if isinstance(options_data, list):
        formatted_options = []
        option_labels = ["A", "B", "C", "D"]
        for i, option_text in enumerate(options_data):
            formatted_options.append({
                "id": option_labels[i] if i < len(option_labels) else str(i),
                "text": str(option_text) if option_text else ""
            })
    else:
        formatted_options = []
    
    return {
        "id": question.id,
        "topic_id": question.topic_id,
        "subtopic_id": question.subtopic_id,
        "text": question.text,
        "options": formatted_options,
        "difficulty": question.difficulty or "medium",
        "board": question.board,
        "class_name": question.class_name,
        "subject": question.subject,
        "year": question.year,
        "question_type": question.question_type or "mcq",
        "source": question.source,
    }


@router.get(
    "",
    response_model=List[QuestionOut],
    summary="Get random questions",
)
def get_questions(
    topic_id: Optional[int] = Query(None, description="Filter by topic ID"),
    subtopic_id: Optional[int] = Query(None, description="Filter by subtopic ID"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of questions"),
    db: Session = Depends(get_db),
):
    """Return a random sample of questions, optionally filtered by topic or subtopic."""
    query = db.query(Question)
    if topic_id is not None:
        query = query.filter(Question.topic_id == topic_id)
    if subtopic_id is not None:
        query = query.filter(Question.subtopic_id == subtopic_id)

    questions = query.order_by(func.random()).limit(limit).all()
    return [_serialize_question(q) for q in questions]
