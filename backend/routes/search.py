from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Dict, Optional

from backend.database import get_db
from backend.services.vector_service import VectorService
from backend.utils.auth_utils import get_current_user
from backend.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/search", tags=["Search"])

class SearchQuery(BaseModel):
    query: str
    limit: int = 5
    topic_id: Optional[int] = None

class TopicSearchQuery(BaseModel):
    query: str
    limit: int = 5

@router.post("/semantic")
def semantic_search(
    body: SearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Search for similar questions using pgvector embeddings.
    """
    try:
        results = VectorService.search_similar_questions(db, body.query, body.topic_id, body.limit)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Semantic search failed: {str(e)}"
        )

@router.post("/topics")
def search_topics(
    body: TopicSearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Search for topics similar to the query using semantic search.
    """
    try:
        results = VectorService.search_similar_topics(db, body.query, body.limit)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Topic search failed: {str(e)}"
        )

@router.get("/related-topics/{topic_id}")
def get_related_topics(
    topic_id: int,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get topics semantically related to a given topic.
    """
    try:
        results = VectorService.get_related_topics(db, topic_id, limit)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get related topics: {str(e)}"
        )

@router.post("/admin/batch-embeddings")
def batch_generate_embeddings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, int]:
    """
    Generate embeddings for all topics and questions (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can batch generate embeddings"
        )
    
    try:
        topic_count = VectorService.batch_generate_topic_embeddings(db)
        question_count = VectorService.batch_generate_question_embeddings(db)
        
        return {
            "topics_generated": topic_count,
            "questions_generated": question_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch embedding generation failed: {str(e)}"
        )
