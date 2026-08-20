import re
from typing import Optional
import httpx
from html import unescape

try:
    from PyPDF2 import PdfReader
except Exception:
    PdfReader = None


def fetch_url_text(url: str, timeout: int = 12) -> Optional[str]:
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = httpx.get(url, headers=headers, timeout=timeout)
        r.raise_for_status()
        content_type = r.headers.get("content-type", "")
        if "application/pdf" in content_type or url.lower().endswith(".pdf"):
            if PdfReader is None:
                return None
            try:
                reader = PdfReader(r.content)
                pages = []
                for p in reader.pages:
                    txt = p.extract_text() or ""
                    pages.append(txt)
                return "\n".join(pages)
            except Exception:
                return None
        else:
            return r.text
    except Exception:
        return None


def _clean_text(value: Optional[str]) -> str:
    if not value:
        return ""
    text = unescape(value)
    # remove tags
    text = re.sub(r"<[^>]+>", "\n", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_mcqs_from_text(raw: str) -> list[dict]:
    """Naive MCQ extractor: looks for lines starting with Q1/Q.1/1. and A/B/C/D options."""
    text = _clean_text(raw)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    questions = []
    current = None
    for line in lines:
        # detect question numbering
        if re.match(r"^(?:Q(?:uestion)?\s*)?\d{1,3}[\.)]\s*", line, re.IGNORECASE):
            if current and len(current.get("options", [])) >= 4:
                questions.append(current)
            question_text = re.sub(r"^(?:Q(?:uestion)?\s*)?\d{1,3}[\.)]\s*", "", line, flags=re.IGNORECASE).strip()
            current = {"question": question_text, "options": []}
            continue
        # option lines
        m = re.match(r"^(?:A|B|C|D|Option\s*[A-D])[\.\):]\s*(.+)$", line, re.IGNORECASE)
        if m and current is not None:
            current["options"].append(m.group(1).strip())
            continue
        # sometimes options are listed without labels
        if current and len(current["options"]) < 4 and re.match(r"^[A-D]\s+", line):
            parts = re.split(r"\s+", line, maxsplit=1)
            if len(parts) > 1:
                current["options"].append(parts[1].strip())
                continue
        # append continuation to last option if exists
        if current and current.get("options"):
            current["options"][-1] = f"{current['options'][-1]} {line}".strip()
        elif current:
            current["question"] = f"{current['question']} {line}".strip()

    if current and len(current.get("options", [])) >= 4:
        questions.append(current)

    # Normalize to dicts with keys question/options/answer/explanation
    normalized = []
    for q in questions:
        opts = q.get("options", [])[:4]
        if len(opts) < 4:
            continue
        normalized.append({
            "question": q.get("question", "").strip(),
            "options": opts,
            "answer": "A",
            "explanation": "",
        })
    return normalized
