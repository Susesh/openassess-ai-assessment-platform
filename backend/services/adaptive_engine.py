from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict
from backend.models.attempt import Attempt
from backend.models.question import Question
from backend.models.result import Result

class AdaptiveEngine:
    DIFFICULTY_LEVELS = ["easy", "medium", "hard"]
    MIN_QUESTIONS_BEFORE_ADJUSTMENT = 5
    CONSECUTIVE_THRESHOLD = 3
    
    @staticmethod
    def _is_correct_value(value) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            return value.strip().lower() in {"true", "t", "1", "yes", "y"}
        return False

    @staticmethod
    def calculate_user_mastery(
        db: Session,
        user_id: int,
        topic_id: int
    ) -> Dict[str, float]:
        """Calculate user mastery metrics for a topic."""
        
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
        
        total_score = sum(a.percentage for a in attempts)
        average_score = total_score / len(attempts)
        
        recent_attempt = max(attempts, key=lambda a: a.completed_at or a.started_at)
        recent_score = recent_attempt.percentage
        
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
        
        recent_attempts = db.query(Attempt).filter(
            Attempt.user_id == user_id,
            Attempt.topic_id == topic_id,
            Attempt.completed_at.isnot(None)
        ).order_by(desc(Attempt.completed_at)).limit(5).all()
        
        if not recent_attempts:
            return {}
        
        attempt_ids = [a.id for a in recent_attempts]
        
        # Legacy databases may store `results.is_correct` as text rather than boolean.
        # Query all and normalize in Python for compatibility.
        all_results = db.query(Result).filter(
            Result.attempt_id.in_(attempt_ids),
        ).all()
        wrong_results = [result for result in all_results if not AdaptiveEngine._is_correct_value(result.is_correct)]
        
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
        
        mastery = AdaptiveEngine.calculate_user_mastery(db, user_id, topic_id)
        wrong_patterns = AdaptiveEngine.get_wrong_answer_patterns(db, user_id, topic_id)
        
        recent_score = mastery["recent_score"]
        
        if recent_score >= 90:
            return "hard"
        elif recent_score >= 70:
            if wrong_patterns.get("hard", 0) > wrong_patterns.get("medium", 0):
                return "medium"
            return "hard"
        elif recent_score >= 50:
            if wrong_patterns.get("medium", 0) > wrong_patterns.get("easy", 0):
                return "easy"
            return "medium"
        else:
            return "easy"
    
    @staticmethod
    def get_adaptive_questions(
        db: Session, 
        user_id: int, 
        topic_id: int, 
        subtopic_id: Optional[int], 
        limit: int
    ) -> List[Question]:
        """
        Determines user proficiency based on past attempts and fetches questions 
        with appropriate difficulty.
        Score > 90% -> Increase difficulty (Hard)
        Score 70-90% -> Maintain difficulty (Medium)
        Score < 70% -> Reduce difficulty (Easy)
        Also considers wrong answer patterns and topic mastery.
        """
        
        target_difficulty = AdaptiveEngine.determine_target_difficulty(db, user_id, topic_id)
        
        # Fetch questions
        base_query = db.query(Question).filter(Question.topic_id == topic_id)
        if subtopic_id is not None:
            base_query = base_query.filter(Question.subtopic_id == subtopic_id)
            
        # Try to get questions of target difficulty
        questions = base_query.filter(func.lower(Question.difficulty) == target_difficulty).order_by(func.random()).limit(limit).all()
        
        # If we don't have enough questions of the specific difficulty, backfill with random questions
        if len(questions) < limit:
            remaining = limit - len(questions)
            exclude_ids = [q.id for q in questions]
            
            # Try adjacent difficulty first
            if target_difficulty == "hard":
                fallback = "medium"
            elif target_difficulty == "easy":
                fallback = "medium"
            else:
                fallback = None
            
            if fallback:
                backfill = base_query.filter(
                    Question.id.notin_(exclude_ids),
                    func.lower(Question.difficulty) == fallback
                ).order_by(func.random()).limit(remaining).all()
                questions.extend(backfill)
                remaining = limit - len(questions)
                exclude_ids.extend([q.id for q in backfill])
            
            # If still not enough, get any remaining questions
            if remaining > 0:
                backfill = base_query.filter(
                    Question.id.notin_(exclude_ids)
                ).order_by(func.random()).limit(remaining).all()
                questions.extend(backfill)
            
        return questions
    
    @staticmethod
    def update_difficulty_during_quiz(
        db: Session,
        attempt_id: int,
        current_difficulty: str,
        answered_questions: Dict[int, bool]  # question_id -> is_correct
    ) -> str:
        """
        Update difficulty during quiz based on consecutive correct/incorrect answers.
        
        Args:
            db: Database session
            attempt_id: Current attempt ID
            current_difficulty: Current difficulty level
            answered_questions: Dictionary of question_id -> is_correct for answered questions
            
        Returns:
            New difficulty level (may be same as current)
        """
        if len(answered_questions) < AdaptiveEngine.MIN_QUESTIONS_BEFORE_ADJUSTMENT:
            return current_difficulty
        
        # Get the last N answers
        recent_answers = list(answered_questions.values())[-AdaptiveEngine.CONSECUTIVE_THRESHOLD:]
        
        # Check for consecutive correct answers
        if all(recent_answers):
            # User is excelling, increase difficulty
            current_idx = AdaptiveEngine.DIFFICULTY_LEVELS.index(current_difficulty)
            if current_idx < len(AdaptiveEngine.DIFFICULTY_LEVELS) - 1:
                new_difficulty = AdaptiveEngine.DIFFICULTY_LEVELS[current_idx + 1]
                AdaptiveEngine._log_difficulty_change(db, attempt_id, current_difficulty, new_difficulty, "consecutive_correct")
                return new_difficulty
        
        # Check for consecutive incorrect answers
        elif not any(recent_answers):
            # User is struggling, decrease difficulty
            current_idx = AdaptiveEngine.DIFFICULTY_LEVELS.index(current_difficulty)
            if current_idx > 0:
                new_difficulty = AdaptiveEngine.DIFFICULTY_LEVELS[current_idx - 1]
                AdaptiveEngine._log_difficulty_change(db, attempt_id, current_difficulty, new_difficulty, "consecutive_incorrect")
                return new_difficulty
        
        return current_difficulty
    
    @staticmethod
    def _log_difficulty_change(
        db: Session,
        attempt_id: int,
        old_difficulty: str,
        new_difficulty: str,
        reason: str
    ):
        """Log difficulty progression for analytics."""
        attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if not attempt:
            return
        
        if attempt.difficulty_progression is None:
            attempt.difficulty_progression = []
        
        attempt.difficulty_progression.append({
            "question_number": len(attempt.difficulty_progression) + 1,
            "old_difficulty": old_difficulty,
            "new_difficulty": new_difficulty,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        db.commit()
    
    @staticmethod
    def get_next_adaptive_question(
        db: Session,
        attempt: Attempt,
        current_difficulty: str,
        answered_question_ids: List[int]
    ) -> Optional[Question]:
        """
        Get the next adaptive question based on current difficulty and answered questions.
        
        Args:
            db: Database session
            attempt: Current attempt
            current_difficulty: Current difficulty level
            answered_question_ids: List of already answered question IDs
            
        Returns:
            Next question to present, or None if no more questions available
        """
        # Get questions at current difficulty that haven't been answered
        available_questions = db.query(Question).filter(
            Question.topic_id == attempt.topic_id,
            func.lower(Question.difficulty) == current_difficulty,
            Question.id.notin_(answered_question_ids)
        ).order_by(func.random()).first()
        
        if available_questions:
            return available_questions
        
        # Fallback: try adjacent difficulty
        current_idx = AdaptiveEngine.DIFFICULTY_LEVELS.index(current_difficulty)
        
        # Try harder difficulty first
        if current_idx < len(AdaptiveEngine.DIFFICULTY_LEVELS) - 1:
            harder = AdaptiveEngine.DIFFICULTY_LEVELS[current_idx + 1]
            available_questions = db.query(Question).filter(
                Question.topic_id == attempt.topic_id,
                func.lower(Question.difficulty) == harder,
                Question.id.notin_(answered_question_ids)
            ).order_by(func.random()).first()
            if available_questions:
                return available_questions
        
        # Try easier difficulty
        if current_idx > 0:
            easier = AdaptiveEngine.DIFFICULTY_LEVELS[current_idx - 1]
            available_questions = db.query(Question).filter(
                Question.topic_id == attempt.topic_id,
                func.lower(Question.difficulty) == easier,
                Question.id.notin_(answered_question_ids)
            ).order_by(func.random()).first()
            if available_questions:
                return available_questions
        
        # Final fallback: any remaining question
        return db.query(Question).filter(
            Question.topic_id == attempt.topic_id,
            Question.id.notin_(answered_question_ids)
        ).order_by(func.random()).first()
