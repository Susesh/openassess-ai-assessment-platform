from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SubtopicCertificationBase(BaseModel):
    average_score: float = Field(..., ge=0.0, le=100.0)
    attempts_count: int = Field(default=0, ge=0)
    questions_correct: int = Field(default=0, ge=0)
    questions_total: int = Field(default=0, ge=0)


class SubtopicCertificationCreate(SubtopicCertificationBase):
    topic_id: int
    subtopic_id: int


class SubtopicCertificationOut(BaseModel):
    id: int
    user_id: int
    topic_id: int
    subtopic_id: int
    certificate_code: str
    verification_token: str
    average_score: float
    attempts_count: int
    questions_correct: int
    questions_total: int
    first_attempted_at: Optional[datetime]
    certified_at: datetime
    expires_at: Optional[datetime]
    certificate_url: Optional[str]
    qr_code_url: Optional[str]
    is_active: int
    revocation_reason: Optional[str]
    revoked_at: Optional[datetime]

    class Config:
        from_attributes = True


class SubtopicCertificationDetail(SubtopicCertificationOut):
    topic_name: Optional[str] = None
    subtopic_name: Optional[str] = None


class VerificationRequest(BaseModel):
    verification_token: str


class VerificationResponse(BaseModel):
    is_valid: bool
    certification: Optional[SubtopicCertificationDetail] = None
    user_name: Optional[str] = None
    topic_name: Optional[str] = None
    subtopic_name: Optional[str] = None
    certified_at: Optional[datetime] = None
    average_score: Optional[float] = None
    revocation_reason: Optional[str] = None
