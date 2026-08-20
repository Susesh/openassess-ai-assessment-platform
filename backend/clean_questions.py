"""
Surgical Database Cleanup Script for Presentation

This script safely deletes corrupted question data while preserving:
- User accounts and authentication data
- Quiz attempts (metadata preserved, results cleared)
- Topics and subtopics structure
- Question paper metadata

SAFE DELETION ORDER:
1. results (linked to questions)
2. question_paper_questions (links questions to papers)
3. questions (the corrupted data)

Run:
    python clean_questions.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.database import SessionLocal, engine


def clean_questions():
    """Surgically delete corrupted question data while preserving user accounts."""
    db = SessionLocal()
    
    try:
        print("Starting surgical database cleanup...")
        print("=" * 60)
        
        # Count records before deletion
        questions_count = db.execute(text("SELECT COUNT(*) FROM questions")).scalar()
        results_count = db.execute(text("SELECT COUNT(*) FROM results")).scalar()
        qpq_count = db.execute(text("SELECT COUNT(*) FROM question_paper_questions")).scalar()
        
        print(f"BEFORE CLEANUP:")
        print(f"  Questions: {questions_count}")
        print(f"  Results: {results_count}")
        print(f"  Question Paper Links: {qpq_count}")
        print()
        
        # Step 1: Delete results (linked to questions)
        print("Step 1: Deleting results...")
        results_deleted = db.execute(text("DELETE FROM results")).rowcount
        print(f"  ✓ Deleted {results_deleted} results")
        
        # Step 2: Delete question paper question links
        print("Step 2: Deleting question paper question links...")
        qpq_deleted = db.execute(text("DELETE FROM question_paper_questions")).rowcount
        print(f"  ✓ Deleted {qpq_deleted} question paper links")
        
        # Step 3: Delete questions (the corrupted data)
        print("Step 3: Deleting questions...")
        questions_deleted = db.execute(text("DELETE FROM questions")).rowcount
        print(f"  ✓ Deleted {questions_deleted} questions")
        
        # Commit transaction
        db.commit()
        
        print()
        print("=" * 60)
        print("CLEANUP COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print()
        print("PRESERVED DATA:")
        print("  ✓ User accounts (users table)")
        print("  ✓ Quiz attempts (attempts table)")
        print("  ✓ Topics and subtopics")
        print("  ✓ Question paper metadata")
        print()
        print("DELETED DATA:")
        print(f"  ✓ {results_deleted} results")
        print(f"  ✓ {qpq_deleted} question paper links")
        print(f"  ✓ {questions_deleted} questions")
        print()
        print("Next step: Run 'python seed.py' to populate fresh questions.")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: Cleanup failed - {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("WARNING: This will delete all question data from the database.")
    print("User accounts and authentication data will be preserved.")
    print()
    
    response = input("Type 'CONFIRM' to proceed: ")
    if response.strip().upper() == "CONFIRM":
        clean_questions()
    else:
        print("Cleanup cancelled.")
