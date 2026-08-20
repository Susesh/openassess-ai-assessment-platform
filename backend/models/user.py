from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Map the attribute to the `full_name` DB column used across the codebase
    full_name = Column("full_name", String, nullable=False)
    # Legacy databases may still have a NOT NULL `name` column from older builds.
    # Keep it populated during inserts while the public API uses `full_name`.
    legacy_name = Column("name", String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    attempts = relationship("Attempt", back_populates="user")
    certifications = relationship("Certification", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")
    video_recordings = relationship("VideoRecording", back_populates="user")
    ai_violations = relationship("AIViolation", back_populates="user")
    proctoring_sessions = relationship("ProctoringSession", back_populates="user")
    subtopic_certifications = relationship("SubtopicCertification", back_populates="user")
    verification_logs = relationship("VerificationLog", back_populates="user")
    portfolio = relationship("Portfolio", back_populates="user", uselist=False)
