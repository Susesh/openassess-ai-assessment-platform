from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.database import Base


class SubtopicCertification(Base):
    """Stores subtopic-level micro-certifications earned by users."""
    __tablename__ = "subtopic_certifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=False)
    
    # Certification details
    certificate_code = Column(String, unique=True, nullable=False, index=True)
    verification_token = Column(String, unique=True, nullable=False, index=True)
    
    # Performance metrics
    average_score = Column(Float, nullable=False)
    attempts_count = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    questions_total = Column(Integer, default=0)
    
    # Timestamps
    first_attempted_at = Column(DateTime, nullable=True)
    certified_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # Optional expiration
    
    # Certificate metadata
    certificate_url = Column(String, nullable=True)  # PDF storage URL
    qr_code_url = Column(String, nullable=True)
    
    # Status
    is_active = Column(Integer, default=1)  # Soft delete flag
    revocation_reason = Column(String, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="subtopic_certifications")
    topic = relationship("Topic", back_populates="subtopic_certifications")
    subtopic = relationship("Subtopic", back_populates="certifications")
