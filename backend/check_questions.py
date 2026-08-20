"""
Check Database Question Count
This script checks how many questions are in the database.
"""
import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Add parent directory to path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import engine

load_dotenv()

print("=" * 60)
print("Database Question Count Check")
print("=" * 60)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM questions"))
        count = result.scalar()
        print(f"\nTotal questions in database: {count}")
        
        if count == 0:
            print("\n⚠ No questions found in database!")
            print("You need to seed the database with questions.")
            print("Run: python backend/seed.py")
        elif count < 100:
            print(f"\n⚠ Low question count ({count}). Consider seeding more questions.")
        else:
            print(f"\n✓ Sufficient questions available for fallback.")
            
        # Check questions by difficulty
        print("\nQuestions by difficulty:")
        for diff in ['easy', 'medium', 'hard']:
            result = conn.execute(text(f"SELECT COUNT(*) FROM questions WHERE difficulty = '{diff}'"))
            count = result.scalar()
            print(f"  {diff}: {count}")
            
except Exception as e:
    print(f"\n✗ Error checking database: {e}")

print("=" * 60)
