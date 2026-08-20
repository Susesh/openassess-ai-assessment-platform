"""
Password policy validation utilities.

Provides password strength validation and policy enforcement
to ensure users create strong, secure passwords.
"""

import re
from typing import Tuple


class PasswordPolicyError(Exception):
    """Raised when password doesn't meet policy requirements."""
    pass


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password strength against security requirements.
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: The password to validate
        
    Returns:
        Tuple of (is_valid, message)
    """
    if not password:
        return False, "Password cannot be empty"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    return True, "Password meets strength requirements"


def get_password_strength_score(password: str) -> int:
    """
    Calculate a password strength score (0-100).
    
    Args:
        password: The password to score
        
    Returns:
        Strength score from 0 (weak) to 100 (strong)
    """
    score = 0
    
    # Length contribution
    if len(password) >= 8:
        score += 20
    if len(password) >= 12:
        score += 10
    if len(password) >= 16:
        score += 10
    
    # Character variety
    if re.search(r"[A-Z]", password):
        score += 15
    if re.search(r"[a-z]", password):
        score += 15
    if re.search(r"\d", password):
        score += 15
    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        score += 15
    
    return min(score, 100)


def get_password_strength_label(score: int) -> str:
    """Get human-readable password strength label."""
    if score < 40:
        return "Weak"
    elif score < 60:
        return "Fair"
    elif score < 80:
        return "Good"
    else:
        return "Strong"
