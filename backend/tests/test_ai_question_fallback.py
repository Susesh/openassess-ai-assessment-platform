import unittest

from backend.ai.question_generator import build_fallback_questions


class FallbackQuestionGeneratorTests(unittest.TestCase):
    def test_build_fallback_questions_returns_requested_count(self):
        questions = build_fallback_questions(
            topic="Python",
            subject="Computer Science",
            subtopic="Variables",
            difficulty="medium",
            count=3,
            exam_module="Standard",
            language="en",
        )

        self.assertEqual(len(questions), 3)
        for question in questions:
            self.assertIn("question", question)
            self.assertEqual(len(question["options"]), 4)
            self.assertIn(question["answer"], {"A", "B", "C", "D"})
            self.assertTrue(question["explanation"])


if __name__ == "__main__":
    unittest.main()
