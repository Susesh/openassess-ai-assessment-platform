#!/usr/bin/env python3
from backend.database import SessionLocal
from backend.models.question_paper import QuestionPaper

db = SessionLocal()
paper = db.query(QuestionPaper).filter(QuestionPaper.id == 1078).first()
if paper:
    print(f"Paper 1078 pdf_url: {paper.pdf_url}")
else:
    print("Paper 1078 not found")
db.close()
