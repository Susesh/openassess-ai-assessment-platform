"""Smoke test for AI question generation (imports backend module).
Run with: python backend/scripts/test_ai_generation.py
"""
import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.ai import question_generator as qg
from backend.database import SessionLocal

def main():
    print('Calling generate_questions_from_ai...')
    try:
        res = qg.generate_questions_from_ai('Linear Algebra', 'medium', 5, 'CBSE')
        print('AI generated', len(res), 'questions')
        for i, q in enumerate(res, 1):
            print(i, q['question'][:120])
    except Exception as e:
        print('AI generation failed:', e)
        print('Falling back to DB/fallback...')
        db = SessionLocal()
        res = qg._fallback_questions(db, 'Linear Algebra', 'medium', 5, None)
        db.close()
        print('Fallback returned', len(res), 'questions')
        for i, q in enumerate(res, 1):
            print(i, q['question'][:120])

if __name__ == '__main__':
    main()
