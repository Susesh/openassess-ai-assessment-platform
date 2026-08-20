"""
Item Response Theory (IRT) Service

Implements the 3-parameter logistic model (3PL) for adaptive testing:
- a-parameter (discrimination): How well the question distinguishes between high and low ability students
- b-parameter (difficulty): Ability level at which a student has 50% chance of answering correctly
- c-parameter (guessing): Probability of guessing the correct answer
"""

import math
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.question import Question
from backend.models.result import Result
from backend.models.attempt import Attempt


class IRTService:
    """Service for Item Response Theory calculations and adaptive question selection."""
    
    @staticmethod
    def three_pl_logistic(theta: float, a: float, b: float, c: float) -> float:
        """
        Calculate the probability of correct response using 3-parameter logistic model.
        
        P(theta) = c + (1 - c) / (1 + exp(-a * (theta - b)))
        
        Args:
            theta: Student ability estimate
            a: Discrimination parameter
            b: Difficulty parameter
            c: Guessing parameter
            
        Returns:
            Probability of correct response (0 to 1)
        """
        try:
            exponent = -a * (theta - b)
            # Prevent overflow in exp
            if exponent > 700:
                return c + (1 - c) * 1.0
            elif exponent < -700:
                return c + (1 - c) * 0.0
            else:
                return c + (1 - c) / (1 + math.exp(exponent))
        except (OverflowError, ValueError):
            return c + 0.5  # Fallback to middle value
    
    @staticmethod
    def fisher_information(theta: float, a: float, b: float, c: float) -> float:
        """
        Calculate Fisher information for a question at a given ability level.
        Higher information means the question is more informative at that ability level.
        
        I(theta) = a^2 * (P(theta) - c)^2 * (1 - P(theta)) / (P(theta) * (1 - c)^2)
        
        Args:
            theta: Student ability estimate
            a: Discrimination parameter
            b: Difficulty parameter
            c: Guessing parameter
            
        Returns:
            Fisher information value
        """
        p = IRTService.three_pl_logistic(theta, a, b, c)
        
        if p <= c or p >= 1.0:
            return 0.0
        
        numerator = (a ** 2) * ((p - c) ** 2) * (1 - p)
        denominator = p * ((1 - c) ** 2)
        
        if denominator == 0:
            return 0.0
        
        return numerator / denominator
    
    @staticmethod
    def estimate_ability(
        db: Session,
        user_id: int,
        topic_id: int,
        max_iterations: int = 50,
        convergence_threshold: float = 0.01
    ) -> float:
        """
        Estimate student ability using maximum likelihood estimation (MLE).
        
        Args:
            db: Database session
            user_id: User ID
            topic_id: Topic ID
            max_iterations: Maximum iterations for MLE
            convergence_threshold: Convergence threshold for MLE
            
        Returns:
            Estimated ability (theta)
        """
        # Get recent attempts for this topic
        attempts = db.query(Attempt).filter(
            Attempt.user_id == user_id,
            Attempt.topic_id == topic_id,
            Attempt.completed_at.isnot(None)
        ).order_by(Attempt.completed_at.desc()).limit(10).all()
        
        if not attempts:
            return 0.0  # Default ability for new users
        
        # Collect all responses with question parameters
        responses = []
        for attempt in attempts:
            attempt_ids = [a.id for a in attempts]
            results = db.query(Result).filter(
                Result.attempt_id.in_(attempt_ids)
            ).all()
            
            for result in results:
                question = db.query(Question).filter(Question.id == result.question_id).first()
                if question:
                    responses.append({
                        'is_correct': IRTService._is_correct_value(result.is_correct),
                        'a': question.irt_discrimination or 1.0,
                        'b': question.irt_difficulty or 0.0,
                        'c': question.irt_guessing or 0.25
                    })
        
        if not responses:
            return 0.0
        
        # MLE using Newton-Raphson method
        theta = 0.0  # Initial estimate
        
        for iteration in range(max_iterations):
            gradient = 0.0
            hessian = 0.0
            
            for response in responses:
                p = IRTService.three_pl_logistic(
                    theta, 
                    response['a'], 
                    response['b'], 
                    response['c']
                )
                
                # Gradient (first derivative)
                gradient += response['a'] * (response['is_correct'] - p) * (1 - response['c']) / (p - response['c'])
                
                # Hessian (second derivative)
                if p > response['c'] and p < 1.0:
                    fisher_info = IRTService.fisher_information(
                        theta, response['a'], response['b'], response['c']
                    )
                    hessian -= fisher_info
            
            # Avoid division by zero
            if abs(hessian) < 1e-10:
                break
            
            # Newton-Raphson update
            delta = gradient / hessian
            theta -= delta
            
            # Check convergence
            if abs(delta) < convergence_threshold:
                break
        
        # Clamp theta to reasonable range (-4 to 4)
        return max(-4.0, min(4.0, theta))
    
    @staticmethod
    def _is_correct_value(value) -> bool:
        """Normalize various boolean representations."""
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            return value.strip().lower() in {"true", "t", "1", "yes", "y"}
        return False
    
    @staticmethod
    def select_irt_questions(
        db: Session,
        user_id: int,
        topic_id: int,
        count: int = 10,
        theta: Optional[float] = None
    ) -> List[Question]:
        """
        Select questions using IRT-based adaptive selection.
        Selects questions that maximize information at the student's ability level.
        
        Args:
            db: Database session
            user_id: User ID
            topic_id: Topic ID
            count: Number of questions to select
            theta: Student ability (if None, will be estimated)
            
        Returns:
            List of selected questions
        """
        # Estimate ability if not provided
        if theta is None:
            theta = IRTService.estimate_ability(db, user_id, topic_id)
        
        # Get all questions for the topic
        questions = db.query(Question).filter(Question.topic_id == topic_id).all()
        
        if not questions:
            return []
        
        # Calculate information for each question at current ability
        question_info = []
        for question in questions:
            a = question.irt_discrimination or 1.0
            b = question.irt_difficulty or 0.0
            c = question.irt_guessing or 0.25
            
            info = IRTService.fisher_information(theta, a, b, c)
            question_info.append((question, info))
        
        # Sort by information (descending)
        question_info.sort(key=lambda x: x[1], reverse=True)
        
        # Select top questions with some randomness for variety
        selected = []
        info_threshold = max(0.01, question_info[min(count, len(question_info)) - 1][1] if question_info else 0.01)
        
        high_info_questions = [q for q, info in question_info if info >= info_threshold]
        
        # If we have enough high-information questions, select from them
        if len(high_info_questions) >= count:
            import random
            selected = random.sample(high_info_questions, count)
        else:
            # Otherwise, take all high-info and fill with remaining
            selected = high_info_questions
            remaining = count - len(selected)
            
            remaining_questions = [q for q, info in question_info if q not in selected]
            if remaining_questions:
                import random
                selected.extend(random.sample(remaining_questions, min(remaining, len(remaining_questions))))
        
        return selected[:count]
    
    @staticmethod
    def calibrate_irt_parameters(
        db: Session,
        topic_id: int,
        min_responses: int = 100
    ) -> Dict[str, float]:
        """
        Calibrate IRT parameters for questions in a topic using historical data.
        This is a simplified calibration - production would use more sophisticated methods.
        
        Args:
            db: Database session
            topic_id: Topic ID
            min_responses: Minimum responses required for calibration
            
        Returns:
            Dictionary with calibration statistics
        """
        questions = db.query(Question).filter(Question.topic_id == topic_id).all()
        
        calibrated_count = 0
        total_questions = len(questions)
        
        for question in questions:
            # Get all results for this question
            results = db.query(Result).join(Attempt).filter(
                Result.question_id == question.id,
                Attempt.topic_id == topic_id,
                Attempt.completed_at.isnot(None)
            ).all()
            
            if len(results) < min_responses:
                continue
            
            # Calculate p-value (proportion correct)
            correct_count = sum(1 for r in results if IRTService._is_correct_value(r.is_correct))
            p_value = correct_count / len(results)
            
            # Simple calibration based on p-value
            # b-parameter (difficulty): inverse logit of p-value, adjusted for guessing
            c = 0.25  # Default guessing for 4-option MCQ
            adjusted_p = (p_value - c) / (1 - c)
            
            if 0 < adjusted_p < 1:
                b = -math.log((1 - adjusted_p) / adjusted_p)
            else:
                b = 0.0
            
            # a-parameter (discrimination): based on point-biserial correlation
            # Simplified: use default with slight variation based on p-value
            a = 1.0 + (0.5 - abs(p_value - 0.5))  # Higher discrimination for mid-range p-values
            
            # Update question parameters
            question.irt_difficulty = round(b, 2)
            question.irt_discrimination = round(a, 2)
            question.irt_guessing = c
            
            calibrated_count += 1
        
        db.commit()
        
        return {
            "total_questions": total_questions,
            "calibrated_questions": calibrated_count,
            "calibration_rate": calibrated_count / total_questions if total_questions > 0 else 0
        }


# Global service instance
irt_service = IRTService()
