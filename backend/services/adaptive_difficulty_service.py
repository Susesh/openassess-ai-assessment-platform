from datetime import datetime
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.models.attempt import Attempt
from backend.models.result import Result
from backend.models.question import Question
from backend.models.topic import Topic


class AdaptiveDifficultyService:
    """Service for adaptive question difficulty selection based on user performance."""
    
    DIFFICULTY_LEVELS = ["easy", "medium", "hard"]
    
    @staticmethod
    def calculate_user_mastery(
        db: Session,
        user_id: int,
        topic_id: int
    ) -> Dict[str, float]:
        """Calculate user mastery metrics for a topic."""
        
        # Get all attempts for this topic
        attempts = db.query(Attempt).filter(
            Attempt.user_id == user_id,
            Attempt.topic_id == topic_id,
            Attempt.completed_at.isnot(None)
        ).all()
        
        if not attempts:
            return {
                "average_score": 0.0,
                "attempts_count": 0,
                "recent_score": 0.0,
                "mastery_level": "beginner"
            }
        
        # Calculate average score
        total_score = sum(a.percentage for a in attempts)
        average_score = total_score / len(attempts)
        
        # Get most recent attempt score
        recent_attempt = max(attempts, key=lambda a: a.completed_at or a.started_at)
        recent_score = recent_attempt.percentage
        
        # Determine mastery level
        if average_score >= 90:
            mastery_level = "expert"
        elif average_score >= 70:
            mastery_level = "intermediate"
        else:
            mastery_level = "beginner"
        
        return {
            "average_score": round(average_score, 1),
            "attempts_count": len(attempts),
            "recent_score": round(recent_score, 1),
            "mastery_level": mastery_level
        }
    
    @staticmethod
    def get_wrong_answer_patterns(
        db: Session,
        user_id: int,
        topic_id: int
    ) -> Dict[str, int]:
        """Analyze patterns in wrong answers."""
        
        # Get recent attempts (last 5)
        recent_attempts = db.query(Attempt).filter(
            Attempt.user_id == user_id,
            Attempt.topic_id == topic_id,
            Attempt.completed_at.isnot(None)
        ).order_by(desc(Attempt.completed_at)).limit(5).all()
        
        if not recent_attempts:
            return {}
        
        attempt_ids = [a.id for a in recent_attempts]
        
        # Get results for recent attempts and normalize `is_correct` values.
        # Some legacy databases may store `results.is_correct` as text rather
        # than a boolean, so avoid a direct SQL boolean comparison.
        all_results = db.query(Result).filter(
            Result.attempt_id.in_(attempt_ids)
        ).all()
        wrong_results = [
            result for result in all_results
            if str(result.is_correct).strip().lower() not in {"true", "t", "1", "yes", "y"}
        ]
        
        difficulty_counts = {"easy": 0, "medium": 0, "hard": 0}
        
        for result in wrong_results:
            question = db.query(Question).filter(Question.id == result.question_id).first()
            if question and question.difficulty:
                difficulty = question.difficulty.lower()
                if difficulty in difficulty_counts:
                    difficulty_counts[difficulty] += 1
        
        return difficulty_counts
    
    @staticmethod
    def determine_target_difficulty(
        db: Session,
        user_id: int,
        topic_id: int
    ) -> str:
        """Determine appropriate difficulty level for next quiz."""
        
        mastery = AdaptiveDifficultyService.calculate_user_mastery(db, user_id, topic_id)
        wrong_patterns = AdaptiveDifficultyService.get_wrong_answer_patterns(db, user_id, topic_id)
        
        # Adaptive logic based on recent performance
        recent_score = mastery["recent_score"]
        
        if recent_score >= 90:
            # User is excelling, increase difficulty
            return "hard"
        elif recent_score >= 70:
            # User is doing well, maintain or slight increase
            if wrong_patterns.get("hard", 0) > wrong_patterns.get("medium", 0):
                return "medium"
            return "hard"
        elif recent_score >= 50:
            # User is struggling, decrease difficulty
            if wrong_patterns.get("medium", 0) > wrong_patterns.get("easy", 0):
                return "easy"
            return "medium"
        else:
            # User is struggling significantly, use easy
            return "easy"
    
    @staticmethod
    def select_adaptive_questions(
        db: Session,
        user_id: int,
        topic_id: int,
        count: int = 10
    ) -> List[Question]:
        """Select questions adaptively based on user performance."""
        
        target_difficulty = AdaptiveDifficultyService.determine_target_difficulty(
            db, user_id, topic_id
        )
        
        # Get questions at target difficulty
        questions = db.query(Question).filter(
            Question.topic_id == topic_id,
            func.lower(Question.difficulty) == target_difficulty
        ).all()
        
        # If not enough questions at target difficulty, mix with adjacent levels
        if len(questions) < count:
            if target_difficulty == "hard":
                fallback_difficulty = "medium"
            elif target_difficulty == "easy":
                fallback_difficulty = "medium"
            else:
                # For medium, try both easy and hard
                fallback_questions = db.query(Question).filter(
                    Question.topic_id == topic_id,
                    func.lower(Question.difficulty).in_(["easy", "hard"])
                ).all()
                questions.extend(fallback_questions)
            
            if target_difficulty != "medium":
                fallback_questions = db.query(Question).filter(
                    Question.topic_id == topic_id,
                    func.lower(Question.difficulty) == fallback_difficulty
                ).all()
                questions.extend(fallback_questions)
        
        # If still not enough, get any questions from the topic
        if len(questions) < count:
            all_questions = db.query(Question).filter(
                Question.topic_id == topic_id
            ).all()
            questions.extend(all_questions)
        
        # Remove duplicates and limit
        unique_questions = list({q.id: q for q in questions}.values())
        
        # Shuffle and return requested count
        import random
        random.shuffle(unique_questions)
        
        return unique_questions[:count]
    
    @staticmethod
    def get_confidence_score(
        db: Session,
        user_id: int,
        topic_id: int
    ) -> float:
        """Calculate confidence score based on consistency of performance."""
        
        attempts = db.query(Attempt).filter(
            Attempt.user_id == user_id,
            Attempt.topic_id == topic_id,
            Attempt.completed_at.isnot(None)
        ).order_by(Attempt.completed_at).all()
        
        if len(attempts) < 2:
            return 0.5  # Neutral confidence for insufficient data
        
        # Calculate variance in scores
        scores = [a.percentage for a in attempts]
        avg_score = sum(scores) / len(scores)
        variance = sum((s - avg_score) ** 2 for s in scores) / len(scores)
        
        # Lower variance = higher confidence
        # Normalize to 0-1 range
        confidence = max(0, 1 - (variance / 1000))
        
        return round(confidence, 2)
    
    @staticmethod
    def should_adjust_difficulty(
        db: Session,
        user_id: int,
        topic_id: int,
        current_difficulty: str
    ) -> Optional[str]:
        """Determine if difficulty should be adjusted and to what level."""
        
        mastery = AdaptiveDifficultyService.calculate_user_mastery(db, user_id, topic_id)
        recent_score = mastery["recent_score"]
        
        # Thresholds for adjustment
        INCREASE_THRESHOLD = 90
        DECREASE_THRESHOLD = 50
        
        if recent_score >= INCREASE_THRESHOLD and current_difficulty != "hard":
            # Should increase difficulty
            if current_difficulty == "easy":
                return "medium"
            elif current_difficulty == "medium":
                return "hard"
        
        elif recent_score <= DECREASE_THRESHOLD and current_difficulty != "easy":
            # Should decrease difficulty
            if current_difficulty == "hard":
                return "medium"
            elif current_difficulty == "medium":
                return "easy"
        
        return None  # No adjustment needed


# Global service instance
adaptive_difficulty_service = AdaptiveDifficultyService()
