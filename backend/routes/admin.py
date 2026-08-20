"""
Admin management routes.

Endpoints for admins to manage users, topics, and platform configuration.
All endpoints require admin role authorization.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Topic
from backend.schemas.common import MessageResponse
from backend.utils.auth_utils import get_current_user
from backend.services.vector_service import VectorService

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this resource"
        )
    return current_user


@router.get(
    "/users",
    tags=["Admin"],
    summary="List all users",
    description="Returns paginated list of all registered users."
)
def get_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """
    List all users with pagination.
    
    Query Parameters:
    - skip: Number of users to skip (default: 0)
    - limit: Max users to return (default: 50, max: 100)
    """
    try:
        limit = min(limit, 100)  # Max limit is 100
        
        users = db.query(User).offset(skip).limit(limit).all()
        total = db.query(User).count()
        
        return {
            "users": [
                {
                    "id": u.id,
                    "email": u.email,
                    "full_name": u.full_name,
                    "role": u.role,
                    "is_active": u.is_active,
                    "created_at": u.created_at
                }
                for u in users
            ],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve users: {str(e)}"
        )


@router.get(
    "/topics",
    tags=["Admin"],
    summary="List all topics",
    description="Returns all topics with their configuration details."
)
def get_topics_admin(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all topics with admin details.
    
    Returns:
    - id, name, description
    - subject, duration, total_questions, passing_score
    """
    try:
        topics = db.query(Topic).all()
        
        return {
            "topics": [
            {
                    "id": t.id,
                    "name": t.name,
                    "description": t.description,
                    "subject": t.subject,
                    "duration": t.duration,
                    "total_questions": t.total_questions,
                    "passing_score": t.passing_score
                }
                for t in topics
            ],
            "total": len(topics)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve topics: {str(e)}"
        )


@router.post(
    "/promote-admin",
    tags=["Admin"],
    summary="Promote user to admin",
    description="Grant admin role to a user (admin-only)."
)
def promote_to_admin(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Promote a user to admin role."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.role = "admin"
        db.commit()
        db.refresh(user)
        
        return MessageResponse(message=f"User {user.email} promoted to admin")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to promote user: {str(e)}"
        )


@router.post(
    "/demote-admin",
    tags=["Admin"],
    summary="Demote admin to student",
    description="Remove admin role from a user."
)
def demote_admin(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Demote an admin back to student role."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.id == admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote yourself"
            )
        
        user.role = "student"
        db.commit()
        db.refresh(user)
        
        return MessageResponse(message=f"User {user.email} demoted to student")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to demote user: {str(e)}"
        )


@router.post(
    "/embeddings/generate-topics",
    tags=["Admin"],
    summary="Generate embeddings for all topics",
    description="Batch generate vector embeddings for topics that don't have them."
)
def generate_topic_embeddings(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Generate embeddings for all topics missing vector embeddings."""
    try:
        from backend.models.topic import Topic
        
        # Count topics without embeddings
        topics_without_embeddings = db.query(Topic).filter(Topic.embedding.is_(None)).count()
        total_topics = db.query(Topic).count()
        
        if topics_without_embeddings == 0:
            return {
                "message": "All topics already have embeddings",
                "total_topics": total_topics,
                "topics_processed": 0,
                "topics_remaining": 0
            }
        
        # Generate embeddings
        count = VectorService.batch_generate_topic_embeddings(db)
        
        return {
            "message": f"Successfully generated embeddings for {count} topics",
            "total_topics": total_topics,
            "topics_processed": count,
            "topics_remaining": db.query(Topic).filter(Topic.embedding.is_(None)).count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate topic embeddings: {str(e)}"
        )


@router.post(
    "/embeddings/generate-questions",
    tags=["Admin"],
    summary="Generate embeddings for all questions",
    description="Batch generate vector embeddings for questions that don't have them."
)
def generate_question_embeddings(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Generate embeddings for all questions missing vector embeddings."""
    try:
        from backend.models.question import Question
        
        # Count questions without embeddings
        questions_without_embeddings = db.query(Question).filter(Question.embedding.is_(None)).count()
        total_questions = db.query(Question).count()
        
        if questions_without_embeddings == 0:
            return {
                "message": "All questions already have embeddings",
                "total_questions": total_questions,
                "questions_processed": 0,
                "questions_remaining": 0
            }
        
        # Generate embeddings
        count = VectorService.batch_generate_question_embeddings(db)
        
        return {
            "message": f"Successfully generated embeddings for {count} questions",
            "total_questions": total_questions,
            "questions_processed": count,
            "questions_remaining": db.query(Question).filter(Question.embedding.is_(None)).count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate question embeddings: {str(e)}"
        )


@router.get(
    "/embeddings/status",
    tags=["Admin"],
    summary="Get embedding generation status",
    description="Check how many topics and questions have vector embeddings."
)
def get_embedding_status(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get current status of vector embeddings for topics and questions."""
    try:
        from backend.models.topic import Topic
        from backend.models.question import Question
        
        total_topics = db.query(Topic).count()
        topics_with_embeddings = db.query(Topic).filter(Topic.embedding.isnot(None)).count()
        
        total_questions = db.query(Question).count()
        questions_with_embeddings = db.query(Question).filter(Question.embedding.isnot(None)).count()
        
        return {
            "topics": {
                "total": total_topics,
                "with_embeddings": topics_with_embeddings,
                "without_embeddings": total_topics - topics_with_embeddings,
                "coverage_percentage": round((topics_with_embeddings / total_topics * 100) if total_topics > 0 else 0, 2)
            },
            "questions": {
                "total": total_questions,
                "with_embeddings": questions_with_embeddings,
                "without_embeddings": total_questions - questions_with_embeddings,
                "coverage_percentage": round((questions_with_embeddings / total_questions * 100) if total_questions > 0 else 0, 2)
            },
            "overall_coverage": round(
                ((topics_with_embeddings + questions_with_embeddings) / (total_topics + total_questions) * 100) 
                if (total_topics + total_questions) > 0 else 0, 2
            )
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get embedding status: {str(e)}"
        )
