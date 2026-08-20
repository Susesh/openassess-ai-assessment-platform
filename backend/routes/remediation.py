"""Remedial Learning Engine – generates personalised study plans after failed assessments."""
from datetime import datetime
from backend.services.remedial_scheduler_service import remedial_scheduler_service
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.attempt import Attempt
from backend.models.question import Question
from backend.models.result import Result
from backend.models.topic import Topic
from backend.models.user import User
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/remediation", tags=["Remediation"])


# ---------------------------------------------------------------------------
# Resource catalog – static map of topic → resources
# ---------------------------------------------------------------------------
RESOURCE_CATALOG: Dict[str, Dict[str, List[str]]] = {
    "default": {
        "courses": [
            "SkillsDrome Foundation Course",
            "Coursera – Introduction to the Subject",
            "edX – Core Concepts",
        ],
        "videos": [
            "Khan Academy – Fundamentals playlist",
            "YouTube – Crash Course series",
            "MIT OpenCourseWare lectures",
        ],
        "practice": [
            "Practice 20 questions on weak subtopics",
            "Complete the daily challenge on this topic",
            "Attempt past papers for this subject",
        ],
        "notes": [
            "Download the OpenAssess topic summary PDF",
            "Read the chapter summary on your syllabus",
        ],
    },
    "programming": {
        "courses": [
            "freeCodeCamp – Full curriculum",
            "The Odin Project",
            "CS50 by Harvard (edX)",
        ],
        "videos": [
            "Traversy Media – crash courses",
            "Fireship – quick concept videos",
            "The Coding Train – interactive projects",
        ],
        "practice": [
            "Solve 10 LeetCode Easy problems",
            "Complete HackerRank 30 Days of Code",
            "Build a small project applying this concept",
        ],
        "notes": [
            "MDN Web Docs reference",
            "Official language documentation",
        ],
    },
    "mathematics": {
        "courses": [
            "Khan Academy – Mathematics",
            "Brilliant.org – Problem-solving",
        ],
        "videos": [
            "3Blue1Brown – Essence of calculus/linear algebra",
            "PatrickJMT – step-by-step solved examples",
        ],
        "practice": [
            "Solve 15 practice problems from the textbook",
            "Work through past-year exam questions",
        ],
        "notes": [
            "Download formula sheet",
            "Read theorem proofs",
        ],
    },
}


def _get_resources(topic_name: str) -> Dict[str, List[str]]:
    lower = topic_name.lower()
    if any(kw in lower for kw in ["python", "java", "code", "program", "algorithm", "data structure", "ai", "ml"]):
        return RESOURCE_CATALOG["programming"]
    if any(kw in lower for kw in ["math", "calculus", "algebra", "geometry", "statistics", "probability"]):
        return RESOURCE_CATALOG["mathematics"]
    return RESOURCE_CATALOG["default"]


class RemediationPlan(BaseModel):
    topic_id: int
    topic_name: str
    attempt_id: int
    score: int
    total: int
    percentage: float
    passed: bool
    weak_subtopics: List[str]
    strong_subtopics: List[str]
    wrong_question_count: int
    total_question_count: int
    study_plan: List[str]
    resources: Dict[str, List[str]]
    next_steps: List[str]


@router.get(
    "/plan/{attempt_id}",
    response_model=RemediationPlan,
    summary="Get personalised remediation plan for an attempt",
)
def get_remediation_plan(
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

    topic = db.query(Topic).filter(Topic.id == attempt.topic_id).first()
    topic_name = topic.name if topic else "Unknown Topic"

    results = db.query(Result).filter(Result.attempt_id == attempt_id).all()

    # Identify weak subtopics from wrong answers
    wrong_subtopic_ids: set[int] = set()
    correct_subtopic_ids: set[int] = set()
    for r in results:
        q = db.query(Question).filter(Question.id == r.question_id).first()
        if q and q.subtopic_id:
            if r.is_correct:
                correct_subtopic_ids.add(q.subtopic_id)
            else:
                wrong_subtopic_ids.add(q.subtopic_id)

    # Resolve names
    from backend.models.topic import Subtopic
    weak_names: List[str] = []
    for sid in wrong_subtopic_ids:
        st = db.query(Subtopic).filter(Subtopic.id == sid).first()
        if st:
            weak_names.append(st.name)

    strong_names: List[str] = []
    for sid in (correct_subtopic_ids - wrong_subtopic_ids):
        st = db.query(Subtopic).filter(Subtopic.id == sid).first()
        if st:
            strong_names.append(st.name)

    # Compute from per-question rows first, then reconcile with attempt summary.
    # This guards against legacy/dirty rows where boolean values may be inconsistent.
    result_correct_count = sum(1 for r in results if r.is_correct is True)
    result_total_count = len(results)
    result_wrong_count = max(result_total_count - result_correct_count, 0)

    attempt_total = int(attempt.total_questions or 0)
    attempt_score = int(attempt.score or 0)
    expected_wrong_count = max(attempt_total - attempt_score, 0)

    total_count = result_total_count if result_total_count > 0 else attempt_total
    wrong_count = result_wrong_count

    # If result rows disagree with attempt summary, trust attempt-level grading.
    if attempt_total > 0 and (
        total_count != attempt_total or wrong_count != expected_wrong_count
    ):
        total_count = attempt_total
        wrong_count = expected_wrong_count

    pct = attempt.percentage if hasattr(attempt, "percentage") else (
        (attempt.score / attempt.total_questions * 100) if attempt.total_questions else 0
    )

    resources = _get_resources(topic_name)

    study_plan: List[str] = []
    if weak_names:
        study_plan.append(f"Focus revision on: {', '.join(weak_names[:3])}")
    study_plan.append("Review all incorrect answers and understand why they were wrong")
    study_plan.append("Re-read the core concepts for this topic before retrying")
    study_plan.append("Complete the recommended practice questions below")
    study_plan.append("Re-attempt the assessment when you feel confident")

    next_steps = [
        "1. Review your wrong answers using the results page",
        f"2. Study the weak subtopics: {', '.join(weak_names[:2]) if weak_names else 'all subtopics'}",
        "3. Complete at least one recommended course or video",
        "4. Practice with the suggested questions",
        "5. Re-attempt this assessment — unlimited retries are allowed!",
    ]

    return RemediationPlan(
        topic_id=attempt.topic_id,
        topic_name=topic_name,
        attempt_id=attempt_id,
        score=attempt.score,
        total=attempt.total_questions,
        percentage=round(pct, 1),
        passed=attempt.is_passed,
        weak_subtopics=weak_names,
        strong_subtopics=strong_names,
        wrong_question_count=wrong_count,
        total_question_count=total_count,
        study_plan=study_plan,
        resources=resources,
        next_steps=next_steps,
    )


@router.get(
    "/history",
    summary="Get all failed attempts needing remediation",
)
def get_remediation_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return recent attempts that still need remediation.

    Prefer score-vs-threshold evaluation so legacy rows with stale/nullable
    `is_passed` are still classified correctly.
    """
    attempts = (
        db.query(Attempt)
        .filter(Attempt.user_id == current_user.id, Attempt.completed_at.isnot(None))
        .order_by(Attempt.completed_at.desc())
        .limit(50)
        .all()
    )

    result = []
    for a in attempts:
        topic = db.query(Topic).filter(Topic.id == a.topic_id).first()
        pct = (a.score / a.total_questions * 100) if a.total_questions else 0
        passing_threshold = topic.passing_score if topic and topic.passing_score is not None else 80.0
        needs_remediation = (pct < passing_threshold) or (a.is_passed is False)

        if not needs_remediation:
            continue

        result.append({
            "attempt_id": a.id,
            "topic_id": a.topic_id,
            "topic_name": topic.name if topic else "Unknown",
            "score": a.score,
            "total": a.total_questions,
            "percentage": round(pct, 1),
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        })

    return {"attempts": result}


@router.get(
    "/tutor-recommendations/{attempt_id}",
    summary="Get tutor recommendations for remedial class",
)
def get_tutor_recommendations(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recommended tutors and available time slots for a failed attempt."""
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    
    # Get recommendations from scheduler service
    recommendations = remedial_scheduler_service.get_remedial_recommendations(db, attempt_id)
    
    return recommendations


@router.post(
    "/book-class",
    summary="Book a remedial class",
    status_code=status.HTTP_201_CREATED,
)
def book_remedial_class(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Book a remedial class with a specific tutor and time slot."""
    attempt_id = body.get("attempt_id")
    tutor_id = body.get("tutor_id")
    scheduled_at = body.get("scheduled_at")  # ISO format datetime string
    
    if not attempt_id or not tutor_id or not scheduled_at:
        raise HTTPException(status_code=400, detail="attempt_id, tutor_id, and scheduled_at are required")
    
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Get weak topics for this attempt
    weak_topics = remedial_scheduler_service._identify_weak_topics(db, attempt)
    
    # Parse scheduled_at
    try:
        scheduled_dt = datetime.fromisoformat(scheduled_at)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid scheduled_at format")
    
    # Create session
    session = remedial_scheduler_service._create_remedial_session(
        db=db,
        attempt_id=attempt_id,
        tutor_id=tutor_id,
        student_id=current_user.id,
        scheduled_at=scheduled_dt,
        weak_topics=weak_topics,
        auto_scheduled=False
    )
    
    return {
        "session_id": session.id,
        "scheduled_at": session.scheduled_at.isoformat(),
        "meeting_link": session.meeting_link,
        "weak_topics": weak_topics
    }


@router.post(
    "/auto-schedule/{attempt_id}",
    summary="Automatically schedule a remedial class",
)
def auto_schedule_remedial(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Automatically schedule a remedial class after a failed assessment."""
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Trigger automatic scheduling
    result = remedial_scheduler_service.trigger_remedial_scheduling(db, attempt_id)
    
    return result
