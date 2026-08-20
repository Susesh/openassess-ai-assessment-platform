"""
Wipe Questions Table
This script deletes all rows from the questions table to provide a clean slate.
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
print("Wipe Questions Table")
print("=" * 60)

try:
    with engine.connect() as conn:
        # Get total question count before wipe
        result = conn.execute(text("SELECT COUNT(*) FROM questions"))
        total_before = result.scalar()
        print(f"\nTotal questions before wipe: {total_before}")
        
        if total_before == 0:
            print("No questions to wipe. Database is already clean.")
        else:
            # Delete all questions
            delete_query = text("DELETE FROM questions")
            result = conn.execute(delete_query)
            conn.commit()
            
            print(f"Deleted {result.rowcount} questions")
            
            # Verify deletion
            result = conn.execute(text("SELECT COUNT(*) FROM questions"))
            total_after = result.scalar()
            print(f"Total questions after wipe: {total_after}")
            
            print("\n" + "=" * 60)
            print("✓ Questions table wiped successfully!")
            print("=" * 60)
            
except Exception as e:
    print(f"\n✗ Error during wipe: {e}")
