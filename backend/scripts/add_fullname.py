from backend.database import engine
from sqlalchemy import text

print('Running migration: add full_name and created_at if missing')
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR DEFAULT ''"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now()"))
print('Migration complete')
