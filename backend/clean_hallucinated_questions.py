"""
Clean Hallucinated Questions from Database
This script removes questions that contain cross-domain contamination (Computer Science jargon in non-CS subjects)
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
print("Clean Hallucinated Questions")
print("=" * 60)

# Cross-domain contamination keywords to detect
cs_keywords = [
    "source code", "production data", "latency", "handwritten notes", 
    "format comments", "zero latency", "deleting production data",
    "programming", "software", "algorithm", "database", "server",
    "client", "api", "function", "variable", "class", "object",
    "compile", "execute", "runtime", "debug", "test case",
    "deployment", "version control", "git", "repository"
]

try:
    with engine.connect() as conn:
        # Get total question count before cleanup
        result = conn.execute(text("SELECT COUNT(*) FROM questions"))
        total_before = result.scalar()
        print(f"\nTotal questions before cleanup: {total_before}")
        
        # Find and delete questions with CS contamination in non-CS subjects
        deleted_count = 0
        for keyword in cs_keywords:
            # Delete questions containing CS keywords but not in CS subjects
            delete_query = text("""
                DELETE FROM questions 
                WHERE LOWER(text) LIKE :keyword 
                AND subject NOT ILIKE '%computer science%'
                AND subject NOT ILIKE '%programming%'
                AND subject NOT ILIKE '%software%'
            """)
            result = conn.execute(delete_query, {"keyword": f"%{keyword}%"})
            deleted = result.rowcount
            if deleted > 0:
                print(f"  Deleted {deleted} questions containing '{keyword}'")
                deleted_count += deleted
            conn.commit()
        
        # Get total question count after cleanup
        result = conn.execute(text("SELECT COUNT(*) FROM questions"))
        total_after = result.scalar()
        
        print(f"\nTotal questions after cleanup: {total_after}")
        print(f"Questions deleted: {deleted_count}")
        
        # Check remaining questions by difficulty
        print("\nQuestions by difficulty after cleanup:")
        for diff in ['easy', 'medium', 'hard']:
            result = conn.execute(text(f"SELECT COUNT(*) FROM questions WHERE difficulty = '{diff}'"))
            count = result.scalar()
            print(f"  {diff}: {count}")
            
        print("\n" + "=" * 60)
        print("✓ Cleanup complete!")
        print("=" * 60)
        
except Exception as e:
    print(f"\n✗ Error during cleanup: {e}")
