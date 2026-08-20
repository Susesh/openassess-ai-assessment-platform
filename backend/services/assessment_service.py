from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from backend.models.attempt import Attempt
from backend.models.question import Question
from backend.models.result import Result
from backend.models.topic import Topic
from backend.models.user import User
from backend.services.exam_criteria_service import MIN_EXAM_DURATION_MINUTES, exam_criteria_service


class AssessmentService:
    """Enhanced assessment service with comprehensive workflow support."""
    
    QUESTION_STATUS = {
        "unanswered": "unanswered",
        "visited": "visited", 
        "answered": "answered",
        "review": "review"
    }
    
    @staticmethod
    def validate_question_count(question_count: int) -> bool:
        """Ensure assessment meets minimum question requirement."""
        return question_count >= 40
    
    @staticmethod
    def validate_duration(duration_minutes: int) -> int:
        """Ensure assessment meets minimum duration requirement."""
        return max(MIN_EXAM_DURATION_MINUTES, duration_minutes)
    
    @staticmethod
    def initialize_question_status(question_ids: List[int]) -> Dict[str, str]:
        """Initialize question status tracking for new attempt."""
        return {str(qid): AssessmentService.QUESTION_STATUS["unanswered"] for qid in question_ids}
    
    @staticmethod
    def update_question_status(
        attempt: Attempt,
        question_id: int,
        status: str,
        mark_for_review: bool = False
    ) -> None:
        """Update status for a specific question."""
        if not attempt.question_status:
            attempt.question_status = {}
        
        attempt.question_status[str(question_id)] = status
        
        # Handle marked for review
        if not attempt.marked_for_review:
            attempt.marked_for_review = []
        
        marked_list = list(attempt.marked_for_review) if isinstance(attempt.marked_for_review, list) else []
        
        if mark_for_review and question_id not in marked_list:
            marked_list.append(question_id)
        elif not mark_for_review and question_id in marked_list:
            marked_list.remove(question_id)
        
        attempt.marked_for_review = marked_list
    
    @staticmethod
    def get_question_status_summary(attempt: Attempt) -> Dict[str, int]:
        """Get summary of question statuses."""
        if not attempt.question_status:
            return {
                "total": attempt.total_questions or 0,
                "answered": 0,
                "unanswered": attempt.total_questions or 0,
                "review": 0,
                "visited": 0
            }
        
        status_counts = {
            "total": attempt.total_questions or 0,
            "answered": 0,
            "unanswered": 0,
            "review": 0,
            "visited": 0
        }
        
        for status in attempt.question_status.values():
            if status in status_counts:
                status_counts[status] += 1
        
        # Count marked for review separately
        if attempt.marked_for_review:
            status_counts["review"] = len(attempt.marked_for_review)
        
        return status_counts
    
    @staticmethod
    def get_remaining_time(attempt: Attempt) -> int:
        """Calculate remaining time in seconds."""
        if not attempt.deadline_at:
            return 0
        remaining = (attempt.deadline_at - datetime.utcnow()).total_seconds()
        return max(0, int(remaining))
    
    @staticmethod
    def is_time_expired(attempt: Attempt) -> bool:
        """Check if assessment time has expired."""
        return AssessmentService.get_remaining_time(attempt) == 0
    
    @staticmethod
    def get_progress_percentage(attempt: Attempt) -> float:
        """Calculate progress percentage based on answered questions."""
        if not attempt.total_questions or attempt.total_questions == 0:
            return 0.0
        
        status_summary = AssessmentService.get_question_status_summary(attempt)
        answered = status_summary.get("answered", 0)
        
        return round((answered / attempt.total_questions) * 100, 1)
    
    @staticmethod
    def can_navigate_to_question(attempt: Attempt, current_index: int, target_index: int) -> bool:
        """Validate question navigation."""
        if not attempt.question_ids:
            return False
        
        total_questions = len(attempt.question_ids)
        return 0 <= target_index < total_questions
    
    @staticmethod
    def get_next_unanswered_question(attempt: Attempt, current_index: int) -> Optional[int]:
        """Find next unanswered question."""
        if not attempt.question_ids or not attempt.question_status:
            return None
        
        for i in range(current_index + 1, len(attempt.question_ids)):
            qid = attempt.question_ids[i]
            status = attempt.question_status.get(str(qid))
            if status != AssessmentService.QUESTION_STATUS["answered"]:
                return i
        
        return None
    
    @staticmethod
    def get_previous_question(attempt: Attempt, current_index: int) -> Optional[int]:
        """Get previous question index."""
        if current_index > 0:
            return current_index - 1
        return None
    
    @staticmethod
    def validate_answer_for_question_type(
        question: Question,
        answer: Any
    ) -> bool:
        """Validate answer format based on question type."""
        question_type = question.question_type.lower()
        
        if question_type in ["mcq", "true_false"]:
            return answer in ["A", "B", "C", "D", "True", "False"] if question_type == "true_false" else answer in ["A", "B", "C", "D"]
        
        elif question_type == "multiple_select":
            if isinstance(answer, str):
                return all(opt.strip() in ["A", "B", "C", "D"] for opt in answer.split(","))
            return isinstance(answer, list)
        
        elif question_type in ["fill_in_blank", "numerical", "short_answer"]:
            return isinstance(answer, str) and len(answer.strip()) > 0
        
        elif question_type == "long_answer":
            return isinstance(answer, str) and len(answer.strip()) > 10
        
        elif question_type == "assertion_reason":
            return answer in ["A", "B", "C", "D"]  # Both correct, Assertion correct, Reason correct, Both incorrect
        
        return True
    
    @staticmethod
    def _normalize_answer_tokens(answer: Any) -> set[str]:
        if answer is None:
            return set()
        if isinstance(answer, (list, tuple, set)):
            return {str(item).strip().upper() for item in answer if str(item).strip()}
        if isinstance(answer, str):
            normalized = answer.strip()
            if not normalized:
                return set()
            if normalized.startswith("[") and normalized.endswith("]"):
                try:
                    parsed = eval(normalized, {"__builtins__": {}}, {})
                    if isinstance(parsed, (list, tuple, set)):
                        return {str(item).strip().upper() for item in parsed if str(item).strip()}
                except Exception:
                    pass
            return {token.strip().upper() for token in normalized.replace(";", ",").split(",") if token.strip()}
        return {str(answer).strip().upper()}

    @staticmethod
    def grade_answer(question: Question, answer: Any) -> bool:
        """Grade answer based on question type."""
        question_type = (question.question_type or "mcq").lower()
        
        if question_type in ["mcq", "true_false", "fill_in_blank", "numerical"]:
            return str(answer).strip().lower() == str(question.correct_option).strip().lower()
        
        elif question_type == "multiple_select":
            correct = AssessmentService._normalize_answer_tokens(question.correct_options or question.correct_option)
            given = AssessmentService._normalize_answer_tokens(answer)
            return correct == given and bool(correct)
        
        elif question_type in ["short_answer", "long_answer"]:
            return str(answer).strip().lower() in str(question.correct_option or "").strip().lower()
        
        elif question_type == "assertion_reason":
            return str(answer).strip().lower() == str(question.correct_option).strip().lower()
        
        return False
    
    @staticmethod
    def calculate_marks(
        question: Question,
        is_correct: bool,
        negative_marking: float = 0.0
    ) -> float:
        """Calculate marks for a question."""
        marks = question.marks or 1.0
        
        if is_correct:
            return marks
        elif negative_marking > 0:
            return -negative_marking
        
        return 0.0
    
    @staticmethod
    def generate_topic_wise_analysis(attempt: Attempt, db: Session) -> Dict[str, Any]:
        """Generate topic-wise performance analysis."""
        results = db.query(Result).filter(Result.attempt_id == attempt.id).all()
        
        topic_analysis = {}
        
        for result in results:
            question = db.query(Question).filter(Question.id == result.question_id).first()
            if not question:
                continue
            
            topic_name = question.topic.name if question.topic else "Unknown"
            subtopic_name = question.subtopic.name if question.subtopic else None
            
            key = f"{topic_name} - {subtopic_name}" if subtopic_name else topic_name
            
            if key not in topic_analysis:
                topic_analysis[key] = {
                    "total": 0,
                    "correct": 0,
                    "incorrect": 0,
                    "unanswered": 0,
                    "percentage": 0.0
                }
            
            topic_analysis[key]["total"] += 1
            
            if result.is_correct:
                topic_analysis[key]["correct"] += 1
            elif result.selected_option == "Unanswered":
                topic_analysis[key]["unanswered"] += 1
            else:
                topic_analysis[key]["incorrect"] += 1
        
        # Calculate percentages
        for topic_data in topic_analysis.values():
            if topic_data["total"] > 0:
                topic_data["percentage"] = round((topic_data["correct"] / topic_data["total"]) * 100, 1)
        
        return topic_analysis
    
    @staticmethod
    def identify_weak_topics(attempt: Attempt, db: Session) -> List[str]:
        """Identify weak topics based on performance."""
        topic_analysis = AssessmentService.generate_topic_wise_analysis(attempt, db)
        
        weak_topics = []
        for topic_name, data in topic_analysis.items():
            if data["percentage"] < 60:  # Below 60% is considered weak
                weak_topics.append(topic_name)
        
        return sorted(weak_topics)
    
    @staticmethod
    def identify_strong_topics(attempt: Attempt, db: Session) -> List[str]:
        """Identify strong topics based on performance."""
        topic_analysis = AssessmentService.generate_topic_wise_analysis(attempt, db)
        
        strong_topics = []
        for topic_name, data in topic_analysis.items():
            if data["percentage"] >= 80:  # 80% and above is considered strong
                strong_topics.append(topic_name)
        
        return sorted(strong_topics)
    
    @staticmethod
    def generate_learning_recommendations(
        attempt: Attempt,
        db: Session
    ) -> List[str]:
        """Generate personalized learning recommendations."""
        weak_topics = AssessmentService.identify_weak_topics(attempt, db)
        recommendations = []
        
        if weak_topics:
            recommendations.append(f"Focus on improving performance in: {', '.join(weak_topics[:3])}")
            recommendations.append("Review incorrect answers and understand the concepts")
            recommendations.append("Practice more questions from weak areas")
        else:
            recommendations.append("Maintain current performance level")
        
        if attempt.percentage >= 80:
            recommendations.append("Consider attempting higher difficulty questions")
        
        if not attempt.is_passed:
            recommendations.append("Complete remediation plan before reattempting")
        
        return recommendations
    
    @staticmethod
    def calculate_integrity_score(attempt: Attempt) -> float:
        """Calculate integrity score based on proctoring violations."""
        if not attempt.proctoring_violations_count:
            return 100.0
        
        # Simple formula: 100 - (violations * 5), minimum 0
        score = 100.0 - (attempt.proctoring_violations_count * 5)
        return max(0.0, round(score, 1))


# Global service instance
assessment_service = AssessmentService()
