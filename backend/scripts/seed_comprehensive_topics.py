"""
Comprehensive seeding script for OpenAssess exam boards, subjects, topics, and subtopics.

Run:
    python backend/scripts/seed_comprehensive_topics.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import func
from backend.database import SessionLocal
from backend.models.exam_category import ExamCategory
from backend.models.topic import Topic, Subtopic


# Exam Boards / Categories
EXAM_CATEGORIES = [
    {
        "id": "cbse_10th",
        "display_name": "CBSE 10th",
        "slug": "cbse-10th",
        "description": "Central Board of Secondary Education Class 10 examinations"
    },
    {
        "id": "cbse_12th",
        "display_name": "CBSE 12th",
        "slug": "cbse-12th",
        "description": "Central Board of Secondary Education Class 12 examinations"
    },
    {
        "id": "state_board",
        "display_name": "State Board",
        "slug": "state-board",
        "description": "State Board examinations across various states"
    },
    {
        "id": "jee_mains",
        "display_name": "JEE Mains",
        "slug": "jee-mains",
        "description": "Joint Entrance Examination Main for engineering admissions"
    },
    {
        "id": "neet",
        "display_name": "NEET",
        "slug": "neet",
        "description": "National Eligibility cum Entrance Test for medical admissions"
    },
    {
        "id": "upsc_prelims",
        "display_name": "UPSC Prelims",
        "slug": "upsc-prelims",
        "description": "Union Public Service Commission Preliminary Examination"
    }
]


# Comprehensive Subject Structure with Topics and Subtopics
SUBJECT_STRUCTURE = [
    {
        "subject": "Physics",
        "topics": [
            {
                "name": "Mechanics",
                "description": "Study of motion, forces, and energy",
                "subtopics": ["Kinematics", "Newton's Laws", "Work and Energy", "Rotational Motion"]
            },
            {
                "name": "Optics",
                "description": "Study of light and its behavior",
                "subtopics": ["Refraction", "Reflection", "Wave Optics", "Ray Optics"]
            },
            {
                "name": "Thermodynamics",
                "description": "Study of heat and energy transfer",
                "subtopics": ["Laws of Thermodynamics", "Heat Transfer", "Thermal Properties", "Kinetic Theory"]
            },
            {
                "name": "Electromagnetism",
                "description": "Study of electric and magnetic phenomena",
                "subtopics": ["Electrostatics", "Current Electricity", "Magnetism", "Electromagnetic Induction"]
            }
        ]
    },
    {
        "subject": "Chemistry",
        "topics": [
            {
                "name": "Organic Chemistry",
                "description": "Study of carbon compounds and their reactions",
                "subtopics": ["Hydrocarbons", "Functional Groups", "Reaction Mechanisms", "Biomolecules"]
            },
            {
                "name": "Inorganic Chemistry",
                "description": "Study of non-carbon elements and compounds",
                "subtopics": ["Periodic Properties", "Chemical Bonding", "Coordination Compounds", "Metallurgy"]
            },
            {
                "name": "Physical Chemistry",
                "description": "Study of physical principles in chemistry",
                "subtopics": ["Thermodynamics", "Chemical Kinetics", "Equilibrium", "Electrochemistry"]
            }
        ]
    },
    {
        "subject": "Biology",
        "topics": [
            {
                "name": "Cell Biology",
                "description": "Study of cell structure and function",
                "subtopics": ["Cell Structure", "Cell Division", "Cell Transport", "Cellular Respiration"]
            },
            {
                "name": "Genetics",
                "description": "Study of heredity and genetic variation",
                "subtopics": ["Mendelian Genetics", "Molecular Genetics", "Gene Expression", "Genetic Disorders"]
            },
            {
                "name": "Ecology",
                "description": "Study of organisms and their environment",
                "subtopics": ["Ecosystems", "Population Dynamics", "Biodiversity", "Environmental Issues"]
            },
            {
                "name": "Human Biology",
                "description": "Study of human body systems",
                "subtopics": ["Digestive System", "Circulatory System", "Nervous System", "Reproductive System"]
            }
        ]
    },
    {
        "subject": "Mathematics",
        "topics": [
            {
                "name": "Algebra",
                "description": "Study of mathematical symbols and operations",
                "subtopics": ["Linear Equations", "Quadratic Equations", "Polynomials", "Matrices"]
            },
            {
                "name": "Calculus",
                "description": "Study of continuous change and motion",
                "subtopics": ["Limits and Continuity", "Differentiation", "Integration", "Applications"]
            },
            {
                "name": "Geometry",
                "description": "Study of shapes, sizes, and spatial relationships",
                "subtopics": ["Coordinate Geometry", "Trigonometry", "3D Geometry", "Conic Sections"]
            },
            {
                "name": "Statistics",
                "description": "Study of data collection and analysis",
                "subtopics": ["Probability", "Data Analysis", "Statistical Measures", "Distributions"]
            }
        ]
    },
    {
        "subject": "English",
        "topics": [
            {
                "name": "Grammar",
                "description": "Study of English language structure and rules",
                "subtopics": ["Parts of Speech", "Sentence Structure", "Tenses", "Punctuation"]
            },
            {
                "name": "Literature",
                "description": "Study of literary works and analysis",
                "subtopics": ["Prose", "Poetry", "Drama", "Literary Analysis"]
            },
            {
                "name": "Comprehension",
                "description": "Reading and understanding English texts",
                "subtopics": ["Reading Skills", "Vocabulary", "Critical Analysis", "Inference"]
            }
        ]
    },
    {
        "subject": "Hindi",
        "topics": [
            {
                "name": "Vyakarna (Grammar)",
                "description": "Study of Hindi language structure and rules",
                "subtopics": ["Sandhi", "Samas", "Vibhakti", "Karak"]
            },
            {
                "name": "Sahitya (Literature)",
                "description": "Study of Hindi literary works",
                "subtopics": ["Kavya", "Gadya", "Natak", "Aalochna"]
            },
            {
                "name": "Patra Lekhan (Writing)",
                "description": "Formal and creative writing in Hindi",
                "subtopics": ["Nibandh", "Patra", "Vigyapan", "Report Writing"]
            }
        ]
    },
    {
        "subject": "Kannada",
        "topics": [
            {
                "name": "Vyakarana (Grammar)",
                "description": "Study of Kannada language structure and rules",
                "subtopics": ["Sandhi", "Samasa", "Vibhakti", "Tatsama-Tadbhava"]
            },
            {
                "name": "Sahitya (Literature)",
                "description": "Study of Kannada literary works",
                "subtopics": ["Kavya", "Gadya", "Nataka", "Vachana"]
            },
            {
                "name": "Patra Lekhana (Writing)",
                "description": "Formal and creative writing in Kannada",
                "subtopics": ["Nibandha", "Patra", "Vigyapana", "Report Writing"]
            }
        ]
    },
    {
        "subject": "History",
        "topics": [
            {
                "name": "Indian History",
                "description": "Study of Indian historical events and civilizations",
                "subtopics": ["Ancient India", "Medieval India", "Modern India", "Freedom Movement"]
            },
            {
                "name": "World History",
                "description": "Study of global historical events and civilizations",
                "subtopics": ["Ancient Civilizations", "Medieval World", "Modern World", "World Wars"]
            },
            {
                "name": "Modern History",
                "description": "Study of contemporary historical developments",
                "subtopics": ["Industrial Revolution", "Colonialism", "Independence Movements", "Cold War"]
            }
        ]
    },
    {
        "subject": "Geography",
        "topics": [
            {
                "name": "Physical Geography",
                "description": "Study of natural features and processes",
                "subtopics": ["Landforms", "Climate", "Water Bodies", "Natural Resources"]
            },
            {
                "name": "Human Geography",
                "description": "Study of human activities and their spatial distribution",
                "subtopics": ["Population", "Settlements", "Migration", "Economic Activities"]
            },
            {
                "name": "Indian Geography",
                "description": "Study of India's geographical features",
                "subtopics": ["Physiography", "Climate", "Rivers", "Agriculture"]
            },
            {
                "name": "Environmental Studies",
                "description": "Study of environmental issues and conservation",
                "subtopics": ["Ecosystems", "Pollution", "Climate Change", "Conservation"]
            }
        ]
    },
    {
        "subject": "Political Science",
        "topics": [
            {
                "name": "Indian Politics",
                "description": "Study of Indian political system and governance",
                "subtopics": ["Constitution", "Parliament", "Federalism", "Political Parties"]
            },
            {
                "name": "International Relations",
                "description": "Study of global political interactions",
                "subtopics": ["Foreign Policy", "International Organizations", "Diplomacy", "Global Issues"]
            },
            {
                "name": "Political Theory",
                "description": "Study of political concepts and ideologies",
                "subtopics": ["Democracy", "Rights", "Justice", "Power"]
            },
            {
                "name": "Civics",
                "description": "Study of citizenship and civic responsibilities",
                "subtopics": ["Citizenship", "Rights and Duties", "Local Government", "Public Services"]
            }
        ]
    }
]


def seed_exam_categories(db):
    """Seed exam categories if they don't exist."""
    created_count = 0
    for category_data in EXAM_CATEGORIES:
        existing = db.query(ExamCategory).filter(ExamCategory.id == category_data["id"]).first()
        if not existing:
            try:
                category = ExamCategory(**category_data)
                db.add(category)
                db.commit()
                created_count += 1
                print(f"Created exam category: {category_data['display_name']}")
            except Exception as e:
                db.rollback()
                print(f"Error creating exam category {category_data['display_name']}: {e}")
                # Try checking by display_name instead
                existing_by_name = db.query(ExamCategory).filter(
                    ExamCategory.display_name == category_data["display_name"]
                ).first()
                if existing_by_name:
                    print(f"Exam category already exists with display name: {category_data['display_name']}")
        else:
            print(f"Exam category already exists: {category_data['display_name']}")
    
    return created_count


def seed_subjects_topics_subtopics(db):
    """Seed subjects, topics, and subtopics if they don't exist."""
    created_topics = 0
    created_subtopics = 0
    
    for subject_data in SUBJECT_STRUCTURE:
        subject_name = subject_data["subject"]
        print(f"\nProcessing subject: {subject_name}")
        
        for topic_data in subject_data["topics"]:
            topic_name = topic_data["name"]
            
            # Check if topic already exists for this subject
            existing_topic = db.query(Topic).filter(
                func.lower(Topic.name) == topic_name.lower(),
                func.lower(Topic.subject) == subject_name.lower()
            ).first()
            
            if not existing_topic:
                topic = Topic(
                    name=topic_name,
                    description=topic_data["description"],
                    subject=subject_name,
                    duration=60,  # Default duration
                    total_questions=10,  # Default question count
                    passing_score=40.0  # Default passing score
                )
                db.add(topic)
                db.commit()
                db.refresh(topic)
                created_topics += 1
                print(f"  Created topic: {topic_name}")
            else:
                topic = existing_topic
                print(f"  Topic already exists: {topic_name}")
            
            # Create subtopics
            for subtopic_name in topic_data["subtopics"]:
                existing_subtopic = db.query(Subtopic).filter(
                    Subtopic.topic_id == topic.id,
                    func.lower(Subtopic.name) == subtopic_name.lower()
                ).first()
                
                if not existing_subtopic:
                    subtopic = Subtopic(
                        topic_id=topic.id,
                        name=subtopic_name,
                        description=f"{subtopic_name} concepts and practice"
                    )
                    db.add(subtopic)
                    created_subtopics += 1
                    print(f"    Created subtopic: {subtopic_name}")
                else:
                    print(f"    Subtopic already exists: {subtopic_name}")
            
            db.commit()
    
    return created_topics, created_subtopics


def main():
    """Main seeding function."""
    print("Starting comprehensive seeding...")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        # Seed exam categories
        print("\nSeeding exam categories...")
        created_categories = seed_exam_categories(db)
        print(f"Created {created_categories} exam categories")
        
        # Seed subjects, topics, and subtopics
        print("\nSeeding subjects, topics, and subtopics...")
        created_topics, created_subtopics = seed_subjects_topics_subtopics(db)
        print(f"\nCreated {created_topics} topics")
        print(f"Created {created_subtopics} subtopics")
        
        print("\n" + "=" * 50)
        print("Comprehensive seeding completed successfully!")
        
    except Exception as e:
        print(f"\nError during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
