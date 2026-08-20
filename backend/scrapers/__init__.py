from .utils import parse_mcqs_from_text, fetch_url_text

# Map exam module to preferred domains to try
EXAM_DOMAIN_MAP = {
    "CBSE": ["cbse.nic.in", "cbseacademic.nic.in"],
    "ICSE": ["cisce.org"],
    "State Board": [],
    "IIT-JEE": ["jeemain.nta.nic.in", "nta.ac.in"],
    "NEET": ["nta.ac.in"],
    "UPSC": ["upsc.gov.in"],
    "University Exams": [],
}


def fetch_for_topic(topic: str, exam_module: str | None = None, max_results: int = 6) -> list[dict]:
    """Try to fetch MCQs for a topic from authoritative domains for the given exam_module.

    Returns a list of question dicts matching the format used by the project.
    """
    domains = EXAM_DOMAIN_MAP.get(exam_module or "", [])
    results = []

    # If no specific domains configured, return empty quickly
    if not domains:
        return results

    # Do a DuckDuckGo search and prioritize links from the domains
    import httpx
    import re

    query = f"{topic} previous year question paper site:{' OR site:'.join(domains)} mcq"
    search_url = "https://duckduckgo.com/html/"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = httpx.get(search_url, params={"q": query}, headers=headers, timeout=12)
        r.raise_for_status()
    except Exception:
        return results

    # Find links in DuckDuckGo result snippet anchor class
    links = re.findall(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"', r.text)
    # Fallback: find any href
    if not links:
        links = re.findall(r'href="(https?://[^"]+)"', r.text)

    for raw in links[:max_results]:
        url = raw.replace("&amp;", "&")
        # Only proceed if domain matches
        if not any(d in url for d in domains):
            continue
        text = fetch_url_text(url)
        if not text:
            continue
        parsed = parse_mcqs_from_text(text)
        if parsed:
            return parsed

    return results
