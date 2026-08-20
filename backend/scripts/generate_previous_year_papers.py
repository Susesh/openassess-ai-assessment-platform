"""Generate previous-year question papers (last 10 years) for each topic and exam module.

This script will create QuestionPaper entries for each topic and exam module for the
last 10 years. It first tries to pull question content from public online sources
when possible, then falls back to local generated questions if no suitable online
material is found.

Run:
    D:/project/OpenAssess-main/.venv/Scripts/python.exe backend/scripts/generate_previous_year_papers.py
"""
import os
import re
import sys
from datetime import datetime
from html import unescape
from typing import Optional

import httpx
from sqlalchemy import func

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.ai import question_generator as qg
from backend.scrapers import fetch_for_topic
from backend.database import SessionLocal
from backend.models.question import Question
from backend.models.question_paper import QuestionPaper
from backend.models.topic import Topic
from backend.schemas.question_paper import QuestionPaperCreate
from backend.services.question_paper_service import question_paper_service

EXAM_MODULES = [
    "CBSE",
    "ICSE",
    "State Board",
    "IIT-JEE",
    "NEET",
    "UPSC",
    "University Exams",
]

MIN_QUESTIONS = 60
ONLINE_TIMEOUT_SECONDS = 12
ONLINE_RESULT_LIMIT = 8
ONLINE_QUESTION_LIMIT = 12


def _clean_text(value: Optional[str]) -> str:
    if not value:
        return ""
    text = unescape(value)
    text = re.sub(r"<[^>]+>", "\n", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _parse_online_questions(raw_html: str) -> list[dict]:
    text = _clean_text(raw_html)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    questions: list[dict] = []
    current: Optional[dict] = None

    for line in lines:
        if re.match(r"^(?:Q(?:uestion)?\s*)?\d{1,2}[\.)]", line, re.IGNORECASE):
            if current and len(current.get("options", [])) >= 4:
                questions.append(current)
            current = {"question": re.sub(r"^(?:Q(?:uestion)?\s*)?\d{1,2}[\.)]\s*", "", line, flags=re.IGNORECASE), "options": []}
            continue

        if not current:
            continue

        option_match = re.match(r"^(?:A|B|C|D|Option\s*[A-D])[\.):]\s*(.+)$", line, re.IGNORECASE)
        if option_match:
            current["options"].append(option_match.group(1).strip())
            continue

        if not current.get("question"):
            current["question"] = line
        elif len(current.get("options", [])) < 1:
            current["question"] = f"{current['question']} {line}".strip()
        elif len(current.get("options", [])) < 4:
            current["options"][-1] = f"{current['options'][-1]} {line}".strip()

    if current and len(current.get("options", [])) >= 4:
        questions.append(current)

    normalized: list[dict] = []
    for item in questions:
        q_text = (item.get("question") or "").strip()
        options = [opt.strip() for opt in item.get("options", []) if opt and opt.strip()]
        if not q_text or len(options) < 4:
            continue
        options = options[:4]
        answer = "A"
        if re.search(r"\banswer\b[:\-]\s*(a|b|c|d)", q_text, re.IGNORECASE):
            answer = re.search(r"\banswer\b[:\-]\s*(a|b|c|d)", q_text, re.IGNORECASE).group(1).upper()
        normalized.append({
            "question": q_text,
            "options": options,
            "answer": answer,
            "explanation": "",
        })

    return normalized


def _fetch_online_questions(topic_name: str, exam_module: Optional[str] = None) -> list[dict]:
    # First try targeted scrapers for known authoritative sources
    try:
        scraped = fetch_for_topic(topic_name, exam_module)
        if scraped:
            return scraped
    except Exception:
        pass

    query_terms = [topic_name]
    if exam_module:
        query_terms.append(exam_module)
    query_terms.extend(["previous year", "question paper", "mcq"])
    query = " ".join(query_terms)
    search_url = "https://duckduckgo.com/html/"
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        response = httpx.get(search_url, params={"q": query}, headers=headers, timeout=ONLINE_TIMEOUT_SECONDS)
        response.raise_for_status()
    except Exception as exc:
        print(f"Online source search failed for '{topic_name}': {exc}")
        return []

    matches = re.findall(r'<a rel="nofollow" class="result__a" href="([^"]+)"', response.text)
    for raw_url in matches[:ONLINE_RESULT_LIMIT]:
        url = raw_url.replace("&amp;", "&")
        try:
            page = httpx.get(url, headers=headers, timeout=ONLINE_TIMEOUT_SECONDS)
            page.raise_for_status()
        except Exception:
            continue

        parsed = _parse_online_questions(page.text)
        if parsed:
            return parsed[:ONLINE_QUESTION_LIMIT]

    return []


def ensure_questions_for_topic(db, topic_id, topic_name, exam_module: Optional[str] = None):
    existing = db.query(Question).filter(Question.topic_id == topic_id).order_by(Question.id).all()
    ids = [q.id for q in existing]
    if len(ids) >= MIN_QUESTIONS:
        return ids[:MIN_QUESTIONS]

    needed = MIN_QUESTIONS - len(ids)
    print(f"Topic id={topic_id} needs {needed} questions — trying online sources first")
    inserted_ids = []

    online_questions = _fetch_online_questions(topic_name, exam_module)
    for item in online_questions[:needed]:
        q = Question(
            topic_id=topic_id,
            text=item.get("question") or "",
            options=item.get("options") or [],
            correct_option=item.get("answer") or None,
            explanation=item.get("explanation") or None,
            difficulty="medium",
            subject=None,
            source="online_source",
        )
        db.add(q)
        db.flush()
        inserted_ids.append(q.id)

    if len(ids) + len(inserted_ids) < MIN_QUESTIONS:
        print(f"Topic id={topic_id} still needs {MIN_QUESTIONS - len(ids) - len(inserted_ids)} questions — generating fallback")
        fallback = qg._fallback_questions(db, topic_name, "medium", needed, topic_id)
        for item in fallback:
            q = Question(
                topic_id=topic_id,
                text=item.get("question") or "",
                options=item.get("options") or [],
                correct_option=item.get("answer") or None,
                explanation=item.get("explanation") or None,
                difficulty="medium",
                subject=None,
                source="generated_fallback",
            )
            db.add(q)
            db.flush()
            inserted_ids.append(q.id)

    db.commit()
    return ids + inserted_ids


def main():
    db = SessionLocal()
    try:
        topics = db.query(Topic).all()
        start_year = datetime.utcnow().year - 9
        years = list(range(start_year, datetime.utcnow().year + 1))

        created = 0
        for topic in topics:
            print(f"Processing topic: {topic.id} {topic.name}")
            for exam in EXAM_MODULES:
                for year in years:
                    exists = db.query(QuestionPaper).filter(
                        QuestionPaper.exam_category == exam,
                        QuestionPaper.topic_name == topic.name,
                        QuestionPaper.year == year,
                    ).first()
                    if exists:
                        continue

                    # ensure questions
                    ids = ensure_questions_for_topic(db, topic.id, topic.name, exam_module=exam)
                    ids = ids[:MIN_QUESTIONS]

                    questions_payload = []
                    for idx, qid in enumerate(ids, start=1):
                        questions_payload.append({
                            "question_number": idx,
                            "question_id": qid,
                            "topic_id": topic.id,
                            "question_type": "mcq",
                            "difficulty": "medium",
                            "marks": 1,
                        })

                    paper_data = QuestionPaperCreate(
                        exam_category=exam,
                        board=exam,
                        exam_name=f"{exam} Previous Year Practice {year}",
                        year=year,
                        subject=topic.subject or "General",
                        topic_name=topic.name,
                        language="en",
                        total_marks=0,
                        is_published=True,
                        questions=questions_payload,
                    )

                    try:
                        paper = question_paper_service.create(db, paper_data, created_by_id=None)
                        created += 1
                        print(f"Created paper id={paper.id} for {exam} {year} topic={topic.name}")
                    except Exception as e:
                        print(f"Failed to create paper for {exam} {year} topic={topic.name}: {e}")
        print(f"Generation complete. Created {created} papers.")
    finally:
        db.close()


if __name__ == '__main__':
    main()
