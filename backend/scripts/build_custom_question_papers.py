"""
Build custom question papers that combine questions from multiple subjects.
This script allows creating comprehensive exam papers like JEE (Physics + Chemistry + Maths).

Usage:
    python -m backend.scripts.build_custom_question_papers --exam "JEE Main 2024" --subjects Physics Chemistry Maths --count 30
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal
from backend.models.question import Question
from backend.models.question_paper import QuestionPaper, QuestionPaperQuestion
from sqlalchemy.orm import joinedload


def build_custom_paper(db, exam_name: str, subjects: list[str], questions_per_subject: int, 
                       exam_category: str, board: str, year: int) -> int:
    """Build a custom question paper combining multiple subjects."""
    
    # Collect questions from each subject
    all_questions = []
    subject_distribution = {}
    
    for subject in subjects:
        # Query questions with topic joined to get subject information
        # Check both question.subject and topic.subject
        questions = (
            db.query(Question)
            .options(joinedload(Question.topic))
            .filter(
                (Question.subject == subject) | 
                (Question.topic.has(subject=subject))
            )
            .order_by(Question.id.asc())
            .limit(questions_per_subject)
            .all()
        )
        
        if not questions:
            print(f"  Warning: No questions found for subject: {subject}")
            continue
        
        all_questions.extend(questions)
        subject_distribution[subject] = len(questions)
        print(f"  Selected {len(questions)} questions from {subject}")
    
    if not all_questions:
        print("  Error: No questions found for any of the specified subjects")
        return 0
    
    # Check if paper already exists
    existing = (
        db.query(QuestionPaper)
        .filter(
            QuestionPaper.exam_name == exam_name,
            QuestionPaper.year == year,
        )
        .first()
    )
    
    if existing:
        print(f"  Paper '{exam_name}' already exists. Skipping.")
        return 0
    
    # Create the question paper
    paper = QuestionPaper(
        exam_category=exam_category,
        board=board,
        exam_name=exam_name,
        year=year,
        academic_year=f"{year-1}-{year}",
        subject=",".join(subjects),  # Comma-separated for multi-subject papers
        question_type="mcq",
        difficulty="mixed",
        language="en",
        total_questions=len(all_questions),
        total_marks=len(all_questions),
        source="Custom multi-subject paper",
        meta_data={
            "custom": True,
            "subject_distribution": subject_distribution,
            "questions_per_subject": questions_per_subject,
        },
        is_published=True,
    )
    db.add(paper)
    db.flush()
    
    # Add questions to the paper
    for index, question in enumerate(all_questions, start=1):
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
                meta_data={"custom": True},
            )
        )
    
    db.commit()
    print(f"  Created paper '{exam_name}' with {len(all_questions)} questions")
    return 1


def main():
    parser = argparse.ArgumentParser(description="Build custom multi-subject question papers")
    parser.add_argument("--exam", required=True, help="Exam name (e.g., 'JEE Main 2024')")
    parser.add_argument("--subjects", required=True, nargs='+', help="Subjects to include")
    parser.add_argument("--count", type=int, default=20, help="Questions per subject")
    parser.add_argument("--category", default="Custom", help="Exam category")
    parser.add_argument("--board", default="Custom", help="Board name")
    parser.add_argument("--year", type=int, default=datetime.utcnow().year, help="Exam year")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        print(f"Building custom paper: {args.exam}")
        print(f"Subjects: {', '.join(args.subjects)}")
        print(f"Questions per subject: {args.count}")
        
        created = build_custom_paper(
            db,
            exam_name=args.exam,
            subjects=args.subjects,
            questions_per_subject=args.count,
            exam_category=args.category,
            board=args.board,
            year=args.year,
        )
        
        if created:
            print(f"\nSuccessfully created custom question paper")
        else:
            print(f"\nNo paper created")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
