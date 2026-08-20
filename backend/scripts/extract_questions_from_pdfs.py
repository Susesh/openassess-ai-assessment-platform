"""
Script to extract questions from imported PDF question papers.
Uses PyMuPDF to extract text and regex patterns to identify MCQs.
"""

import os
import sys
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import fitz  # PyMuPDF
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.question_paper import QuestionPaper, QuestionPaperQuestion
from backend.models.question import Question
from backend.models.topic import Topic


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract all text from a PDF file."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting text from {pdf_path}: {e}")
        return ""


def identify_mcqs(text: str) -> List[Dict]:
    """
    Identify MCQs from extracted text using regex patterns.
    Returns list of question dictionaries with text, options, and answer.
    """
    questions = []
    
    # Pattern 1: Questions numbered like "1.", "2." etc. with options A), B), C), D)
    pattern1 = r'(\d+)\.\s*(.*?)(?=\d+\.\s*|$)(?:(?:A\)|B\)|C\)|D\)|a\)|b\)|c\)|d\)).*?)*'
    
    # Pattern 2: Questions with (a), (b), (c), (d) options
    pattern2 = r'(\d+)\.\s*(.*?)(?=\d+\.\s*|$)(?:(?:\(a\)|\(b\)|\(c\)|\(d\)).*?)*'
    
    # Pattern 3: Simple question followed by options
    pattern3 = r'Q\.?\s*(\d+)\.?\s*(.*?)(?=Option|Answer|\d+\.)'
    
    # Try pattern 1 first
    matches = re.finditer(pattern1, text, re.DOTALL | re.MULTILINE)
    
    for match in matches:
        question_num = match.group(1)
        question_text = match.group(2).strip()
        
        # Extract options
        options = extract_options(match.group(0))
        
        if options and len(options) >= 2:
            questions.append({
                'number': question_num,
                'text': question_text,
                'options': options,
                'type': 'mcq'
            })
    
    # If pattern 1 didn't work well, try pattern 2
    if len(questions) < 5:
        questions = []
        matches = re.finditer(pattern2, text, re.DOTALL | re.MULTILINE)
        
        for match in matches:
            question_num = match.group(1)
            question_text = match.group(2).strip()
            
            options = extract_options(match.group(0))
            
            if options and len(options) >= 2:
                questions.append({
                    'number': question_num,
                    'text': question_text,
                    'options': options,
                    'type': 'mcq'
                })
    
    return questions


def extract_options(text: str) -> List[str]:
    """Extract options from question text."""
    options = []
    
    # Pattern for A), B), C), D) or a), b), c), d)
    option_pattern = r'([Aa]\)|[Bb]\)|[Cc]\)|[Dd]\))\s*([^AaBbCcDd)]*?)(?=[AaBbCcDd]\)|$|Answer|Solution)'
    
    matches = re.finditer(option_pattern, text, re.DOTALL)
    for match in matches:
        option_text = match.group(2).strip()
        if option_text:
            options.append(option_text[:200])  # Limit length
    
    # If no options found with pattern, try alternative
    if not options:
        alt_pattern = r'\(([a-d])\)\s*([^)]*?)(?=\([a-d]\)|$|Answer)'
        matches = re.finditer(alt_pattern, text, re.DOTALL)
        for match in matches:
            option_text = match.group(2).strip()
            if option_text:
                options.append(option_text[:200])
    
    return options[:4]  # Max 4 options


def find_or_create_topic(db: Session, subject: str) -> Optional[Topic]:
    """Find existing topic or create a new one for the subject."""
    topic = db.query(Topic).filter(Topic.name.ilike(f"%{subject}%")).first()
    
    if not topic:
        # Create a new topic
        topic = Topic(
            name=subject,
            description=f"Questions for {subject}",
            subject=subject
        )
        db.add(topic)
        db.commit()
        db.refresh(topic)
    
    return topic


def create_question(db: Session, question_data: Dict, topic_id: int) -> Question:
    """Create a Question record from extracted data."""
    question = Question(
        topic_id=topic_id,
        text=question_data['text'][:1000],  # Limit text length
        options=question_data['options'][:4],  # Max 4 options
        correct_option='A',  # Default, will need manual review
        difficulty='medium',
        question_type='mcq',
        source='PDF Import'
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def extract_questions_for_paper(db: Session, paper: QuestionPaper):
    """Extract questions from a single question paper."""
    pdf_path = Path(paper.meta_data.get('local_path', '')) if paper.meta_data else None
    
    if not pdf_path or not pdf_path.exists():
        print(f"PDF not found for paper {paper.id}: {paper.exam_name}")
        return 0
    
    print(f"Extracting questions from: {paper.exam_name} ({paper.subject})")
    
    # Extract text from PDF
    text = extract_text_from_pdf(pdf_path)
    
    if not text:
        print(f"No text extracted from PDF")
        return 0
    
    # Identify MCQs
    questions = identify_mcqs(text)
    
    if not questions:
        print(f"No MCQs identified in the text")
        return 0
    
    print(f"Found {len(questions)} potential MCQs")
    
    # Find or create topic
    topic = find_or_create_topic(db, paper.subject)
    if not topic:
        print(f"Could not find/create topic for {paper.subject}")
        return 0
    
    # Create questions and link to paper
    created_count = 0
    for q_data in questions:
        try:
            # Create question
            question = create_question(db, q_data, topic.id)
            
            # Link to paper
            paper_question = QuestionPaperQuestion(
                paper_id=paper.id,
                question_id=question.id,
                question_number=int(q_data['number']) if q_data['number'].isdigit() else created_count + 1,
                topic_id=topic.id,
                question_type='mcq',
                difficulty='medium',
                marks=1,
                question_text_snapshot=q_data['text'],
                options_snapshot=q_data['options']
            )
            db.add(paper_question)
            db.commit()
            
            created_count += 1
            print(f"  Created question {created_count}: {q_data['text'][:50]}...")
            
        except Exception as e:
            print(f"  Error creating question: {e}")
            db.rollback()
    
    # Update paper totals
    paper.total_questions = created_count
    paper.total_marks = created_count  # Assuming 1 mark per question
    db.commit()
    
    print(f"Total questions created: {created_count}")
    return created_count


def extract_all_questions(db: Session):
    """Extract questions from all imported question papers."""
    papers = db.query(QuestionPaper).filter(
        QuestionPaper.is_published == True
    ).all()
    
    print(f"Found {len(papers)} published question papers")
    
    total_questions = 0
    for paper in papers:
        # Skip if already has questions
        existing_count = db.query(QuestionPaperQuestion).filter(
            QuestionPaperQuestion.paper_id == paper.id
        ).count()
        
        if existing_count > 0:
            print(f"Skipping {paper.exam_name} - already has {existing_count} questions")
            continue
        
        count = extract_questions_for_paper(db, paper)
        total_questions += count
        print()
    
    print(f"\nTotal questions extracted across all papers: {total_questions}")


if __name__ == "__main__":
    db = next(get_db())
    try:
        extract_all_questions(db)
    finally:
        db.close()
