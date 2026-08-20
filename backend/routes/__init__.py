"""Route handlers for OpenAssess API."""

from .admin import router as admin_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .certificates import router as certificates_router
from .certifications import router as certifications_router
from .proctoring import router as proctoring_router
from .questions import router as questions_router
from .quiz import router as quiz_router
from .remediation import router as remediation_router
from .results import router as results_router

__all__ = [
    "admin_router",
    "analytics_router",
    "auth_router",
    "certificates_router",
    "certifications_router",
    "proctoring_router",
    "questions_router",
    "quiz_router",
    "remediation_router",
    "results_router",
]
