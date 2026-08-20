"""Ensure selected courses (topics) have at least MIN questions and create QuestionPaper entries.

Run:
    backend\venv\Scripts\python.exe backend\scripts\ensure_min_questions_and_create_papers.py [Topic Name 1] [Topic Name 2]

If no topic names are provided, the script operates on all topics.
"""
import sys
import os
from datetime import datetime
from sqlalchemy import func

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database import SessionLocal
from backend.models.question import Question
from backend.models.topic import Topic, Subtopic
from backend.models.question_paper import QuestionPaper, QuestionPaperQuestion
from backend.models.user import User
from backend.seed import QUESTION_PATTERNS, _difficulty

MIN_PER_TOPIC = 50


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


def ensure_min_questions_for_topic(db, topic: Topic) -> None:
    qcount = db.query(func.count(Question.id)).filter(Question.topic_id == topic.id).scalar() or 0
    if qcount >= MIN_PER_TOPIC:
        print(f"Topic '{topic.name}' already has {qcount} questions")
        return

    subtopics = db.query(Subtopic).filter(Subtopic.topic_id == topic.id).all()
    if not subtopics:
        sub = Subtopic(topic_id=topic.id, name="General", description="General practice")
        db.add(sub)
        db.commit()
        db.refresh(sub)
        subtopics = [sub]

    existing_texts = {t[0].lower() for t in db.query(Question.text).filter(Question.topic_id == topic.id).all()}

    from backend.seed import TOPIC_CATALOG
    topic_data = next((t for t in TOPIC_CATALOG if t["name"].lower() == topic.name.lower()), None)
    concepts = topic_data["concepts"] if topic_data else [("Practice", "Practice question")]

    i = 0
    added = 0
    offset = qcount * 7
    while qcount + added < MIN_PER_TOPIC and i < 2000:
        concept, definition = concepts[i % len(concepts)]
        payload = _question_payload_for(topic.name, concept, definition, offset + i)
        if payload["text"].lower() in existing_texts:
            i += 1
            continue
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


def create_question_paper_for_topic(db, topic: Topic, created_by_user_id: int | None = None) -> None:
    # Check if a paper for this topic already exists
    existing = (
        db.query(QuestionPaper)
        .filter(func.lower(QuestionPaper.subject) == topic.name.lower())
        .first()
    )
    year = datetime.utcnow().year
    title = f"{topic.name} Practice {year}"
    if existing:
        print(f"Question paper already exists for topic '{topic.name}': id={existing.id}")
        return

    questions = db.query(Question).filter(Question.topic_id == topic.id).order_by(Question.id).limit(MIN_PER_TOPIC).all()
    if not questions:
        print(f"No questions found for topic '{topic.name}', skipping paper creation")
        return

    paper = QuestionPaper(
        exam_category="Course Practice",
        board="Custom",
        exam_name=title,
        year=year,
        subject=topic.name,
        topic_name=topic.name,
        total_questions=len(questions),
        total_marks=sum(1 for _ in questions),
        is_published=True,
        created_by=created_by_user_id,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    for idx, q in enumerate(questions, start=1):
        item = QuestionPaperQuestion(
            paper_id=paper.id,
            question_id=q.id,
            question_number=idx,
            topic_id=q.topic_id,
            subtopic_id=q.subtopic_id,
            question_type="mcq",
            difficulty=q.difficulty or "medium",
            marks=1,
            question_text_snapshot=q.text,
            options_snapshot=q.options,
            correct_option_snapshot=getattr(q, "correct_option", None) or getattr(q, "correct_options", None) or None,
            explanation_snapshot=q.explanation,
        )
        db.add(item)
    db.commit()
    print(f"Created question paper '{title}' (id={paper.id}) with {len(questions)} questions")


def main(topic_names: list[str] | None = None):
    db = SessionLocal()
    try:
        # find a reasonable created_by user (demo user) if present
        demo = db.query(User).filter(User.email == "demo@openassess.com").first()
        created_by = demo.id if demo else None

        topics_query = db.query(Topic)
        if topic_names:
            lowered = [t.lower() for t in topic_names]
            topics_query = topics_query.filter(func.lower(Topic.name).in_(lowered))

        topics = topics_query.all()
        if not topics:
            print("No topics matched the provided names.")
            return

        for topic in topics:
            ensure_min_questions_for_topic(db, topic)
            create_question_paper_for_topic(db, topic, created_by_user_id=created_by)

    finally:
        db.close()


if __name__ == '__main__':
    args = sys.argv[1:]
    if args:
        main(args)
    else:
        main(None)
