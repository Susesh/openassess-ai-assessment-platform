from datetime import datetime
from sqlalchemy import Column, DateTime, String, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship

from backend.database import Base


class Organization(Base):
    """Organizations (employers, universities) that can verify certifications."""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    organization_type = Column(String, nullable=False)  # 'employer', 'university', 'recruitment_agency'
    
    # Contact information
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    # Authentication
    api_key = Column(String, unique=True, nullable=False, index=True)
    api_key_hash = Column(String, nullable=True)  # Hashed version for security
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Rate limiting
    rate_limit_per_hour = Column(Integer, default=100)
    rate_limit_per_day = Column(Integer, default=1000)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    last_api_call = Column(DateTime, nullable=True)
    
    # Metadata
    verification_document_url = Column(String, nullable=True)  # Proof of organization
    notes = Column(Text, nullable=True)

    # Relationships
    verification_logs = relationship("VerificationLog", back_populates="organization")


class VerificationLog(Base):
    """Audit log for certification verifications by organizations."""
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # User being verified
    
    # Verification details
    verification_type = Column(String, nullable=False)  # 'topic_certification', 'subtopic_certification', 'portfolio'
    certificate_id = Column(Integer, nullable=True)
    verification_token = Column(String, nullable=True)
    
    # Result
    is_valid = Column(Boolean, nullable=False)
    verification_data = Column(Text, nullable=True)  # JSON string of returned data
    
    # Request metadata
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    request_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Response time
    response_time_ms = Column(Integer, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="verification_logs")
    user = relationship("User", back_populates="verification_logs")
