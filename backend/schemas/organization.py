from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    organization_type: str = Field(..., pattern="^(employer|university|recruitment_agency)$")
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    verification_document_url: Optional[str] = None
    notes: Optional[str] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    verification_document_url: Optional[str] = None
    notes: Optional[str] = None


class OrganizationOut(BaseModel):
    id: int
    name: str
    organization_type: str
    email: str
    phone: Optional[str]
    website: Optional[str]
    address: Optional[str]
    is_active: bool
    is_verified: bool
    rate_limit_per_hour: int
    rate_limit_per_day: int
    created_at: datetime
    verified_at: Optional[datetime]
    last_api_call: Optional[datetime]

    class Config:
        from_attributes = True


class OrganizationWithApiKey(OrganizationOut):
    api_key: str


class VerificationRequest(BaseModel):
    api_key: str = Field(..., description="Organization API key")
    verification_type: str = Field(..., description="topic_certification, subtopic_certification, portfolio")
    identifier: str = Field(..., description="Certificate code, verification token, or username")


class VerificationResponse(BaseModel):
    is_valid: bool
    data: Optional[dict] = None
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class CandidateSearchRequest(BaseModel):
    api_key: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class CandidateCertification(BaseModel):
    certification_type: str  # 'topic' or 'subtopic'
    certificate_code: str
    topic_name: str
    subtopic_name: Optional[str] = None
    average_score: float
    certified_at: datetime
    is_active: bool


class CandidateProfile(BaseModel):
    user_id: int
    full_name: str
    email: str
    certifications: List[CandidateCertification]
    total_certifications: int
    last_certification: Optional[datetime]


class VerificationLogOut(BaseModel):
    id: int
    organization_id: int
    user_id: Optional[int]
    verification_type: str
    is_valid: bool
    request_timestamp: datetime
    response_time_ms: Optional[int]
