"""Ensure each topic has a minimum number of questions.

Run:
    backend\venv\Scripts\python.exe backend\scripts\ensure_min_questions_per_topic.py
"""
import sys
import os
from sqlalchemy import func

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import SessionLocal
from backend.models.question import Question
from backend.models.topic import Topic, Subtopic
from backend.seed import QUESTION_PATTERNS, _difficulty

MIN_PER_TOPIC = 50

# Helper to create a new question payload with slight variation index
def _question_payload_for(topic_name: str, concept: str, definition: str, index: int) -> dict:
    pattern = QUESTION_PATTERNS[index % len(QUESTION_PATTERNS)]
    prompt, options, correct, explanation = pattern
    values = {
        "topic": topic_name,
        "concept": concept,
        "concept_title": concept[:1].upper() + concept[1:],
        "definition": definition,
    }
    rendered_options = [option.format(**values) for option in options]
    correct_text = rendered_options[0]
    shift = index % len(rendered_options)
    rotated_options = rendered_options[shift:] + rendered_options[:shift]
    correct_index = rotated_options.index(correct_text)

    return {
        "text": prompt.format(**values) + f" (variation {index})",
        "options": rotated_options,
        "correct_option": "ABCD"[correct_index],
        "explanation": explanation.format(**values) + f" (variation {index})",
        "difficulty": _difficulty(index),
    }


def ensure_min_questions():
    db = SessionLocal()
    try:
        topics = db.query(Topic).all()
        for topic in topics:
            qcount = db.query(func.count(Question.id)).filter(Question.topic_id == topic.id).scalar() or 0
            print(f"Topic '{topic.name}' has {qcount} questions")
            if qcount >= MIN_PER_TOPIC:
                continue

            # Determine subtopics for assignment
            subtopics = db.query(Subtopic).filter(Subtopic.topic_id == topic.id).all()
            if not subtopics:
                # create a placeholder subtopic
                sub = Subtopic(topic_id=topic.id, name="General", description="General practice")
                db.add(sub)
                db.commit()
                db.refresh(sub)
                subtopics = [sub]

            existing_texts = {t[0].lower() for t in db.query(Question.text).filter(Question.topic_id == topic.id).all()}

            # Use topic concepts from TOPIC_CATALOG if available by matching name
            from backend.seed import TOPIC_CATALOG
            topic_data = next((t for t in TOPIC_CATALOG if t["name"].lower() == topic.name.lower()), None)
            concepts = topic_data["concepts"] if topic_data else [("Practice", "Practice question")]

            i = 0
            added = 0
            # Start index offset to avoid colliding with seeded indices
            offset = qcount * 7
            while qcount + added < MIN_PER_TOPIC and i < 1000:
                concept, definition = concepts[i % len(concepts)]
                payload = _question_payload_for(topic.name, concept, definition, offset + i)
                if payload["text"].lower() in existing_texts:
                    i += 1
                    continue
                # assign to a subtopic in round-robin
                subtopic = subtopics[(qcount + added) % len(subtopics)]
                q = Question(
                    topic_id=topic.id,
                    subtopic_id=subtopic.id,
                    text=payload["text"],
                    options=payload["options"],
                    correct_option=payload["correct_option"],
                    explanation=payload["explanation"],
                    difficulty=payload["difficulty"],
                )
                db.add(q)
                existing_texts.add(payload["text"].lower())
                added += 1
                i += 1

            db.commit()
            print(f"Added {added} questions to topic '{topic.name}'")
    finally:
        db.close()


if __name__ == '__main__':
    ensure_min_questions()
