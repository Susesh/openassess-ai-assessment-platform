import logging
import traceback
from typing import Union
from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import (
    SQLAlchemyError,
    IntegrityError,
    OperationalError,
    DatabaseError,
)

logger = logging.getLogger(__name__)


class APIException(Exception):
    """Base API exception with status code and message."""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class DatabaseException(APIException):
    """Database-specific exception."""
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, detail)


class ValidationException(APIException):
    """Validation exception."""
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail)


class AuthenticationException(APIException):
    """Authentication exception."""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail)


class AuthorizationException(APIException):
    """Authorization exception."""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail)


def format_error_response(status_code: int, detail: str, error_id: str = None) -> dict:
    """Format error response consistently."""
    return {
        "status": "error",
        "status_code": status_code,
        "detail": detail,
        "error_id": error_id,
    }


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all unhandled exceptions globally."""

    # Log the full exception with traceback
    logger.error(
        f"Unhandled exception in {request.method} {request.url.path}: {str(exc)}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else None,
        }
    )

    # Handle SQLAlchemy exceptions
    if isinstance(exc, IntegrityError):
        logger.warning(f"Integrity error: {exc.orig}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=format_error_response(
                status.HTTP_400_BAD_REQUEST,
                "Data integrity constraint violated"
            ),
        )

    if isinstance(exc, OperationalError):
        logger.error(f"Database operational error: {exc.orig}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=format_error_response(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Database service temporarily unavailable"
            ),
        )

    if isinstance(exc, DatabaseError):
        logger.error(f"Database error: {exc.orig}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=format_error_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Database operation failed"
            ),
        )

    if isinstance(exc, SQLAlchemyError):
        logger.error(f"SQLAlchemy error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=format_error_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Database error occurred"
            ),
        )

    # Handle custom API exceptions
    if isinstance(exc, APIException):
        return JSONResponse(
            status_code=exc.status_code,
            content=format_error_response(exc.status_code, exc.detail),
        )

    # Handle generic exceptions
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        ),
    )


class ExceptionLoggingMiddleware:
    """Middleware to log all request exceptions."""

    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger(__name__)

    async def __call__(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            self.logger.error(
                f"Middleware caught exception: {str(exc)}",
                exc_info=True,
                extra={
                    "path": request.url.path,
                    "method": request.method,
                },
            )
            raise
