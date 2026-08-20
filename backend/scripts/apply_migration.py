import sys
import os
from sqlalchemy import text

# Ensure project root is on sys.path so `backend` package can be imported
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import engine

SQL_PATH = os.path.join(ROOT, "backend", "migrations", "20260701_enhance_assessment_models.sql")

if __name__ == "__main__":
    with open(SQL_PATH, "r", encoding="utf-8") as f:
        sql = f.read()

    print(f"Applying migration: {SQL_PATH}")
    try:
        with engine.begin() as conn:
            # Use exec_driver_sql to allow multiple statements
            conn.exec_driver_sql(sql)
        print("Migration applied successfully.")
    except Exception as e:
        print("Migration failed:", e)
        raise
