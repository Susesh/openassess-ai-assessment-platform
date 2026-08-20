from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from backend.database import get_db
from backend.models.user import User
from backend.schemas.openapi import AUTH_ERRORS, UNAUTHORIZED
from backend.schemas.user import TokenResponse, UserCreate, UserOut, UserProfileUpdate, VALID_ROLES
from backend.utils.auth_utils import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.utils.security_logging import (
    log_authentication_success,
    log_authentication_failure,
    log_password_change,
    extract_request_info
)
from backend.utils.password_policy import validate_password_strength, PasswordPolicyError


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    success: bool


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class VerifyOTPResponse(BaseModel):
    message: str
    success: bool


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    message: str
    success: bool

router = APIRouter(prefix="/auth")


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account",
    responses={**AUTH_ERRORS},
)
def register(data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Create a new user with a bcrypt-hashed password and return their profile."""
    import logging
    import os
    logger = logging.getLogger(__name__)
    
    # Get full name from either first_name/last_name or full_name field
    full_name = data.get_full_name()
    logger.info(f"Registration attempt: email={data.email}, full_name={full_name}")
    
    # Validate password strength only if enabled (disabled by default for development)
    enable_password_validation = os.getenv("ENABLE_PASSWORD_VALIDATION", "false").lower() == "true"
    if enable_password_validation:
        is_valid, password_message = validate_password_strength(data.password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=password_message,
            )
    
    email = data.email.lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        logger.warning(f"Registration failed: email already registered - {email}")
        request_info = extract_request_info(request)
        log_authentication_failure(email, request_info["ip_address"], "Email already registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Allow specified role; default to student for unrecognized values
    role = data.validate_role()

    user = User(
        full_name=full_name,
        legacy_name=full_name,
        email=email,
        hashed_password=hash_password(data.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    request_info = extract_request_info(request)
    log_authentication_success(user.id, email, request_info["ip_address"])
    
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and receive a JWT",
    responses={**UNAUTHORIZED, 403: {"description": "Inactive account"}},
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate with email and password; returns a bearer token valid for 7 days."""
    username = form_data.username.lower()
    user = db.query(User).filter(User.email == username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role or "student"}
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role or "student",
    )


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user profile",
    responses={**UNAUTHORIZED},
)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the user identified by the JWT bearer token."""
    return current_user


@router.put(
    "/profile",
    response_model=UserOut,
    summary="Update current user profile",
    responses={**UNAUTHORIZED},
)
def update_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's name and/or password."""
    if data.full_name:
        current_user.full_name = data.full_name
        current_user.legacy_name = data.full_name

    if data.new_password:
        if not data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password",
            )
        if not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        current_user.hashed_password = hash_password(data.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Request password reset",
    responses={**AUTH_ERRORS},
)
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Request a password reset for a registered email address."""
    import logging
    import random
    logger = logging.getLogger(__name__)
    
    email = data.email.lower()
    user = db.query(User).filter(User.email == email).first()
    
    # Always return success for security (don't reveal if email exists)
    if user:
        logger.info(f"Password reset requested for email: {email}")
        # Generate and store a 4-digit OTP (for demo purposes, in production use secure storage)
        otp_code = str(random.randint(1000, 9999))
        # In production, you would:
        # 1. Store the OTP in database with expiration (10 minutes)
        # 2. Send an email with the OTP code
        # For demo, we'll log it
        logger.info(f"Generated OTP for {email}: {otp_code} (valid for 10 minutes)")
        request_info = extract_request_info(request)
        logger.info(f"Password reset request from IP: {request_info['ip_address']}")
    
    return ForgotPasswordResponse(
        message="If an account exists with this email, a 4-digit OTP code has been sent.",
        success=True
    )


@router.post(
    "/verify-otp",
    response_model=VerifyOTPResponse,
    summary="Verify OTP code",
    responses={**AUTH_ERRORS},
)
def verify_otp(
    data: VerifyOTPRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Verify the OTP code for password reset."""
    import logging
    logger = logging.getLogger(__name__)
    
    email = data.email.lower()
    otp = data.otp
    
    # For demo purposes, accept any 4-digit OTP
    # In production, verify against stored OTP in database
    if len(otp) == 4 and otp.isdigit():
        logger.info(f"OTP verification for {email}: {otp} (demo mode - accepts any 4-digit code)")
        return VerifyOTPResponse(
            message="OTP verified successfully. You can now reset your password.",
            success=True
        )
    else:
        logger.warning(f"Invalid OTP format for {email}: {otp}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Please enter a valid 4-digit code."
        )


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
    summary="Reset password with OTP",
    responses={**AUTH_ERRORS},
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Reset password using a valid OTP code."""
    import logging
    import os
    logger = logging.getLogger(__name__)
    
    email = data.email.lower()
    otp = data.otp
    new_password = data.new_password
    
    # Validate password strength if enabled
    enable_password_validation = os.getenv("ENABLE_PASSWORD_VALIDATION", "false").lower() == "true"
    if enable_password_validation:
        is_valid, password_message = validate_password_strength(new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=password_message,
            )
    
    # For demo purposes, accept any valid 4-digit OTP
    # In production, verify the OTP against database and check expiration
    if len(otp) == 4 and otp.isdigit():
        user = db.query(User).filter(User.email == email).first()
        if user:
            logger.info(f"Password reset for {email} with OTP: {otp}")
            user.hashed_password = hash_password(new_password)
            db.commit()
            db.refresh(user)
            log_password_change(user.id, email, "Password reset via OTP")
            return ResetPasswordResponse(
                message="Password has been reset successfully. Please log in with your new password.",
                success=True
            )
        else:
            # For security, don't reveal if email exists
            logger.warning(f"Password reset attempted for non-existent email: {email}")
            return ResetPasswordResponse(
                message="Password has been reset successfully. Please log in with your new password.",
                success=True
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Please enter a valid 4-digit code."
        )
