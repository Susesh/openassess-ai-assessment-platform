"""Repair script: populate missing QuestionPaperQuestion rows for papers with missing items.

Usage:
    .\.venv\Scripts\python.exe backend/scripts/fix_missing_paper_questions.py
"""
from __future__ import annotations

import os
import sys
from typing import Optional
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from sqlalchemy import func
from backend.database import SessionLocal
from backend.models.question import Question
from backend.models.topic import Topic
from backend.models.question_paper import QuestionPaper, QuestionPaperQuestion
from backend.ai import question_generator as qg

MIN_QUESTIONS = 60


def repair_once():
    db = SessionLocal()
    try:
        papers = db.query(QuestionPaper).order_by(QuestionPaper.id.asc()).all()
        repaired = 0
        for paper in papers:
            # load linked questions count
            existing_items = db.query(QuestionPaperQuestion).filter(QuestionPaperQuestion.paper_id == paper.id).order_by(QuestionPaperQuestion.question_number).all()
            if existing_items and len(existing_items) >= 1:
                continue

            needed = (paper.total_questions or MIN_QUESTIONS) or MIN_QUESTIONS
            print(f"Repairing paper id={paper.id} '{paper.exam_name}' needs {needed} questions")

            # Try to find a topic row
            topic_row: Optional[Topic] = None
            if paper.topic_name:
                topic_row = db.query(Topic).filter(func.lower(Topic.name) == (paper.topic_name or "").lower()).first()

            found_questions = []
            if topic_row:
                found_questions = db.query(Question).filter(Question.topic_id == topic_row.id).order_by(func.random()).limit(needed).all()

            if not found_questions and paper.subject:
                found_questions = db.query(Question).filter(func.lower(Question.subject) == (paper.subject or "").lower()).order_by(func.random()).limit(needed).all()

            # If still empty, use fallback generator (may create questions in DB)
            if len(found_questions) < needed:
                to_generate = needed - len(found_questions)
                print(f"  Generating {to_generate} fallback questions for paper id={paper.id}")
                # Ensure we have a valid topic_id (questions.topic_id is NOT NULL)
                if not topic_row:
                    topic_row = db.query(Topic).filter(func.lower(Topic.name) == "general").first()
                    if not topic_row:
                        topic_row = Topic(name="General", description="Auto-created general topic")
                        db.add(topic_row)
                        db.flush()

                fallback = qg._fallback_questions(db, paper.topic_name or paper.subject or "General", paper.difficulty or "medium", to_generate, topic_row.id if topic_row else None)
                for item in fallback:
                    q = Question(
                        topic_id=topic_row.id,
                        text=item.get("question") or "",
                        options=item.get("options") or [],
                        correct_option=item.get("answer") or None,
                        explanation=item.get("explanation") or None,
                        difficulty=paper.difficulty or "medium",
                        subject=paper.subject or None,
                        source="generated_fallback_repair",
                    )
                    db.add(q)
                    db.flush()
                    found_questions.append(q)

            # Trim or extend to needed
            found_questions = found_questions[:needed]

            # Insert QuestionPaperQuestion entries
            for idx, q in enumerate(found_questions, start=1):
                qpq = QuestionPaperQuestion(
                    paper_id=paper.id,
                    question_id=q.id,
                    question_number=idx,
                    topic_id=q.topic_id,
                    subtopic_id=q.subtopic_id,
                    question_type=getattr(q, "question_type", "mcq") or "mcq",
                    difficulty=getattr(q, "difficulty", paper.difficulty) or "medium",
                    marks=1,
                    question_text_snapshot=q.text,
                    options_snapshot=list(q.options or []),
                    correct_option_snapshot=getattr(q, "correct_option", None),
                    explanation_snapshot=getattr(q, "explanation", None),
                    meta_data={"repaired_at": datetime.utcnow().isoformat()},
                )
                db.add(qpq)

            paper.total_questions = len(found_questions)
            paper.total_marks = sum(1 for _ in found_questions)
            db.commit()
            repaired += 1

        print(f"Repair finished. Repaired {repaired} papers.")
    finally:
        db.close()


if __name__ == '__main__':
    repair_once()
