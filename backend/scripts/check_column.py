import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import engine

with engine.connect() as conn:
    res = conn.exec_driver_sql(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='questions' AND column_name='correct_options'
    """
    )
    rows = res.fetchall()
    if rows:
        print("correct_options column exists")
    else:
        print("correct_options column NOT found")
