"""Shared OpenAPI response definitions for Swagger documentation."""

from backend.schemas.common import ErrorResponse

UNAUTHORIZED = {
    401: {
        "description": "Unauthorized — invalid or missing bearer token",
        "model": ErrorResponse,
    },
}

NOT_FOUND = {
    404: {
        "description": "Resource not found",
        "model": ErrorResponse,
    },
}

BAD_REQUEST = {
    400: {
        "description": "Bad request — invalid input or business rule violation",
        "model": ErrorResponse,
    },
}

FORBIDDEN = {
    403: {
        "description": "Forbidden — insufficient permissions",
        "model": ErrorResponse,
    },
}

CONFLICT = {
    409: {
        "description": "Conflict — resource already exists",
        "model": ErrorResponse,
    },
}

AUTH_ERRORS = {**BAD_REQUEST, **UNAUTHORIZED}
PROTECTED_ERRORS = {**UNAUTHORIZED, **NOT_FOUND, **BAD_REQUEST}
