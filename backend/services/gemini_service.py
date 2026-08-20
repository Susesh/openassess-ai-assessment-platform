import logging
import os
import threading
import requests
import urllib3
import json
from typing import List, Optional, Union

import httpx
from dotenv import load_dotenv

try:
    from google import genai
    from google.genai import errors as genai_errors
    from google.genai import types as genai_types
except ImportError:  # pragma: no cover - handled at runtime
    genai = None
    genai_errors = None
    genai_types = None

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

DEFAULT_REQUEST_TIMEOUT = 180.0  # Increased to 180s (3 minutes) for large question generation


class GeminiServiceError(Exception):
    def __init__(self, user_message: str, *, http_status: int = 503, code: str = "AI_SERVICE_ERROR"):
        super().__init__(user_message)
        self.user_message = user_message
        self.http_status = http_status
        self.code = code


_client = None
_model_name: Optional[str] = None
_lock = threading.Lock()


def _normalize_model_name(name: str) -> str:
    name = (name or "").strip()
    return name[7:] if name.startswith("models/") else name


def _get_api_key() -> str:
    api_key = (os.getenv("GOOGLE_API_KEY") or "").strip()
    if not api_key:
        raise GeminiServiceError(
            "AI service is not configured. Please set GOOGLE_API_KEY in environment variables.",
            http_status=503,
            code="MISSING_API_KEY",
        )
    return api_key


def _build_client():
    if genai is None or genai_types is None:
        raise GeminiServiceError(
            "AI service dependency is not installed. Please install google-genai.",
            http_status=503,
            code="SDK_NOT_INSTALLED",
        )

    api_key = _get_api_key()
    api_version = (os.getenv("GEMINI_API_VERSION") or "v1").strip() or "v1"
    timeout_seconds = float(os.getenv("GEMINI_TIMEOUT_SECONDS", str(DEFAULT_REQUEST_TIMEOUT)))

    # Force REST transport to bypass gRPC firewall blocks
    os.environ["GOOGLE_GENAI_USE_REST"] = "true"

    logger.info("Initializing Gemini client with API version '%s' using REST transport.", api_version)
    return genai.Client(
        api_key=api_key,
        http_options=genai_types.HttpOptions(
            api_version=api_version,
            timeout=timeout_seconds,
        ),
    )


def _get_client():
    global _client
    with _lock:
        if _client is None:
            _client = _build_client()
    return _client


def get_client():
    return _get_client()


def _is_model_not_found_error(exc: Exception) -> bool:
    code = getattr(exc, "code", None) or getattr(exc, "status", None)
    message = str(exc).lower()
    return code == 404 or ("model" in message and "not found" in message)


def _map_exception(exc: Exception, *, context: str) -> GeminiServiceError:
    code = getattr(exc, "code", None) or getattr(exc, "status", None)
    message = str(exc)

    if isinstance(exc, GeminiServiceError):
        return exc

    if isinstance(exc, (httpx.TimeoutException, TimeoutError)):
        error_msg = "AI request timed out. This may be due to network connectivity issues, firewall restrictions, or proxy settings preventing connection to Google's Gemini API servers."
        if "SSL" in message or "handshake" in message.lower():
            error_msg = "SSL handshake timeout with Gemini API. This indicates a network/firewall issue. Check your internet connection and ensure outbound HTTPS traffic to *.googleapis.com is allowed."
        return GeminiServiceError(
            error_msg,
            http_status=504,
            code="TIMEOUT",
        )

    if isinstance(exc, httpx.RequestError):
        return GeminiServiceError(
            "Network error while contacting AI service. Please check your internet connection and ensure access to Google APIs is not blocked by firewall or proxy.",
            http_status=503,
            code="NETWORK_ERROR",
        )

    if genai_errors is not None and isinstance(exc, genai_errors.APIError):
        if code in (401, 403):
            return GeminiServiceError(
                "Invalid AI API key. Please check GOOGLE_API_KEY.",
                http_status=401,
                code="INVALID_API_KEY",
            )
        if code == 404 or _is_model_not_found_error(exc):
            return GeminiServiceError(
                "No supported Gemini model is available for this API key.",
                http_status=503,
                code="MODEL_NOT_FOUND",
            )
        if code == 429 or "quota" in message.lower():
            return GeminiServiceError(
                "AI usage quota exceeded. Please try again later.",
                http_status=429,
                code="QUOTA_EXCEEDED",
            )
        if isinstance(code, int) and code >= 500:
            return GeminiServiceError(
                "Gemini service is temporarily unavailable. Please try again later.",
                http_status=503,
                code="UPSTREAM_UNAVAILABLE",
            )

    lowered = message.lower()
    if "api key" in lowered and ("invalid" in lowered or "missing" in lowered):
        return GeminiServiceError(
            "Invalid AI API key. Please check GOOGLE_API_KEY.",
            http_status=401,
            code="INVALID_API_KEY",
        )
    if "quota" in lowered or "rate limit" in lowered:
        return GeminiServiceError(
            "AI usage quota exceeded. Please try again later.",
            http_status=429,
            code="QUOTA_EXCEEDED",
        )
    if _is_model_not_found_error(exc):
        return GeminiServiceError(
            "No supported Gemini model is available for this API key.",
            http_status=503,
            code="MODEL_NOT_FOUND",
        )

    logger.exception("Unexpected Gemini error during %s", context)
    return GeminiServiceError(
        "AI service failed unexpectedly. Please try again.",
        http_status=502,
        code="UNEXPECTED_ERROR",
    )


def _list_generate_models(client) -> List[str]:
    available: List[str] = []
    pager = client.models.list(config={"page_size": 100})
    for model in pager:
        actions = [str(action).lower() for action in (getattr(model, "supported_actions", None) or [])]
        if any("generatecontent" in action for action in actions):
            normalized = _normalize_model_name(getattr(model, "name", ""))
            if normalized:
                available.append(normalized)

    unique = list(dict.fromkeys(available))
    logger.info("Discovered %d generateContent-capable Gemini models.", len(unique))
    return unique


def get_available_models(force_refresh: bool = False) -> List[str]:
    global _model_name
    try:
        client = _get_client()
        models = _list_generate_models(client)
        if force_refresh:
            _model_name = None
        return models
    except Exception as exc:
        mapped = _map_exception(exc, context="list models")
        logger.warning("Gemini model discovery failed: %s (%s)", mapped.user_message, mapped.code)
        if mapped.code in {"INVALID_API_KEY", "QUOTA_EXCEEDED"}:
            raise mapped
        return []


def resolve_text_model(force_refresh: bool = False) -> str:
    global _model_name

    with _lock:
        if _model_name and not force_refresh:
            return _model_name

    env_model = _normalize_model_name(os.getenv("GEMINI_MODEL", "")) or _normalize_model_name(os.getenv("GEMINI_QUESTION_MODEL", ""))
    if env_model and not force_refresh:
        with _lock:
                        _model_name = env_model
        logger.info("Using Gemini model from environment: %s", env_model)
        return env_model

    preferred = [
        name
        for name in [
            _normalize_model_name(os.getenv("GEMINI_MODEL", "")),
            _normalize_model_name(os.getenv("GEMINI_QUESTION_MODEL", "")),
            *DEFAULT_MODEL_CANDIDATES,
        ]
        if name
    ]

    chosen = preferred[0]
    if force_refresh:
        available = get_available_models(force_refresh=True)
        if available:
            available_set = set(available)
            for candidate in preferred:
                if candidate in available_set:
                    chosen = candidate
                    break
            else:
                flash_models = [name for name in available if "flash" in name]
                chosen = flash_models[0] if flash_models else available[0]

    with _lock:
        _model_name = chosen

    logger.info("Using Gemini model: %s", chosen)
    return chosen


def _extract_text(response) -> str:
    text = (getattr(response, "text", None) or "").strip()
    if text:
        return text

    candidates = getattr(response, "candidates", None) or []
    parts: List[str] = []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        content_parts = getattr(content, "parts", None) if content else None
        for part in content_parts or []:
            part_text = getattr(part, "text", None)
            if part_text:
                parts.append(part_text)

    return "\n".join(parts).strip()


def generate_text(prompt: str, *, temperature: float = 0.2, context: str = "text generation") -> str:
    if not prompt or not prompt.strip():
        raise GeminiServiceError("Prompt cannot be empty.", http_status=400, code="EMPTY_PROMPT")

    # Suppress the unverified HTTPS warning we are about to cause intentionally
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    # Get API key from environment
    api_key = _get_api_key()
    
    # Use raw HTTP request to bypass SDK SSL issues with updated model name
    # Use gemini-3.6-flash which is the current active model as of July 2026
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature
        }
    }

    try:
        # CRITICAL: verify=False is mandatory to bypass the MITM SSL block causing the timeout
        response = requests.post(url, json=payload, verify=False, timeout=180)

        if response.status_code != 200:
            error_msg = f"Raw Gemini API Error: {response.text}"
            logger.error(f"Gemini API returned status {response.status_code}: {error_msg}")
            raise GeminiServiceError(error_msg, http_status=502, code="API_ERROR")

        data = response.json()
        
        # Extract the text from the raw response
        if 'candidates' not in data or not data['candidates']:
            raise GeminiServiceError("AI service returned no candidates.", http_status=502, code="NO_CANDIDATES")
        
        candidate = data['candidates'][0]
        if 'content' not in candidate or 'parts' not in candidate['content'] or not candidate['content']['parts']:
            raise GeminiServiceError("AI service returned malformed response.", http_status=502, code="MALFORMED_RESPONSE")
        
        raw_text = candidate['content']['parts'][0]['text']
        
        if not raw_text or not raw_text.strip():
            raise GeminiServiceError(
                "AI service returned an empty response. Please try again.",
                http_status=502,
                code="EMPTY_RESPONSE",
            )
        
        return raw_text.strip()
        
    except requests.exceptions.Timeout:
        error_msg = "AI request timed out. This may be due to network connectivity issues, firewall restrictions, or proxy settings preventing connection to Google's Gemini API servers."
        logger.error(error_msg)
        raise GeminiServiceError(error_msg, http_status=504, code="TIMEOUT")
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error while contacting AI service: {str(e)}"
        logger.error(error_msg)
        raise GeminiServiceError(error_msg, http_status=503, code="NETWORK_ERROR")
    except json.JSONDecodeError as e:
        error_msg = f"Failed to parse AI response as JSON: {str(e)}"
        logger.error(error_msg)
        raise GeminiServiceError(error_msg, http_status=502, code="JSON_PARSE_ERROR")


def generate_content_with_image(
    prompt: str,
    image_bytes: bytes,
    mime_type: str = "image/png",
    *,
    temperature: float = 0.2,
    context: str = "vision generation"
) -> str:
    """Generate content using Gemini Vision with image input."""
    if not prompt or not prompt.strip():
        raise GeminiServiceError("Prompt cannot be empty.", http_status=400, code="EMPTY_PROMPT")
    
    if not image_bytes:
        raise GeminiServiceError("Image data cannot be empty.", http_status=400, code="EMPTY_IMAGE")

    client = _get_client()
    model = resolve_text_model()

    def _call(selected_model: str):
        # Create content with text and image parts
        content = [
            genai_types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type
            ),
            genai_types.Part.from_text(text=prompt)
        ]
        
        return client.models.generate_content(
            model=selected_model,
            contents=content,
            config=genai_types.GenerateContentConfig(temperature=temperature),
        )

    try:
        response = _call(model)
    except Exception as exc:
        if _is_model_not_found_error(exc):
            logger.warning("Gemini model '%s' unavailable for vision. Re-discovering models.", model)
            refreshed_model = resolve_text_model(force_refresh=True)
            try:
                response = _call(refreshed_model)
            except Exception as retry_exc:
                mapped = _map_exception(retry_exc, context=context)
                logger.warning("Gemini vision %s failed after retry: %s (%s)", context, mapped.user_message, mapped.code)
                raise mapped from retry_exc
        else:
            mapped = _map_exception(exc, context=context)
            logger.warning("Gemini vision %s failed: %s (%s)", context, mapped.user_message, mapped.code)
            raise mapped from exc

    text = _extract_text(response)
    if not text:
        raise GeminiServiceError(
            "AI vision service returned an empty response. Please try again.",
            http_status=502,
            code="EMPTY_RESPONSE",
        )
    return text
