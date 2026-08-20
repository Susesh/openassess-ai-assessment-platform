"""
Database Migration: Add exam_module column to questions table

This script adds the exam_module column to the questions table to support
strict difficulty and exam module filtering in question generation.

Run:
    cd backend
    python migrations/add_exam_module_column.py
"""
import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:newpassword123@localhost:5432/OpenAssess",
)


def migrate():
    """Add exam_module column to questions table."""
    engine = create_engine(DATABASE_URL)
    
    try:
        print("Starting migration: Add exam_module column to questions table...")
        print("=" * 60)
        
        with engine.connect() as conn:
            # Check if column already exists
            check_column = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'questions' 
                AND column_name = 'exam_module'
            """)
            
            result = conn.execute(check_column).fetchone()
            
            if result:
                print("Column 'exam_module' already exists in questions table.")
                print("Migration skipped.")
                return
            
            # Add the column
            alter_table = text("""
                ALTER TABLE questions 
                ADD COLUMN exam_module VARCHAR(255)
            """)
            
            conn.execute(alter_table)
            conn.commit()
        
        print("✓ Successfully added 'exam_module' column to questions table")
        print("=" * 60)
        print("Migration completed successfully.")
        
    except Exception as e:
        print(f"ERROR: Migration failed - {e}")
        raise


if __name__ == "__main__":
    migrate()
