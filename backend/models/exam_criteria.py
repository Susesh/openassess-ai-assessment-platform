from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.database import Base


class ExamCriteria(Base):
    """Configurable assessment criteria used to start controlled exams."""

    __tablename__ = "exam_criteria"

    id = Column(Integer, primary_key=True, index=True)
    exam_name = Column(String, nullable=False)
    board = Column(String, nullable=False, default="Custom")
    subject = Column(String, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=True)
    difficulty = Column(String, nullable=False, default="medium")
    total_questions = Column(Integer, nullable=False, default=10)
    total_marks = Column(Float, nullable=False, default=10.0)
    passing_percentage = Column(Float, nullable=False, default=40.0)
    negative_marking = Column(Float, nullable=False, default=0.0)
    maximum_attempts = Column(Integer, nullable=False, default=0)
    duration_minutes = Column(Integer, nullable=False, default=60)
    video_recording_enabled = Column(Boolean, nullable=False, default=True)
    ai_proctoring_enabled = Column(Boolean, nullable=False, default=True)
    certificate_enabled = Column(Boolean, nullable=False, default=True)
    instructions = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    topic = relationship("Topic")
    subtopic = relationship("Subtopic")
