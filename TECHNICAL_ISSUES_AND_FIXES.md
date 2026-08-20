# Technical Issues & Code Examples

## Issue #1: Hardcoded API Key in ai_service.py

### Current Code (WRONG)
```python
# backend/services/ai_service.py, line 17
GEMINI_API_KEY = os.getenv("AIzaSyDE53kTDsP1m7xdPXqCNwEJ6JBYmkBePDc")
```

### Problem
The string `"AIzaSyDE53kTDsP1m7xdPXqCNwEJ6JBYmkBePDc"` is a literal API key passed to `os.getenv()` as default. This:
1. Exposes the key in Git history
2. Anyone who clones repo has access to the key
3. API key can be revoked by Google but damage already done
4. Violates secure coding practices

### Correct Code
```python
# backend/services/ai_service.py, line 17
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
```

### Required .env Entry
```bash
# .env
GOOGLE_API_KEY=your_actual_api_key_here
```

### Cleanup Steps
```bash
# 1. Invalidate the exposed key immediately in Google Cloud Console
# 2. Create new API key
# 3. Update .env.example to remove old key
# 4. Remove from Git history:
git log --all --full-history -- backend/services/ai_service.py
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/services/ai_service.py' \
  --prune-empty --tag-name-filter cat -- --all
```

---

## Issue #2: Missing Admin Routes

### Current Status
Frontend calls:
```typescript
// frontend/app/admin/revenue/page.tsx, line 41
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/payment/admin/revenue-stats`,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("openassess_token")}`,
    },
  }
);
```

Backend status: Endpoint doesn't exist

### Missing Backend Routes
```python
# backend/routes/admin.py - SHOULD EXIST BUT DOESN'T

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, QuizPayment, CertificatePayment, Topic
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

def require_admin(user: User = Depends(get_current_user)) -> User:
    """Dependency: Check if user is admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

@router.get("/payment/admin/revenue-stats")
def get_revenue_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get total revenue, by type, transactions, top quizzes."""
    
    # Total revenue from both payment types
    quiz_revenue = db.query(func.sum(QuizPayment.amount)).filter(
        QuizPayment.status == "success"
    ).scalar() or 0.0
    
    cert_revenue = db.query(func.sum(CertificatePayment.amount)).filter(
        CertificatePayment.status == "success"
    ).scalar() or 0.0
    
    total_revenue = quiz_revenue + cert_revenue
    
    # Transaction counts
    quiz_transactions = db.query(func.count(QuizPayment.id)).filter(
        QuizPayment.status == "success"
    ).scalar() or 0
    
    cert_transactions = db.query(func.count(CertificatePayment.id)).filter(
        CertificatePayment.status == "success"
    ).scalar() or 0
    
    total_transactions = quiz_transactions + cert_transactions
    
    # Unique paid users
    quiz_users = db.query(func.count(func.distinct(QuizPayment.user_id))).filter(
        QuizPayment.status == "success"
    ).scalar() or 0
    
    cert_users = db.query(func.count(func.distinct(CertificatePayment.user_id))).filter(
        CertificatePayment.status == "success"
    ).scalar() or 0
    
    paid_users = len(set([quiz_users, cert_users]))
    
    # Top quizzes by revenue
    top_quizzes = db.query(
        Topic.id,
        Topic.name,
        func.sum(QuizPayment.amount).label("total_revenue"),
        func.count(QuizPayment.id).label("purchases")
    ).join(QuizPayment).filter(
        QuizPayment.status == "success"
    ).group_by(Topic.id).order_by(
        desc("total_revenue")
    ).limit(5).all()
    
    return {
        "total_revenue": total_revenue,
        "quiz_revenue": quiz_revenue,
        "certificate_revenue": cert_revenue,
        "total_transactions": total_transactions,
        "paid_users": paid_users,
        "top_quizzes": [
            {
                "id": q[0],
                "name": q[1],
                "revenue": q[2],
                "purchases": q[3]
            }
            for q in top_quizzes
        ]
    }

@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all users with pagination."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/topics")
def list_topics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all topics with question counts."""
    topics = db.query(Topic).all()
    return [
        {
            **topic.__dict__,
            "question_count": db.query(func.count(Question.id)).filter(
                Question.topic_id == topic.id
            ).scalar()
        }
        for topic in topics
    ]
```

### Include in main.py
```python
# backend/main.py
from backend.routes import admin

app.include_router(admin.router, tags=["Admin"])
```

### Update User Model for Admin Role
```python
# backend/models/user.py - Already has role field, just needs values
# Current: role = Column(String, default="student", nullable=False)
# Valid values: "student", "admin"
```

---

## Issue #3: No Payment Webhook Handler

### Current Flow (Incomplete)
```
1. POST /api/payment/create-quiz-order
   ├─ Razorpay returns order_id
   └─ Frontend receives order_id
   
2. [Browser] User shown Razorpay checkout modal
   
3. [User] Completes/cancels payment in Razorpay
   └─ Razorpay processes payment
   
4. POST /api/payment/verify-quiz-payment (Frontend calls this)
   ├─ Verify signature
   └─ Update payment status
```

### Problem
- No async notification from Razorpay to backend
- Payment status relies on frontend verification
- If frontend crashes mid-flow, payment stays pending
- Cannot generate certificate without frontend action

### Required Implementation
```python
# backend/routes/payments.py - ADD THIS ENDPOINT

import hmac
import hashlib
from typing import Dict

@app.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle async payment webhooks from Razorpay.
    
    Razorpay sends notifications for:
    - payment.authorized
    - payment.failed
    - payment.captured
    """
    
    # Get body as raw bytes for signature verification
    body = await request.body()
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    
    # Verify signature
    signature = request.headers.get("X-Razorpay-Signature")
    expected_signature = hmac.new(
        webhook_secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )
    
    # Parse payload
    payload = await request.json()
    event = payload.get("event")
    data = payload.get("data", {})
    
    if event == "payment.authorized":
        # Payment successful
        razorpay_payment_id = data["payment"]["id"]
        razorpay_order_id = data["payment"]["order_id"]
        
        # Update payment record
        payment = db.query(QuizPayment).filter_by(
            razorpay_order_id=razorpay_order_id
        ).first()
        
        if payment:
            payment.status = "success"
            payment.razorpay_payment_id = razorpay_payment_id
            payment.transaction_id = razorpay_payment_id
            db.commit()
            
            # Send notification email
            send_email(
                email=payment.user.email,
                subject="Payment Successful",
                body=f"Your payment of ₹{payment.amount} has been processed. You can now access the quiz."
            )
    
    elif event == "payment.failed":
        # Payment failed
        razorpay_order_id = data["payment"]["order_id"]
        
        payment = db.query(QuizPayment).filter_by(
            razorpay_order_id=razorpay_order_id
        ).first()
        
        if payment:
            payment.status = "failed"
            db.commit()
            
            # Send notification email
            send_email(
                email=payment.user.email,
                subject="Payment Failed",
                body="Your payment could not be processed. Please try again."
            )
    
    # Always return 200 to Razorpay (indicates webhook received)
    return {"status": "received"}
```

### Required Environment Variable
```bash
# .env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## Issue #4: Database Schema Inconsistencies

### Problem 1: Missing FK from Payments to Certificates
```python
# Current: QuizPayment and CertificatePayment tables
# Missing: Link to which certificate was generated from which payment
```

### SQL Migration
```sql
-- Add FK to link payment to certificate
ALTER TABLE certificates 
ADD COLUMN quiz_payment_id INTEGER REFERENCES quiz_payments(id) ON DELETE SET NULL;

ALTER TABLE certificates 
ADD COLUMN certificate_payment_id INTEGER REFERENCES certificate_payments(id) ON DELETE SET NULL;
```

### Update Models
```python
# backend/models/certificate.py
class Certificate(Base):
    __tablename__ = "certificates"
    
    # ... existing columns ...
    
    # NEW: Link back to payment
    quiz_payment_id = Column(Integer, ForeignKey("quiz_payments.id"), nullable=True)
    certificate_payment_id = Column(Integer, ForeignKey("certificate_payments.id"), nullable=True)

# backend/models/payment.py
class QuizPayment(Base):
    __tablename__ = "quiz_payments"
    
    # ... existing columns ...
    
    # NEW: Link to generated certificates
    certificates = relationship("Certificate", back_populates="quiz_payment")

class CertificatePayment(Base):
    __tablename__ = "certificate_payments"
    
    # ... existing columns ...
    
    # NEW: Link to generated certificates
    certificates = relationship("Certificate", back_populates="certificate_payment")
```

### Problem 2: User Name Column Conflicts
```python
# Current User model:
full_name = Column("full_name", String, nullable=False)
legacy_name = Column("name", String, nullable=True)

# This creates confusion:
# - API uses full_name
# - Database has both full_name and name
# - Potential for sync issues
```

### Fix: Deprecate legacy_name
```python
# backend/models/user.py
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)  # MAIN field
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Remove: legacy_name (just migrate data to full_name)
```

### Problem 3: Certificate Model Missing back_populates
```python
# Current Certificate model
class Certificate(Base):
    user = relationship("User")  # ⚠️ No back_populates
    topic = relationship("Topic")
    attempt = relationship("Attempt")

# Should be:
class Certificate(Base):
    user = relationship("User", back_populates="certificates")
    topic = relationship("Topic", back_populates="certificates")
    attempt = relationship("Attempt", back_populates="certificates")
```

---

## Issue #5: Payment Verification Without Idempotency

### Current Code (Vulnerable)
```python
# backend/services/payment_service.py
def verify_quiz_payment(self, db: Session, payment_id, order_id, signature):
    try:
        # Verify signature
        self.client.utility.verify_payment_signature({...})
        
        # Find payment record
        payment = db.query(QuizPayment).filter_by(
            razorpay_order_id=order_id
        ).first()
        
        if payment:
            payment.status = "success"  # ⚠️ Updates every time!
            payment.razorpay_payment_id = payment_id
            db.commit()
            return True
```

### Issue
If frontend calls verify twice, payment gets updated twice. If webhook also fires, duplicate processing occurs.

### Fixed Code (Idempotent)
```python
def verify_quiz_payment(self, db: Session, payment_id, order_id, signature):
    try:
        # Verify signature first (no state change)
        self.client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        })
        
        # Find payment
        payment = db.query(QuizPayment).filter_by(
            razorpay_order_id=order_id
        ).first()
        
        if not payment:
            # Payment record not found (shouldn't happen)
            return False
        
        # IDEMPOTENT: Check if already processed
        if payment.status == "success":
            # Already verified, return success
            logger.info(f"Payment {payment_id} already verified")
            return True
        
        if payment.status == "failed":
            # Previous attempt failed, can't retry here
            logger.warning(f"Payment {payment_id} previously failed")
            return False
        
        # NEW: Only update if status is pending
        if payment.status != "pending":
            logger.warning(f"Unexpected payment status: {payment.status}")
            return False
        
        # Update payment (only once)
        payment.status = "success"
        payment.razorpay_payment_id = payment_id
        payment.transaction_id = payment_id
        payment.updated_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Payment {payment_id} verified successfully")
        return True
        
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        return False
```

---

## Issue #6: Blocking Certificate PDF Generation

### Current Code (Blocking)
```python
# backend/routes/quiz.py - quiz submission
async def submit_quiz(body: QuizSubmit, ...):
    # ... grade answers ...
    
    # THIS BLOCKS THE RESPONSE (1-2 seconds)
    certificates = create_certificates_for_assessment(...)
    
    return QuizResult(
        score=attempt.score,
        total=attempt.total_questions,
        passed=attempt.is_passed,
        percentage=attempt.percentage,
        completed_at=attempt.completed_at,
        participation_certificate=serialize_certificate(certificates[0]),
        achievement_certificate=serialize_certificate(certificates[1]) if len(certificates) > 1 else None,
        results=breakdown,
    )
```

### Solution 1: Use Background Task (Quick Fix)
```python
# backend/routes/quiz.py
from fastapi import BackgroundTasks

@router.post("/submit", response_model=QuizResult)
async def submit_quiz(
    body: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """Submit quiz answers with async certificate generation."""
    
    attempt = db.query(Attempt).filter(...).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Grade answers (synchronous, fast)
    results = []
    correct_count = 0
    
    for answer in body.answers:
        question = db.query(Question).filter(...).first()
        is_correct = answer.selected_option == question.correct_option
        
        result = Result(
            attempt_id=attempt.id,
            question_id=answer.question_id,
            selected_option=answer.selected_option,
            is_correct=is_correct,
        )
        db.add(result)
        
        if is_correct:
            correct_count += 1
        
        results.append(result)
    
    # Update attempt
    attempt.score = correct_count
    attempt.completed_at = datetime.utcnow()
    attempt.is_passed = (correct_count / attempt.total_questions) * 100 >= 80
    db.commit()
    
    # Generate certificates in background (non-blocking)
    background_tasks.add_task(
        create_certificates_for_assessment,
        db=db,
        user_id=current_user.id,
        attempt_id=attempt.id,
    )
    
    # Return result IMMEDIATELY (no wait for PDF)
    return QuizResult(
        score=attempt.score,
        total=attempt.total_questions,
        passed=attempt.is_passed,
        percentage=attempt.percentage,
        completed_at=attempt.completed_at,
        participation_certificate=None,  # Will be available later
        achievement_certificate=None,
        results=breakdown,
    )
```

### Solution 2: Use Celery Task Queue (Production)
```python
# backend/celery_app.py
from celery import Celery

celery_app = Celery(
    "openassess",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery_app.task
def generate_certificates_async(user_id: int, attempt_id: int):
    """Generate certificates asynchronously."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
        
        if user and attempt:
            certificates = create_certificates_for_assessment(db, user, attempt)
            # Optionally send notification email
            send_email(
                email=user.email,
                subject="Certificate Ready",
                body="Your certificate is ready! View it in your dashboard."
            )
    finally:
        db.close()

# In quiz.py
@router.post("/submit")
async def submit_quiz(...):
    # ... grade answers ...
    
    # Queue certificate generation
    from backend.celery_app import generate_certificates_async
    generate_certificates_async.delay(current_user.id, attempt.id)
    
    # Return result immediately
    return QuizResult(...)
```

---

## Issue #7: Hardcoded Configuration Values

### Problem 1: Verification URL
```python
# backend/services/certificate_service.py:55
verification_url = f"https://www.antigravity.com/verify-certificate/{certificate_id}"
```

### Fix
```python
# backend/services/certificate_service.py
import os

def create_verification_qr_code(certificate_id: str) -> str:
    """Create QR code for certificate verification."""
    
    # Use environment variable
    base_url = os.getenv(
        "CERTIFICATE_VERIFICATION_URL",
        "https://www.antigravity.com"
    )
    verification_url = f"{base_url}/verify-certificate/{certificate_id}"
    
    # ... rest of function ...
```

### Required .env Entry
```bash
# .env
CERTIFICATE_VERIFICATION_URL=https://www.antigravity.com
# Or for development:
CERTIFICATE_VERIFICATION_URL=http://localhost:3000
```

### Problem 2: Pass Threshold Values
```python
# backend/routes/quiz.py:33
PASS_THRESHOLD_PERCENT = 80

# backend/routes/certifications.py:24
PASS_THRESHOLD = 80
```

### Fix: Use Topic.passing_score
```python
# backend/routes/quiz.py - Remove hardcoded constant

async def submit_quiz(body: QuizSubmit, ...):
    # ... grade answers ...
    
    topic = db.query(Topic).filter(Topic.id == attempt.topic_id).first()
    passing_score = topic.passing_score  # Use from Topic model
    
    attempt.is_passed = attempt.percentage >= passing_score
    # ... rest ...

# backend/routes/certifications.py - Remove hardcoded constant

def generate_certification(body: CertificationGenerate, ...):
    topic = db.query(Topic).filter(Topic.id == body.topic_id).first()
    passing_threshold = topic.passing_score  # Use from Topic model
    
    avg_score = _topic_average_score(db, current_user.id, body.topic_id)
    if avg_score < passing_threshold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Average score {avg_score}% is below the {passing_threshold}% requirement",
        )
```

---

## Issue #8: JWT Configuration Issues

### Current Config (Weak)
```python
# backend/utils/auth_utils.py
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

### Issues
- 7 days is too long
- No refresh token rotation
- No token revocation
- No refresh token mechanism

### Fixed Config
```python
# backend/utils/auth_utils.py

# Access token: short-lived (1 hour)
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

# Refresh token: long-lived (7 days)
REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
)

def create_access_token(data: dict) -> str:
    """Create short-lived access token (1 hour)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """Create long-lived refresh token (7 days)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify token and check type."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type", "access")
        
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
```

### Add Refresh Endpoint
```python
# backend/routes/auth.py

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Exchange refresh token for new access token."""
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Generate new access token
        new_access_token = create_access_token(
            data={"sub": user.email, "role": user.role}
        )
        
        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            role=user.role
        )
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
```

### Update Login Endpoint
```python
# backend/routes/auth.py

@router.post("/login", response_model=dict)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Return both access and refresh tokens."""
    username = form_data.username.lower()
    user = db.query(User).filter(User.email == username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user account")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role
    }
```

---

## Issue #9: No Role-Based Access Control (RBAC)

### Current Status
```python
# All routes use get_current_user, which only checks authentication
# Not authorization
```

### Implementation
```python
# backend/utils/auth_utils.py - ADD this function

def require_role(required_role: str):
    """Dependency: Check if user has required role."""
    def check_role(user: User = Depends(get_current_user)) -> User:
        if user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires '{required_role}' role"
            )
        return user
    return check_role

def require_roles(*allowed_roles: str):
    """Dependency: Check if user has one of allowed roles."""
    def check_roles(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            roles_str = ", ".join(allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of: {roles_str}"
            )
        return user
    return check_roles
```

### Usage
```python
# backend/routes/admin.py

require_admin = require_role("admin")

@router.get("/revenue-stats")
def get_revenue_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get revenue statistics (admin only)."""
    # ... implementation ...
```

---

## Issue #10: Missing Input Validation

### Current Code (Vulnerable)
```python
# backend/routes/payments.py
class CreateOrderRequest(BaseModel):
    topic_id: int
    amount: Optional[float] = None  # ⚠️ No validation!

# User could send: {"topic_id": 1, "amount": -100.00}
```

### Fixed Code
```python
# backend/routes/payments.py
from pydantic import Field, validator

class CreateOrderRequest(BaseModel):
    topic_id: int = Field(..., gt=0)  # Must be positive
    amount: Optional[float] = Field(None, gt=0)  # Must be positive if provided
    
    @validator('topic_id')
    def topic_must_exist(cls, v, values):
        # Could add DB check here if needed
        return v

# Usage prevents negative amounts
```

---

## Summary of All Code Fixes

| Issue | File | Lines | Fix Type | Complexity |
|-------|------|-------|----------|------------|
| 1 | ai_service.py | 1 | String change | Trivial |
| 2 | admin.py | 200+ | New file | High |
| 3 | payments.py | 50 | New endpoint | High |
| 4 | database.py, models/*.py | 100+ | Schema changes | Medium |
| 5 | payment_service.py | 20 | Logic change | Low |
| 6 | quiz.py | 50 | Refactor | Medium |
| 7 | certificate_service.py, payment_service.py | 20 | Config vars | Low |
| 8 | auth_utils.py, auth.py | 100 | New endpoints | High |
| 9 | auth_utils.py, all routes | 50 | Authorization checks | Medium |
| 10 | payment*.py, quiz*.py | 20 | Validators | Low |

---

**Total Lines of Code to Fix: ~600 lines**  
**Estimated Time: 15-20 hours**  
**Priority: CRITICAL → HIGH → MEDIUM**
