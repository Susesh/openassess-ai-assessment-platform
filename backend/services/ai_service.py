import asyncio
import logging
from typing import Optional

from backend.services.gemini_service import GeminiServiceError, generate_text

logger = logging.getLogger(__name__)


def _static_fallback(explanation: Optional[str], correct_option: str) -> str:
    if explanation:
        return explanation
    return (
        f"The correct answer is {correct_option}. "
        "Review this topic and try the question again."
    )


def _generate_explanation_sync(
    question_text: str,
    selected: str,
    correct: str,
) -> str:
    prompt = (
        f"The student answered '{selected}' for this question: "
        f"'{question_text}'. The correct answer is '{correct}'. "
        "Explain why in 2-3 simple sentences for a beginner."
    )
    return generate_text(
        prompt,
        temperature=0.3,
        context="quiz explanation",
    ).strip()


async def get_ai_explanation(
    question_text: str,
    selected: str,
    correct: str,
    explanation: Optional[str] = None,
) -> str:
    """
    Generate a beginner-friendly explanation via Gemini.
    Falls back to the static DB explanation on API errors.
    """
    try:
        return await asyncio.to_thread(
            _generate_explanation_sync,
            question_text,
            selected,
            correct,
        )
    except GeminiServiceError as exc:
        logger.warning("Gemini explanation unavailable (%s): %s", exc.code, exc.user_message)
        return _static_fallback(explanation, correct)
    except Exception as exc:
        logger.warning("Gemini explanation failed: %s", exc)
        return _static_fallback(explanation, correct)
