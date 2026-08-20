import unittest
import sys
from pathlib import Path

from pydantic import ValidationError

_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from backend.models.question import Question
from backend.schemas.exam_criteria import ExamCriteriaCreate
from backend.services.assessment_service import assessment_service
from backend.services.exam_criteria_service import exam_criteria_service


class ExamCriteriaModuleTests(unittest.TestCase):
    def test_duration_must_be_at_least_sixty_minutes(self):
        with self.assertRaises(ValidationError):
            ExamCriteriaCreate(
                exam_name="Math Final",
                board="CBSE",
                subject="Mathematics",
                topic_id=1,
                duration_minutes=30,
            )

    def test_adaptive_recommendation_increases_for_high_scores(self):
        recommendation = exam_criteria_service.adaptive_recommendation(
            percentage=95,
            current_difficulty="medium",
            confidence_score=0.82,
            previous_attempts=4,
            mastery_level="intermediate",
            wrong_answer_patterns={"hard": 1, "medium": 0, "easy": 0},
            learning_progress=7.5,
        )

        self.assertEqual(recommendation["action"], "increase")
        self.assertEqual(recommendation["next_difficulty"], "hard")
        self.assertEqual(recommendation["previous_attempts"], 4)
        self.assertEqual(recommendation["mastery_level"], "intermediate")

    def test_adaptive_recommendation_reduces_for_low_scores(self):
        recommendation = exam_criteria_service.adaptive_recommendation(
            percentage=45,
            current_difficulty="medium",
            confidence_score=0.4,
        )

        self.assertEqual(recommendation["action"], "reduce")
        self.assertEqual(recommendation["next_difficulty"], "easy")

    def test_multiple_select_grading_matches_array_answers(self):
        question = Question(
            id=1,
            topic_id=1,
            text="Select the two correct options",
            question_type="multiple_select",
            options=["A", "B", "C", "D"],
            correct_option=None,
            correct_options=["A", "C"],
        )

        self.assertTrue(assessment_service.grade_answer(question, "A,C"))
        self.assertFalse(assessment_service.grade_answer(question, "A,B"))


if __name__ == "__main__":
    unittest.main()
