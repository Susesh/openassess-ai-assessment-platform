from __future__ import annotations

import os
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import SessionLocal
from backend.models.question import Question
from backend.models.question_paper import QuestionPaper, QuestionPaperQuestion

SUPPORTED_EXAMS: list[tuple[str, str]] = [
    ("CBSE", "CBSE"),
    ("ICSE", "ICSE"),
    ("State Board", "State Board"),
    ("IIT-JEE", "IIT-JEE"),
    ("NEET", "NEET"),
    ("UPSC", "UPSC"),
    ("University Exams", "University Exams"),
]

MIN_QUESTIONS = 60
TARGET_QUESTIONS = 60
TARGET_YEAR = datetime.utcnow().year


def bootstrap() -> None:
    db = SessionLocal()
    try:
        # Query questions with topic joined to get subject information
        from sqlalchemy.orm import joinedload
        all_questions = db.query(Question).options(joinedload(Question.topic)).order_by(Question.id.asc()).all()
        if len(all_questions) < MIN_QUESTIONS:
            raise RuntimeError(f"Need at least {MIN_QUESTIONS} questions in bank, found {len(all_questions)}")

        # Group questions by subject (from topic if question.subject is not set)
        questions_by_subject = {}
        for q in all_questions:
            subject = q.subject or (q.topic.subject if q.topic and q.topic.subject else "General")
            if not subject or subject == "None":
                subject = "General"
            if subject not in questions_by_subject:
                questions_by_subject[subject] = []
            questions_by_subject[subject].append(q)

        created = 0
        # Create papers for each exam category and subject combination
        for category, board in SUPPORTED_EXAMS:
            for subject, questions in questions_by_subject.items():
                # Skip if not enough questions for this subject
                if len(questions) < MIN_QUESTIONS:
                    continue

                # Check if paper already exists
                existing = (
                    db.query(QuestionPaper)
                    .filter(
                        QuestionPaper.exam_category == category,
                        QuestionPaper.subject == subject,
                        QuestionPaper.is_published.is_(True),
                    )
                    .first()
                )
                if existing:
                    continue

                # Select questions for this subject
                chosen = questions[: min(TARGET_QUESTIONS, len(questions))]
                
                topic_name = next((q.topic.name for q in chosen if q.topic is not None), "General Topic")
                subtopic_name = next((q.subtopic.name for q in chosen if q.subtopic is not None), None)
                difficulty = next((q.difficulty for q in chosen if q.difficulty), "medium")
                question_type = next((q.question_type for q in chosen if q.question_type), "mcq")

                paper = QuestionPaper(
                    exam_category=category,
                    board=board,
                    exam_name=f"{category} {subject} Practice {TARGET_YEAR}",
                    year=TARGET_YEAR,
                    academic_year=f"{TARGET_YEAR-1}-{TARGET_YEAR}",
                    class_name=next((q.class_name for q in chosen if q.class_name), None),
                    subject=subject,
                    topic_name=topic_name,
                    subtopic_name=subtopic_name,
                    question_type=question_type,
                    difficulty=difficulty,
                    language="en",
                    total_questions=len(chosen),
                    total_marks=len(chosen),
                    source="OpenAssess Bootstrap from internal question bank",
                    meta_data={"bootstrap": True, "min_questions_rule": MIN_QUESTIONS},
                    is_published=True,
                )
                db.add(paper)
                db.flush()

                for index, question in enumerate(chosen, start=1):
                    db.add(
                        QuestionPaperQuestion(
                            paper_id=paper.id,
                            question_id=question.id,
                            question_number=index,
                            topic_id=question.topic_id,
                            subtopic_id=question.subtopic_id,
                            question_type=question.question_type or "mcq",
                            difficulty=question.difficulty or "medium",
                            marks=1,
                            question_text_snapshot=question.text,
                            options_snapshot=list(question.options or []),
                            correct_option_snapshot=question.correct_option,
                            explanation_snapshot=question.explanation,
                            meta_data={"bootstrap": True},
                        )
                    )

                created += 1

        db.commit()
        print(f"Bootstrap complete. Created {created} exam papers across {len(questions_by_subject)} subjects.")
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap()
