import json
import logging
import asyncio
import traceback
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
from backend.database import get_db
from backend.models.question import Question
from backend.models.topic import Topic
from backend.models.user import User
from backend.utils.auth_utils import get_current_user, verify_token
from fastapi import Request
from backend.services.gemini_service import GeminiServiceError, generate_text, resolve_text_model

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    topic: str
    subject: Optional[str] = None
    subtopic: Optional[str] = None
    difficulty: Optional[str] = "medium"
    count: Optional[int] = 5
    save_to_db: Optional[bool] = False
    topic_id: Optional[int] = None
    subtopic_id: Optional[int] = None
    language: Optional[str] = "en"
    exam_module: Optional[str] = "Standard"

class ExplainRequest(BaseModel):
    question: str
    correct_answer: str
    user_answer: str


# ── AI functions ──────────────────────────────────────────────────────────────

def build_fallback_questions(topic: str, subject: Optional[str] = None, subtopic: Optional[str] = None, difficulty: str = "medium", count: int = 5, exam_module: Optional[str] = None, language: str = "en") -> list[dict]:
    base_topic = (topic or "General Topic").strip() or "General Topic"
    base_subject = (subject or "General").strip() or "General"
    base_subtopic = (subtopic or "Overview").strip() or "Overview"
    exam_label = (exam_module or "Standard").strip() or "Standard"
    difficulty_label = (difficulty or "medium").strip().lower() or "medium"

    templates = [
        {
            "question": f"What is the main concept behind {base_topic} in {base_subject}?",
            "options": ["A core idea or principle", "A random guess", "A missing value", "An unrelated theme"],
            "answer": "A",
            "explanation": f"This question checks the understanding of the central idea of {base_topic} and how it connects to {base_subject}.",
        },
        {
            "question": f"Which statement best describes {base_subtopic} in relation to {base_topic}?",
            "options": ["It is a key part of the topic", "It is unrelated", "It replaces the topic", "It has no relevance"],
            "answer": "A",
            "explanation": f"The correct option highlights how {base_subtopic} fits into the broader topic of {base_topic}.",
        },
        {
            "question": f"Why is {base_topic} important for learners studying {base_subject}?",
            "options": ["It builds foundational understanding", "It makes the topic harder", "It removes practice opportunities", "It has no educational value"],
            "answer": "A",
            "explanation": f"Learning {base_topic} helps learners develop the basic knowledge needed for deeper study in {base_subject}.",
        },
    ]

    if difficulty_label in {"hard", "advanced", "difficult"}:
        templates.append({
            "question": f"How would you apply your understanding of {base_topic} to solve a new problem in {base_subject}?",
            "options": ["By using the core principle in a new context", "By ignoring the concept", "By avoiding the topic", "By choosing a random answer"],
            "answer": "A",
            "explanation": f"Higher-difficulty questions ask learners to transfer their knowledge of {base_topic} to a new situation.",
        })

    results = []
    for index in range(count):
        template = templates[index % len(templates)]
        question = dict(template)
        question["question"] = f"[{exam_label}] {question['question']}"
        question["explanation"] = f"{question['explanation']} (Fallback question generated locally because the AI service was unavailable.)"
        results.append(question)

    return results[:count]


def generate_questions_from_ai(topic: str, difficulty: str, count: int, exam_module: Optional[str] = None, language: str = "en", subject: Optional[str] = None, subtopic: Optional[str] = None) -> list:
    # STRICT VALIDATION: Ensure required parameters are present
    if not topic or not topic.strip():
        raise ValueError("Subject and Topic cannot be empty. The frontend payload failed to reach the AI.")
    if not subject or not subject.strip():
        subject = "General"
    
    # Type casting and safety defaults
    difficulty = difficulty or "medium"
    exam_module = exam_module or "Standard"
    subtopic = subtopic or ""
    
    # Determine language instruction
    subject_lower = subject.lower()
    topic_lower = topic.lower()
    
    if language == "hi" or "hindi" in subject_lower or "hindi" in topic_lower:
        lang_instruction = "Write the entire JSON response in Hindi using Devanagari script (देवनागरी)."
    elif language == "kn" or "kannada" in subject_lower or "kannada" in topic_lower:
        lang_instruction = "Write the entire JSON response in Kannada script (ಕನ್ನಡ ಲಿಪಿ)."
    else:
        lang_instruction = "Write the entire JSON response in English language."
    
    # STRICT PROMPT with exact variable enforcement
    prompt = f"""You are an expert examiner. Generate {count} multiple-choice questions in strict JSON format.
CRITICAL CONSTRAINTS:
- Subject: {subject}
- Topic: {topic}
- Subtopic: {subtopic}
- Difficulty: {difficulty}
- Exam Module: {exam_module}

RULES:
1. EVERY question MUST be strictly about {topic} and {subtopic}. Do NOT mix subjects.
2. Adjust the complexity strictly to match {difficulty} and {exam_module} standards.
3. Output format must be a JSON array of objects with keys: 'question', 'options' (array of 4 strings), 'correct_answer', 'explanation'.

{lang_instruction}

Return ONLY a valid JSON array, no extra text, no markdown:
[
  {{
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "A",
    "explanation": "Explanation here"
  }}
]"""

    model_name = resolve_text_model()
    logger.info(
        "Generating AI questions for topic='%s', difficulty='%s', count=%s using model='%s'",
        topic,
        difficulty,
        count,
        model_name,
    )

    print("FINAL LLM PROMPT:\n", prompt)

    text = generate_text(
        prompt,
        temperature=0.2,
        context="question generation",
    ).strip()

    # Robust JSON parsing with Markdown stripping
    raw_text = text
    print(f"--> [RAW TEXT FROM AI] First 200 chars: {raw_text[:200]}")
    
    # Strip markdown code blocks if the AI included them
    cleaned_text = raw_text.strip()
    
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    elif cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]

    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]

    cleaned_text = cleaned_text.strip()
    
    print(f"--> [CLEANED TEXT] First 200 chars: {cleaned_text[:200]}")

    # Parse JSON with error handling
    try:
        parsed = json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        logger.error(f"FAILED TO PARSE JSON. RAW TEXT: {raw_text}")
        logger.error(f"Cleaned text: {cleaned_text[:500]}")
        raise ValueError(f"LLM did not return valid JSON: {e}")

    if isinstance(parsed, dict) and "questions" in parsed:
        parsed = parsed["questions"]
    if not isinstance(parsed, list):
        raise ValueError("AI response is not a JSON array of questions")

    normalized = []
    for item in parsed:
        if not isinstance(item, dict):
            logger.warning(f"Skipping non-dict item in response: {item}")
            continue

        question_text = str(item.get("question", "")).strip()
        options = item.get("options") or []
        answer = str(item.get("correct_answer", item.get("answer", ""))).strip().upper()
        explanation = str(item.get("explanation", "")).strip()

        if not question_text or not isinstance(options, list) or len(options) < 4:
            logger.warning(f"Skipping invalid question: question={question_text[:50]}, options={options}")
            continue

        options = [str(opt).strip() for opt in options[:4]]
        if answer not in {"A", "B", "C", "D"}:
            first_letter = answer[:1]
            if first_letter in {"A", "B", "C", "D"}:
                answer = first_letter
            else:
                by_text = {opt.lower(): chr(65 + idx) for idx, opt in enumerate(options)}
                answer = by_text.get(answer.lower(), "")

        if answer not in {"A", "B", "C", "D"}:
            logger.warning(f"Skipping question with invalid answer: {answer}, options={options}")
            continue

        normalized.append(
            {
                "question": question_text,
                "options": options,
                "answer": answer,
                "explanation": explanation,
            }
        )

    if not normalized:
        raise ValueError("AI returned no valid questions")

    logger.info(f"Successfully normalized {len(normalized)} questions from AI response")
    return normalized


def explain_answer_with_ai(question: str, correct_answer: str, user_answer: str) -> str:
    prompt = f"""A student answered a quiz question incorrectly.

Question: {question}
Student's answer: {user_answer} (wrong)
Correct answer: {correct_answer}

In 2-3 simple sentences, explain why the correct answer is right and why the student's answer was incorrect.
Be encouraging and clear."""

    logger.info("Generating AI explanation for question snippet='%s'", question[:80])
    return generate_text(
        prompt,
        temperature=0.3,
        context="answer explanation",
    ).strip()


def _question_to_payload(question: Question) -> dict:
    return {
        "question": question.text,
        "options": list(question.options or []),
        "answer": (question.correct_option or "").strip().upper(),
        "explanation": question.explanation or "",
    }


def _fallback_questions(db: Session, topic: str, difficulty: str, count: int, topic_id: Optional[int] = None, subject: Optional[str] = None, exam_module: Optional[str] = None) -> list[dict]:
    pool: list[dict] = []

    if topic_id:
        query = db.query(Question).filter(Question.topic_id == topic_id)
        if difficulty:
            query = query.filter(Question.difficulty == difficulty)
        if exam_module:
            query = query.filter(Question.exam_module == exam_module)
        db_questions = query.order_by(func.random()).all()
        pool = [_question_to_payload(question) for question in db_questions if question.options]

    # If no questions found with strict filters, try broader database search with difficulty
    if not pool:
        query = db.query(Question)
        if difficulty:
            query = query.filter(Question.difficulty == difficulty)
        db_questions = query.order_by(func.random()).limit(count * 2).all()
        pool = [_question_to_payload(question) for question in db_questions if question.options]

    # If still no questions, try without difficulty filter (use any available questions)
    if not pool:
        logger.warning(f"No questions found for difficulty '{difficulty}', using any available questions")
        query = db.query(Question)
        db_questions = query.order_by(func.random()).limit(count * 2).all()
        pool = [_question_to_payload(question) for question in db_questions if question.options]

    if not pool:
        raise ValueError("No questions available in database for fallback")

    results: list[dict] = []
    while len(results) < count:
        results.append(dict(pool[len(results) % len(pool)]))

    logger.info(
        "Using fallback questions for topic='%s', difficulty='%s', exam_module='%s', count=%s",
        topic,
        difficulty,
        exam_module or "Standard",
        count,
    )
    return results[:count]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/generate-questions")
async def generate_questions(
    data: GenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        print("--> [START] Received generation request")
        auth_header = request.headers.get("authorization")
        if auth_header:
            print("--> [AUTH] Authorization header present")
            try:
                token = auth_header.split(" ", 1)[1].strip() if auth_header.lower().startswith("bearer ") else auth_header
                payload = verify_token(token)
                email = payload.get("sub")
                if email:
                    user = db.query(User).filter(User.email == email).first()
                    if user:
                        print(f"--> [AUTH] Authenticated as {user.email}")
            except Exception as exc:
                logger.warning("Optional auth check failed: %s", exc)
        else:
            print("--> [AUTH] No authorization header; proceeding in development mode")
        print(f"--> Payload: Subject={data.subject}, Topic={data.topic}, Subtopic={data.subtopic}, Diff={data.difficulty}, Exam={data.exam_module}, Count={data.count}")
        
        if data.count is None or data.count <= 0:
            raise HTTPException(status_code=400, detail="count must be greater than 0")

        # AI generation only - NO FALLBACK
        try:
            print("--> [API] Calling Gemini API...")
            # Run synchronous Gemini call in thread pool to avoid blocking async route
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                questions = await loop.run_in_executor(
                    executor,
                    generate_questions_from_ai,
                    data.topic,
                    data.difficulty,
                    data.count,
                    data.exam_module,
                    data.language,
                    data.subject,
                    data.subtopic
                )
            print("--> [API] Gemini responded successfully")
        except GeminiServiceError as e:
            print(f"--> [ERROR] GeminiServiceError: {e.code} - {e.user_message}")
            logger.warning("Gemini AI generation failed; using fallback questions: %s", e.user_message)
            questions = build_fallback_questions(
                topic=data.topic,
                subject=data.subject,
                subtopic=data.subtopic,
                difficulty=data.difficulty,
                count=data.count or 5,
                exam_module=data.exam_module,
                language=data.language,
            )
        except json.JSONDecodeError as e:
            print(f"--> [ERROR] JSONDecodeError: {str(e)}")
            logger.warning("AI returned invalid JSON; using fallback questions: %s", e)
            questions = build_fallback_questions(
                topic=data.topic,
                subject=data.subject,
                subtopic=data.subtopic,
                difficulty=data.difficulty,
                count=data.count or 5,
                exam_module=data.exam_module,
                language=data.language,
            )
        except ValueError as e:
            print(f"--> [ERROR] ValueError: {str(e)}")
            logger.warning("AI returned unusable payload; using fallback questions: %s", e)
            questions = build_fallback_questions(
                topic=data.topic,
                subject=data.subject,
                subtopic=data.subtopic,
                difficulty=data.difficulty,
                count=data.count or 5,
                exam_module=data.exam_module,
                language=data.language,
            )
        except Exception as e:
            print(f"--> [ERROR] Exception: {str(e)}")
            logger.warning("Unexpected AI generation error; using fallback questions: %s", e)
            questions = build_fallback_questions(
                topic=data.topic,
                subject=data.subject,
                subtopic=data.subtopic,
                difficulty=data.difficulty,
                count=data.count or 5,
                exam_module=data.exam_module,
                language=data.language,
            )

        # Optionally save to database
        if data.save_to_db and data.topic_id:
            inserted = 0
            for q in questions:
                question = Question(
                    topic_id=data.topic_id,
                    subtopic_id=data.subtopic_id,
                    text=q["question"],
                    options=q["options"],
                    correct_option=q["answer"],
                    explanation=q.get("explanation"),
                    difficulty=data.difficulty,
                    exam_module=data.exam_module,
                    source="ai_generated",
                    language=data.language,
                )
                db.add(question)
                inserted += 1
            db.commit()
            logger.info("Saved %s generated AI questions to topic_id=%s, subtopic_id=%s", inserted, data.topic_id, data.subtopic_id)

        return {"questions": questions, "count": len(questions)}
    
    except Exception as e:
        print(f"--> [ERROR] Unhandled exception in generate_questions route")
        print(f"--> [ERROR] Exception type: {type(e).__name__}")
        print(f"--> [ERROR] Exception message: {str(e)}")
        print(f"--> [ERROR] Full traceback:")
        traceback.print_exc()
        logger.error(f"Unhandled exception in generate_questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/explain")
def explain_answer(
    data: ExplainRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        explanation = explain_answer_with_ai(
            data.question,
            data.correct_answer,
            data.user_answer
        )
        return {"explanation": explanation}
    except GeminiServiceError as e:
        raise HTTPException(status_code=e.http_status, detail=e.user_message) from e
    except Exception as e:
        logger.exception("AI explanation failed")
        raise HTTPException(status_code=500, detail="AI explanation failed") from e
