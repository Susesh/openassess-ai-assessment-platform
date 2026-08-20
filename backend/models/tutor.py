from datetime import datetime
from sqlalchemy import Column, DateTime, String, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.database import Base


class TutorProfile(Base):
    """Profile for tutors."""
    __tablename__ = "tutor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    bio = Column(String, nullable=True)
    hourly_rate = Column(Integer, default=0)
    subjects = Column(JSON, nullable=True)  # List of subjects
    rating = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)

    user = relationship("User")
    availabilities = relationship("TutorAvailability", back_populates="tutor")
    sessions = relationship("TutorSession", back_populates="tutor")

    @property
    def name(self) -> str:
        return self.user.full_name if self.user else "Tutor"

    @property
    def total_sessions(self) -> int:
        return len(self.sessions or [])


class TutorAvailability(Base):
    """Tutor available timeslots."""
    __tablename__ = "tutor_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.id"), nullable=False)
    
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String, nullable=False)  # "14:00"
    end_time = Column(String, nullable=False)    # "16:00"
    is_booked = Column(Boolean, default=False)
    
    tutor = relationship("TutorProfile", back_populates="availabilities")


class TutorSession(Base):
    """Booked sessions."""
    __tablename__ = "tutor_sessions"

    id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled
    meeting_link = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Remedial class integration
    remedial_attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=True)
    weak_topics = Column(JSON, nullable=True)  # Array of weak topic names
    auto_scheduled = Column(Boolean, default=False)  # Whether this was auto-scheduled by system

    tutor = relationship("TutorProfile", back_populates="sessions")
    student = relationship("User")
    remedial_attempt = relationship("Attempt", foreign_keys=[remedial_attempt_id])
