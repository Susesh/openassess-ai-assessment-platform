"""
Security logging utilities for tracking security events.

Provides comprehensive logging of security-related events including
authentication attempts, authorization failures, and suspicious activities.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import Request

security_logger = logging.getLogger("security")


def log_security_event(
    event_type: str,
    user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    severity: str = "INFO"
) -> None:
    """
    Log a security event with structured data.
    
    Args:
        event_type: Type of security event (e.g., "login_success", "failed_login_attempt")
        user_id: ID of the user involved (if applicable)
        details: Additional event details as a dictionary
        severity: Log severity level (INFO, WARNING, ERROR)
    """
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "details": details or {}
    }
    
    if severity == "INFO":
        security_logger.info(log_data)
    elif severity == "WARNING":
        security_logger.warning(log_data)
    elif severity == "ERROR":
        security_logger.error(log_data)
    else:
        security_logger.info(log_data)


def log_authentication_success(user_id: int, email: str, ip_address: str) -> None:
    """Log successful authentication."""
    log_security_event(
        event_type="login_success",
        user_id=user_id,
        details={
            "email": email,
            "ip_address": ip_address,
            "user_agent": "N/A"  # Can be added from request headers
        },
        severity="INFO"
    )


def log_authentication_failure(email: str, ip_address: str, reason: str) -> None:
    """Log failed authentication attempt."""
    log_security_event(
        event_type="failed_login_attempt",
        details={
            "email": email,
            "ip_address": ip_address,
            "reason": reason
        },
        severity="WARNING"
    )


def log_unauthorized_access_attempt(user_id: int, endpoint: str, ip_address: str) -> None:
    """Log unauthorized access attempt."""
    log_security_event(
        event_type="unauthorized_access_attempt",
        user_id=user_id,
        details={
            "endpoint": endpoint,
            "ip_address": ip_address
        },
        severity="WARNING"
    )


def log_password_change(user_id: int, ip_address: str) -> None:
    """Log password change."""
    log_security_event(
        event_type="password_change",
        user_id=user_id,
        details={
            "ip_address": ip_address
        },
        severity="INFO"
    )


def log_admin_action(user_id: int, action: str, target_user_id: Optional[int] = None, details: Optional[Dict] = None) -> None:
    """Log administrative action."""
    log_security_event(
        event_type="admin_action",
        user_id=user_id,
        details={
            "action": action,
            "target_user_id": target_user_id,
            "additional_details": details or {}
        },
        severity="INFO"
    )


def log_rate_limit_exceeded(ip_address: str, endpoint: str) -> None:
    """Log rate limit violation."""
    log_security_event(
        event_type="rate_limit_exceeded",
        details={
            "ip_address": ip_address,
            "endpoint": endpoint
        },
        severity="WARNING"
    )


def log_suspicious_activity(description: str, details: Optional[Dict] = None) -> None:
    """Log suspicious activity."""
    log_security_event(
        event_type="suspicious_activity",
        details={
            "description": description,
            "additional_details": details or {}
        },
        severity="ERROR"
    )


def extract_request_info(request: Request) -> Dict[str, str]:
    """Extract relevant information from a request for security logging."""
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "method": request.method,
        "url": str(request.url),
        "user_agent": request.headers.get("user-agent", "unknown")
    }
