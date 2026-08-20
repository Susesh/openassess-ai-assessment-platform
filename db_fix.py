from backend.database import engine
from sqlalchemy import text

queries = [
    'CREATE EXTENSION IF NOT EXISTS vector',
    'ALTER TABLE topics ADD COLUMN IF NOT EXISTS embedding vector(768)',
    'ALTER TABLE questions ADD COLUMN IF NOT EXISTS embedding vector(768)',
    'ALTER TABLE questions ADD COLUMN IF NOT EXISTS board VARCHAR',
    'ALTER TABLE questions ADD COLUMN IF NOT EXISTS class_name VARCHAR',
    'ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject VARCHAR',
    'ALTER TABLE questions ADD COLUMN IF NOT EXISTS year INTEGER',
    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR DEFAULT 'mcq'",
    'ALTER TABLE questions ADD COLUMN IF NOT EXISTS source VARCHAR',
    'ALTER TABLE questions ADD COLUMN IF NOT EXISTS tags JSON',
    'ALTER TABLE questions ADD COLUMN IF NOT EXISTS meta_data JSON'
]

with engine.begin() as conn:
    for q in queries:
        try:
            conn.execute(text(q))
            print(f"Success: {q[:40]}...")
        except Exception as e:
            print(f"Failed: {q[:40]}... Error: {e}")
