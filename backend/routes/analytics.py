from collections import defaultdict
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.attempt import Attempt
from backend.models.certificate import Certificate
from backend.models.topic import Topic
from backend.models.user import User
from backend.schemas.analytics import AnalyticsSummary, HeatmapItem
from backend.schemas.openapi import UNAUTHORIZED
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/analytics")
public_router = APIRouter()


def _completed_attempts(db: Session, user_id: int) -> List[Attempt]:
    return (
        db.query(Attempt)
        .filter(Attempt.user_id == user_id, Attempt.completed_at.isnot(None))
        .all()
    )


def _topic_averages(attempts: List[Attempt], db: Session) -> dict[int, dict]:
    """Map topic_id -> {name, scores[], last_attempted}."""
    try:
        by_topic: dict[int, dict] = defaultdict(
            lambda: {"scores": [], "last_attempted": None}
        )

        for attempt in attempts:
            entry = by_topic[attempt.topic_id]
            # Calculate percentage manually
            try:
                pct = round((attempt.score / attempt.total_questions) * 100, 1) if attempt.total_questions > 0 else 0.0
                entry["scores"].append(pct)
            except Exception as e:
                print(f"Error calculating percentage for attempt {attempt.id}: {e}")
                entry["scores"].append(0.0)
            last = entry["last_attempted"]
            completed = attempt.completed_at
            if completed and (last is None or completed > last):
                entry["last_attempted"] = completed

        for topic_id, entry in by_topic.items():
            try:
                topic = db.query(Topic).filter(Topic.id == topic_id).first()
                entry["name"] = topic.name if topic else "Unknown"
                entry["avg_score"] = round(sum(entry["scores"]) / len(entry["scores"]), 1)
            except Exception as e:
                print(f"Error processing topic {topic_id}: {e}")
                entry["name"] = "Unknown"
                entry["avg_score"] = 0.0

        return by_topic
    except Exception as e:
        print(f"Error in _topic_averages: {e}")
        import traceback
        traceback.print_exc()
        return {}


@router.get(
    "/me",
    response_model=AnalyticsSummary,
    summary="Personal performance summary",
    responses={**UNAUTHORIZED},
)
def get_my_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return aggregate stats: attempts, average score, pass rate, and strongest/weakest topics."""
    return _build_analytics_summary(db, current_user.id)


@router.get(
    "/summary",
    response_model=AnalyticsSummary,
    summary="Compatibility summary endpoint",
    responses={**UNAUTHORIZED},
)
def get_summary_compatibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compatibility alias used by older frontend services."""
    return _build_analytics_summary(db, current_user.id)


@router.get(
    "/topic-progress",
    response_model=List[dict],
    summary="Compatibility topic progress endpoint",
    responses={**UNAUTHORIZED},
)
def get_topic_progress_compatibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = _completed_attempts(db, current_user.id)
    topic_stats = _topic_averages(attempts, db)
    return [
        {
            "topic_id": topic_id,
            "topic_name": data["name"],
            "average_score": data["avg_score"],
            "attempts": len(data["scores"]),
            "mastered": data["avg_score"] >= 80,
        }
        for topic_id, data in sorted(topic_stats.items(), key=lambda x: x[1]["name"])
    ]


@router.get(
    "/gaps",
    response_model=List[dict],
    summary="Compatibility gaps endpoint",
    responses={**UNAUTHORIZED},
)
def get_gaps_compatibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = _completed_attempts(db, current_user.id)
    topic_stats = _topic_averages(attempts, db)
    return [
        {
            "topic_id": topic_id,
            "topic_name": data["name"],
            "weakness_score": max(0, round(100 - data["avg_score"], 1)),
            "recommendation": f"Review {data['name']} and retake the assessment.",
        }
        for topic_id, data in sorted(topic_stats.items(), key=lambda x: x[1]["avg_score"])
        if data["avg_score"] < 60
    ]


@public_router.get(
    "/dashboard",
    response_model=AnalyticsSummary,
    summary="Dashboard performance summary",
    responses={**UNAUTHORIZED},
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compatibility alias for clients that call GET /dashboard."""
    return _build_analytics_summary(db, current_user.id)


def _build_analytics_summary(db: Session, user_id: int) -> AnalyticsSummary:
    try:
        attempts = _completed_attempts(db, user_id)
        total = len(attempts)

        # Calculate streak days
        streak_days = 0
        if total > 0:
            # Get unique dates of attempts
            attempt_dates = sorted(set(a.completed_at.date() for a in attempts if a.completed_at), reverse=True)
            if attempt_dates:
                today = datetime.now().date()
                current_date = attempt_dates[0]
                
                # Check if the most recent attempt was today or yesterday
                if current_date == today or current_date == today - timedelta(days=1):
                    streak_days = 1
                    # Count consecutive days
                    for i in range(1, len(attempt_dates)):
                        prev_date = attempt_dates[i]
                        if current_date - prev_date == timedelta(days=1):
                            streak_days += 1
                            current_date = prev_date
                        else:
                            break

        if total == 0:
            return AnalyticsSummary(
                total_attempts=0,
                average_score=0.0,
                topics_attempted=0,
                strongest_topic=None,
                weakest_topic=None,
                pass_rate=0.0,
                certificates_earned=db.query(Certificate).filter(Certificate.user_id == user_id).count(),
                topics_mastered=0,
                weak_areas=[],
                streak_days=0,
            )

        # Calculate percentage manually to avoid property issues
        percentages = []
        for a in attempts:
            try:
                pct = round((a.score / a.total_questions) * 100, 1) if a.total_questions > 0 else 0.0
                percentages.append(pct)
            except Exception as e:
                print(f"Error calculating percentage for attempt {a.id}: {e}")
                percentages.append(0.0)
        
        avg_score = round(sum(percentages) / total, 1)
        passed = sum(1 for a in attempts if a.is_passed)
        pass_rate = round((passed / total) * 100, 1)

        topic_stats = _topic_averages(attempts, db)
        topics_attempted = len(topic_stats)

        ranked = sorted(topic_stats.items(), key=lambda x: x[1]["avg_score"], reverse=True)
        strongest = ranked[0][1]["name"] if ranked else None
        weakest = ranked[-1][1]["name"] if len(ranked) > 1 else ranked[0][1]["name"] if ranked else None
        topics_mastered = sum(1 for _, data in topic_stats.items() if data["avg_score"] >= 80)
        weak_areas = [
            {"topic_name": data["name"], "gap": max(0, round(100 - data["avg_score"], 1))}
            for _, data in sorted(topic_stats.items(), key=lambda x: x[1]["avg_score"])
            if data["avg_score"] < 60
        ]

        return AnalyticsSummary(
            total_attempts=total,
            average_score=avg_score,
            topics_attempted=topics_attempted,
            strongest_topic=strongest,
            weakest_topic=weakest,
            pass_rate=pass_rate,
            certificates_earned=db.query(Certificate).filter(Certificate.user_id == user_id).count(),
            topics_mastered=topics_mastered,
            weak_areas=weak_areas,
            streak_days=streak_days,
        )
    except Exception as e:
        print(f"Error in _build_analytics_summary: {e}")
        import traceback
        traceback.print_exc()
        # Return default values on error
        return AnalyticsSummary(
            total_attempts=0,
            average_score=0.0,
            topics_attempted=0,
            strongest_topic=None,
            weakest_topic=None,
            pass_rate=0.0,
            certificates_earned=0,
            topics_mastered=0,
            weak_areas=[],
            streak_days=0,
        )


@router.get(
    "/recent-attempt",
    response_model=dict,
    summary="Get most recent in-progress attempt",
    responses={**UNAUTHORIZED},
)
def get_recent_attempt(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent in-progress or completed attempt for continue learning."""
    attempt = (
        db.query(Attempt)
        .filter(Attempt.user_id == current_user.id)
        .order_by(Attempt.created_at.desc())
        .first()
    )
    
    if not attempt:
        return None
    
    topic = db.query(Topic).filter(Topic.id == attempt.topic_id).first()
    
    return {
        "attempt_id": attempt.id,
        "topic_id": attempt.topic_id,
        "topic_name": topic.name if topic else "Unknown",
        "score": attempt.percentage if attempt.completed_at else None,
        "completed": attempt.completed_at is not None,
        "created_at": attempt.created_at.isoformat() if attempt.created_at else None,
        "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None,
        "is_passed": attempt.is_passed,
    }


@router.get(
    "/heatmap",
    response_model=List[HeatmapItem],
    summary="Per-topic score heatmap",
    responses={**UNAUTHORIZED},
)
def get_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return per-topic attempt counts, average scores, and last attempt timestamps."""
    try:
        attempts = _completed_attempts(db, current_user.id)
        topic_stats = _topic_averages(attempts, db)

        heatmap = []
        for _tid, data in sorted(topic_stats.items(), key=lambda x: x[1]["name"]):
            last = data["last_attempted"]
            heatmap.append(
                HeatmapItem(
                    topic=data["name"],
                    attempts=len(data["scores"]),
                    avg_score=data["avg_score"],
                    last_attempted=last.isoformat() if last else None,
                )
            )

        return heatmap
    except Exception as e:
        print(f"Error in get_heatmap: {e}")
        import traceback
        traceback.print_exc()
        return []
