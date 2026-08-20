import logging
import os
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

from backend.services.gemini_service import GeminiServiceError, get_client as get_gemini_client

logger = logging.getLogger(__name__)
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

class VectorService:
    @staticmethod
    def _get_client():
        if genai is None or not GEMINI_API_KEY:
            logger.warning("Gemini API is not configured or google-genai is not installed.")
            return None
        try:
            return get_gemini_client()
        except GeminiServiceError as e:
            logger.error("Gemini client unavailable for vector service: %s", e.user_message)
            return None
        except Exception as e:
            logger.error(f"Failed to initialize Gemini Client for vector service: {e}")
            return None

    @staticmethod
    def generate_embedding(text_content: str) -> Optional[List[float]]:
        client = VectorService._get_client()
        if not client:
            return None
            
        try:
            # Using text-embedding-004 model
            result = client.models.embed_content(
                model='text-embedding-004',
                contents=text_content
            )
            # The result is typically an object with an embeddings list
            # We assume it returns embeddings[0].values
            if hasattr(result, 'embeddings') and result.embeddings:
                return result.embeddings[0].values
            return None
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None

    @staticmethod
    def generate_topic_embedding(db: Session, topic_id: int):
        """Generate and store embedding for a topic."""
        from backend.models.topic import Topic
        
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            return None
        
        # Create text content for embedding
        content = f"{topic.name} {topic.description or ''} {topic.subject or ''}"
        
        embedding = VectorService.generate_embedding(content)
        if not embedding:
            return None
        
        # Update topic with embedding
        topic.embedding = str(embedding)
        topic.embedding_updated_at = None  # Will be set by trigger
        db.commit()
        
        return embedding
    
    @staticmethod
    def generate_question_embedding(db: Session, question_id: int):
        """Generate and store embedding for a question."""
        from backend.models.question import Question
        
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return None
        
        # Create text content for embedding
        content = f"{question.text} {question.explanation or ''}"
        
        embedding = VectorService.generate_embedding(content)
        if not embedding:
            return None
        
        # Update question with embedding
        question.embedding = str(embedding)
        question.embedding_updated_at = None  # Will be set by trigger
        db.commit()
        
        return embedding
    
    @staticmethod
    def search_similar_topics(db: Session, query: str, limit: int = 5):
        """Search for topics similar to the query using semantic search."""
        embedding = VectorService.generate_embedding(query)
        if not embedding:
            return []
            
        # Using pgvector cosine distance `<=>`
        sql = text("""
            SELECT id, name, description, subject, 1 - (embedding <=> :embedding) AS similarity
            FROM topics
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> :embedding
            LIMIT :limit
        """)
        
        results = db.execute(sql, {"embedding": str(embedding), "limit": limit}).fetchall()
        
        return [
            {
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "subject": row.subject,
                "similarity": row.similarity
            }
            for row in results
        ]
    
    @staticmethod
    def search_similar_questions(db: Session, query: str, topic_id: Optional[int] = None, limit: int = 5):
        """Search for questions similar to the query using semantic search."""
        embedding = VectorService.generate_embedding(query)
        if not embedding:
            return []
        
        # Build query with optional topic filter
        if topic_id:
            sql = text("""
                SELECT id, text, difficulty, topic_id, 1 - (embedding <=> :embedding) AS similarity
                FROM questions
                WHERE embedding IS NOT NULL AND topic_id = :topic_id
                ORDER BY embedding <=> :embedding
                LIMIT :limit
            """)
            results = db.execute(sql, {"embedding": str(embedding), "topic_id": topic_id, "limit": limit}).fetchall()
        else:
            sql = text("""
                SELECT id, text, difficulty, topic_id, 1 - (embedding <=> :embedding) AS similarity
                FROM questions
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> :embedding
                LIMIT :limit
            """)
            results = db.execute(sql, {"embedding": str(embedding), "limit": limit}).fetchall()
        
        return [
            {
                "id": row.id,
                "text": row.text,
                "difficulty": row.difficulty,
                "topic_id": row.topic_id,
                "similarity": row.similarity
            }
            for row in results
        ]
    
    @staticmethod
    def get_related_topics(db: Session, topic_id: int, limit: int = 5):
        """Get topics semantically related to a given topic."""
        from backend.models.topic import Topic
        
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic or not topic.embedding:
            return []
        
        # Using pgvector cosine distance
        sql = text("""
            SELECT id, name, description, subject, 1 - (embedding <=> :embedding) AS similarity
            FROM topics
            WHERE embedding IS NOT NULL AND id != :topic_id
            ORDER BY embedding <=> :embedding
            LIMIT :limit
        """)
        
        results = db.execute(sql, {"embedding": topic.embedding, "topic_id": topic_id, "limit": limit}).fetchall()
        
        return [
            {
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "subject": row.subject,
                "similarity": row.similarity
            }
            for row in results
        ]
    
    @staticmethod
    def batch_generate_topic_embeddings(db: Session):
        """Generate embeddings for all topics that don't have them."""
        from backend.models.topic import Topic
        
        topics = db.query(Topic).filter(Topic.embedding.is_(None)).all()
        
        count = 0
        for topic in topics:
            if VectorService.generate_topic_embedding(db, topic.id):
                count += 1
        
        return count
    
    @staticmethod
    def batch_generate_question_embeddings(db: Session):
        """Generate embeddings for all questions that don't have them."""
        from backend.models.question import Question
        
        questions = db.query(Question).filter(Question.embedding.is_(None)).all()
        
        count = 0
        for question in questions:
            if VectorService.generate_question_embedding(db, question.id):
                count += 1
        
        return count
