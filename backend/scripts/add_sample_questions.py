"""
Script to add sample questions to question papers manually.
Creates realistic MCQ questions for different subjects and links them to papers.
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

# Force SQLite for local development
os.environ["DATABASE_URL"] = "sqlite:///./openassess.db"

from sqlalchemy.orm import Session
from backend.database import engine, get_db
from backend.models.question_paper import QuestionPaper, QuestionPaperQuestion
from backend.models.question import Question
from backend.models.topic import Topic


SAMPLE_QUESTIONS = {
    "Physics": [
        {
            "text": "What is the SI unit of electric current?",
            "options": ["Volt", "Ampere", "Ohm", "Watt"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "Which law states that the current through a conductor is directly proportional to the voltage across it?",
            "options": ["Faraday's Law", "Ohm's Law", "Coulomb's Law", "Newton's Law"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "What is the speed of light in vacuum?",
            "options": ["3 x 10^6 m/s", "3 x 10^8 m/s", "3 x 10^10 m/s", "3 x 10^12 m/s"],
            "correct": "B",
            "difficulty": "medium"
        },
        {
            "text": "Which particle has a positive charge?",
            "options": ["Electron", "Neutron", "Proton", "Photon"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "What is the unit of frequency?",
            "options": ["Hertz", "Joule", "Newton", "Pascal"],
            "correct": "A",
            "difficulty": "easy"
        }
    ],
    "Chemistry": [
        {
            "text": "What is the atomic number of Carbon?",
            "options": ["4", "6", "8", "12"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "Which gas is most abundant in Earth's atmosphere?",
            "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "What is the chemical formula for water?",
            "options": ["HO", "H2O", "H2O2", "H3O"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "Which element is known as the 'King of Chemicals'?",
            "options": ["Oxygen", "Sulfuric Acid", "Nitrogen", "Carbon"],
            "correct": "B",
            "difficulty": "medium"
        },
        {
            "text": "What is the pH value of pure water?",
            "options": ["0", "7", "14", "1"],
            "correct": "B",
            "difficulty": "easy"
        }
    ],
    "Mathematics": [
        {
            "text": "What is the value of π (pi) approximately?",
            "options": ["3.14", "3.1416", "22/7", "All of the above"],
            "correct": "D",
            "difficulty": "easy"
        },
        {
            "text": "What is the derivative of x^2?",
            "options": ["x", "2x", "x^2", "2"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "What is the sum of angles in a triangle?",
            "options": ["90 degrees", "180 degrees", "270 degrees", "360 degrees"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "What is the value of log10(100)?",
            "options": ["1", "2", "10", "100"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "What is the area of a circle with radius r?",
            "options": ["2πr", "πr^2", "2πr^2", "πr"],
            "correct": "B",
            "difficulty": "easy"
        }
    ],
    "Biology": [
        {
            "text": "What is the basic unit of life?",
            "options": ["Atom", "Molecule", "Cell", "Tissue"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "Which organ pumps blood throughout the body?",
            "options": ["Lungs", "Liver", "Heart", "Kidney"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "What is the powerhouse of the cell?",
            "options": ["Nucleus", "Mitochondria", "Ribosome", "Golgi Body"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "How many chromosomes do humans have?",
            "options": ["23", "46", "44", "48"],
            "correct": "B",
            "difficulty": "medium"
        },
        {
            "text": "What process do plants use to make food?",
            "options": ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
            "correct": "B",
            "difficulty": "easy"
        }
    ],
    "General Science": [
        {
            "text": "Which planet is known as the Red Planet?",
            "options": ["Venus", "Mars", "Jupiter", "Saturn"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "What is the largest organ in the human body?",
            "options": ["Heart", "Liver", "Skin", "Brain"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "Which gas do plants absorb from the atmosphere?",
            "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "What is the hardest natural substance on Earth?",
            "options": ["Gold", "Iron", "Diamond", "Platinum"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "How many bones are in the adult human body?",
            "options": ["186", "206", "226", "246"],
            "correct": "B",
            "difficulty": "medium"
        }
    ],
    "English": [
        {
            "text": "Which is the correct spelling?",
            "options": ["Accomodate", "Accommodate", "Acommodate", "Acomodate"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "What is the past tense of 'write'?",
            "options": ["Writed", "Wrote", "Written", "Writing"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "Which word is a noun?",
            "options": ["Run", "Beautiful", "Happiness", "Quickly"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "What is the plural of 'child'?",
            "options": ["Childs", "Children", "Childes", "Childern"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "Which sentence is in passive voice?",
            "options": ["She wrote the letter", "The letter was written by her", "She is writing", "She writes letters"],
            "correct": "B",
            "difficulty": "medium"
        }
    ],
    "Kannada": [
        {
            "text": "Which is the official language of Karnataka?",
            "options": ["Tamil", "Telugu", "Kannada", "Malayalam"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "What is the capital of Karnataka?",
            "options": ["Mysore", "Bangalore", "Hubli", "Mangalore"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "How many letters are in Kannada alphabet?",
            "options": ["49", "51", "53", "55"],
            "correct": "B",
            "difficulty": "medium"
        },
        {
            "text": "Which river flows through Karnataka?",
            "options": ["Ganga", "Yamuna", "Kaveri", "Godavari"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "What is the famous dance form of Karnataka?",
            "options": ["Bharatanatyam", "Kathak", "Yakshagana", "Kuchipudi"],
            "correct": "C",
            "difficulty": "medium"
        }
    ],
    "Economics": [
        {
            "text": "Who is known as the Father of Economics?",
            "options": ["Karl Marx", "Adam Smith", "John Maynard Keynes", "Milton Friedman"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "What is GDP?",
            "options": ["Gross Domestic Product", "General Domestic Price", "Gross Development Product", "General Development Price"],
            "correct": "A",
            "difficulty": "easy"
        },
        {
            "text": "What measures inflation?",
            "options": ["GDP", "CPI", "FDI", "ROI"],
            "correct": "B",
            "difficulty": "medium"
        },
        {
            "text": "What is the currency of India?",
            "options": ["Dollar", "Euro", "Rupee", "Yen"],
            "correct": "C",
            "difficulty": "easy"
        },
        {
            "text": "What is a recession?",
            "options": ["High economic growth", "Economic decline", "Stable economy", "High inflation"],
            "correct": "B",
            "difficulty": "medium"
        }
    ],
    "Political Science": [
        {
            "text": "What is democracy?",
            "options": ["Rule by one person", "Rule by the people", "Rule by military", "Rule by kings"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "Who is the head of the Indian state?",
            "options": ["Prime Minister", "President", "Chief Minister", "Governor"],
            "correct": "D",
            "difficulty": "medium"
        },
        {
            "text": "What is the term length of Lok Sabha?",
            "options": ["4 years", "5 years", "6 years", "No fixed term"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "Which article deals with Right to Equality?",
            "options": ["Article 14", "Article 19", "Article 21", "Article 32"],
            "correct": "A",
            "difficulty": "medium"
        },
        {
            "text": "What is the minimum age to become Prime Minister of India?",
            "options": ["25 years", "30 years", "35 years", "40 years"],
            "correct": "A",
            "difficulty": "medium"
        }
    ],
    "Indian Economics": [
        {
            "text": "When did India adopt its Five Year Plans?",
            "options": ["1947", "1950", "1951", "1955"],
            "correct": "C",
            "difficulty": "medium"
        },
        {
            "text": "What is the main objective of Green Revolution?",
            "options": ["Industrial growth", "Agricultural productivity", "Service sector growth", "Export promotion"],
            "correct": "B",
            "difficulty": "easy"
        },
        {
            "text": "Which year marked the beginning of economic liberalization in India?",
            "options": ["1980", "1991", "2000", "2008"],
            "correct": "B",
            "difficulty": "medium"
        },
        {
            "text": "What is NABARD?",
            "options": ["National Bank for Agriculture and Rural Development", "National Agricultural Board", "National Agriculture Research Department", "None of the above"],
            "correct": "A",
            "difficulty": "medium"
        },
        {
            "text": "What is the current poverty line in India (approx)?",
            "options": ["Rs 1000/month", "Rs 2000/month", "Rs 3000/month", "Rs 5000/month"],
            "correct": "B",
            "difficulty": "hard"
        }
    ]
}


def find_or_create_topic(db: Session, subject: str) -> Topic:
    """Find existing topic or create a new one."""
    topic = db.query(Topic).filter(Topic.name.ilike(f"%{subject}%")).first()
    
    if not topic:
        topic = Topic(
            name=subject,
            description=f"Questions for {subject}",
            subject=subject
        )
        db.add(topic)
        db.commit()
        db.refresh(topic)
    
    return topic


def add_sample_questions_to_paper(db: Session, paper: QuestionPaper):
    """Add sample questions to a question paper based on its subject."""
    subject = paper.subject
    
    # Map subject to sample questions
    sample_key = None
    for key in SAMPLE_QUESTIONS.keys():
        if key.lower() in subject.lower() or subject.lower() in key.lower():
            sample_key = key
            break
    
    if not sample_key:
        print(f"No sample questions available for subject: {subject}")
        return 0
    
    questions = SAMPLE_QUESTIONS[sample_key]
    
    # Find or create topic
    topic = find_or_create_topic(db, subject)
    
    # Check if paper already has questions
    existing_count = db.query(QuestionPaperQuestion).filter(
        QuestionPaperQuestion.paper_id == paper.id
    ).count()
    
    if existing_count > 0:
        print(f"Skipping {paper.exam_name} - already has {existing_count} questions")
        return 0
    
    print(f"Adding {len(questions)} sample questions to: {paper.exam_name} ({subject})")
    
    created_count = 0
    for idx, q_data in enumerate(questions):
        try:
            # Create question
            question = Question(
                topic_id=topic.id,
                text=q_data['text'],
                options=q_data['options'],
                correct_option=q_data['correct'],
                difficulty=q_data['difficulty'],
                question_type='mcq',
                source='Sample'
            )
            db.add(question)
            db.commit()
            db.refresh(question)
            
            # Link to paper
            paper_question = QuestionPaperQuestion(
                paper_id=paper.id,
                question_id=question.id,
                question_number=idx + 1,
                topic_id=topic.id,
                question_type='mcq',
                difficulty=q_data['difficulty'],
                marks=1,
                question_text_snapshot=q_data['text'],
                options_snapshot=q_data['options'],
                correct_option_snapshot=q_data['correct']
            )
            db.add(paper_question)
            db.commit()
            
            created_count += 1
            print(f"  Added question {created_count}: {q_data['text'][:50]}...")
            
        except Exception as e:
            print(f"  Error creating question: {e}")
            db.rollback()
    
    # Update paper totals
    paper.total_questions = created_count
    paper.total_marks = created_count
    db.commit()
    
    print(f"Total questions added: {created_count}")
    return created_count


def add_sample_questions_to_all_papers(db: Session):
    """Add sample questions to all question papers."""
    papers = db.query(QuestionPaper).filter(
        QuestionPaper.is_published == True
    ).all()
    
    print(f"Found {len(papers)} published question papers")
    
    total_questions = 0
    for paper in papers:
        count = add_sample_questions_to_paper(db, paper)
        total_questions += count
        print()
    
    print(f"\nTotal sample questions added across all papers: {total_questions}")


if __name__ == "__main__":
    db = next(get_db())
    try:
        add_sample_questions_to_all_papers(db)
    finally:
        db.close()
