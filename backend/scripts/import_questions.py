"""
Import real exam questions from JSON or CSV files.
This script allows bulk import of questions from external sources.

Usage:
    python -m backend.scripts.import_questions --file questions.json --format json
    python -m backend.scripts.import_questions --file questions.csv --format csv
"""

import argparse
import json
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal
from backend.models.question import Question
from backend.models.topic import Topic, Subtopic


def import_from_json(db, file_path: Path) -> int:
    """Import questions from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not isinstance(data, list):
        data = [data]
    
    imported = 0
    for item in data:
        try:
            # Find or create topic
            topic_name = item.get('topic')
            if not topic_name:
                print(f"  Skipping question - missing topic")
                continue
            
            topic = db.query(Topic).filter(Topic.name == topic_name).first()
            if not topic:
                print(f"  Warning: Topic '{topic_name}' not found, skipping question")
                continue
            
            # Find subtopic if specified
            subtopic_id = None
            subtopic_name = item.get('subtopic')
            if subtopic_name:
                subtopic = db.query(Subtopic).filter(
                    Subtopic.topic_id == topic.id,
                    Subtopic.name == subtopic_name
                ).first()
                if subtopic:
                    subtopic_id = subtopic.id
            
            # Create question
            question = Question(
                topic_id=topic.id,
                subtopic_id=subtopic_id,
                text=item['question'],
                options=item['options'],
                correct_option=item['answer'],
                explanation=item.get('explanation'),
                difficulty=item.get('difficulty', 'medium'),
                question_type=item.get('question_type', 'mcq'),
                subject=item.get('subject') or topic.subject,
                board=item.get('board'),
                class_name=item.get('class_name'),
                year=item.get('year'),
                source=item.get('source', 'imported'),
                tags=item.get('tags'),
            )
            db.add(question)
            imported += 1
            print(f"  Imported question {imported}: {item['question'][:50]}...")
            
        except Exception as e:
            print(f"  Error importing question: {e}")
            db.rollback()
    
    db.commit()
    return imported


def import_from_csv(db, file_path: Path) -> int:
    """Import questions from CSV file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
    imported = 0
    for row in reader:
        try:
            # Find or create topic
            topic_name = row.get('topic')
            if not topic_name:
                print(f"  Skipping question - missing topic")
                continue
            
            topic = db.query(Topic).filter(Topic.name == topic_name).first()
            if not topic:
                print(f"  Warning: Topic '{topic_name}' not found, skipping question")
                continue
            
            # Parse options from CSV (comma-separated or JSON array)
            options_str = row.get('options', '[]')
            try:
                options = json.loads(options_str)
            except:
                options = [opt.strip() for opt in options_str.split(',') if opt.strip()]
            
            # Find subtopic if specified
            subtopic_id = None
            subtopic_name = row.get('subtopic')
            if subtopic_name:
                subtopic = db.query(Subtopic).filter(
                    Subtopic.topic_id == topic.id,
                    Subtopic.name == subtopic_name
                ).first()
                if subtopic:
                    subtopic_id = subtopic.id
            
            # Create question
            question = Question(
                topic_id=topic.id,
                subtopic_id=subtopic_id,
                text=row['question'],
                options=options,
                correct_option=row['answer'],
                explanation=row.get('explanation'),
                difficulty=row.get('difficulty', 'medium'),
                question_type=row.get('question_type', 'mcq'),
                subject=row.get('subject') or topic.subject,
                board=row.get('board'),
                class_name=row.get('class_name'),
                year=int(row.get('year')) if row.get('year') else None,
                source=row.get('source', 'imported'),
                tags=row.get('tags'),
            )
            db.add(question)
            imported += 1
            print(f"  Imported question {imported}: {row['question'][:50]}...")
            
        except Exception as e:
            print(f"  Error importing question: {e}")
            db.rollback()
    
    db.commit()
    return imported


def main():
    parser = argparse.ArgumentParser(description="Import real exam questions from JSON or CSV")
    parser.add_argument("--file", required=True, help="Path to import file")
    parser.add_argument("--format", required=True, choices=["json", "csv"], help="File format")
    
    args = parser.parse_args()
    
    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        return
    
    db = SessionLocal()
    try:
        print(f"Importing questions from {file_path} ({args.format} format)...")
        
        if args.format == "json":
            imported = import_from_json(db, file_path)
        else:
            imported = import_from_csv(db, file_path)
        
        print(f"\nSuccessfully imported {imported} questions")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
