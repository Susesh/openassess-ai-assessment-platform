from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, JSON, Boolean
from sqlalchemy.orm import relationship

from backend.database import Base


class AIViolation(Base):
    """Stores AI-detected proctoring violations during assessments."""
    __tablename__ = "ai_violations"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Violation type and severity
    violation_type = Column(String, nullable=False)  # 'face_not_detected', 'multiple_faces', 'eye_movement', 'head_pose', 'audio_detected', 'phone_detected', 'tab_switch', 'fullscreen_exit', 'copy_paste'
    severity = Column(String, nullable=False)  # 'low', 'medium', 'high', 'critical'
    confidence_score = Column(Float, nullable=True)  # AI confidence (0.0-1.0)
    
    # Detection details
    detection_timestamp = Column(DateTime, default=datetime.utcnow)
    frame_timestamp = Column(Float, nullable=True)  # Video frame timestamp
    screenshot_path = Column(String, nullable=True)  # Evidence screenshot
    
    # Specific violation data
    violation_data = Column(JSON, nullable=True)  # Type-specific data (e.g., face_count, eye_direction, head_angles)
    
    # Context
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    session_time_seconds = Column(Integer, nullable=True)  # Time into assessment
    
    # Resolution
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String, nullable=True)  # 'auto', 'admin', 'system'
    resolution_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    attempt = relationship("Attempt", back_populates="ai_violations")
    user = relationship("User", back_populates="ai_violations")


class ProctoringSession(Base):
    """Tracks overall AI proctoring session for an attempt."""
    __tablename__ = "proctoring_sessions"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Session status
    status = Column(String, default="active")  # 'active', 'paused', 'completed', 'terminated'
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    
    # Overall integrity score
    integrity_score = Column(Float, default=100.0)  # Starts at 100, decreases with violations
    violation_count = Column(Integer, default=0)
    high_severity_count = Column(Integer, default=0)
    critical_severity_count = Column(Integer, default=0)
    
    # Face tracking
    face_detected_count = Column(Integer, default=0)
    face_not_detected_count = Column(Integer, default=0)
    multiple_face_detected_count = Column(Integer, default=0)
    
    # Eye tracking
    eye_tracking_enabled = Column(Boolean, default=True)
    eye_movement_violations = Column(Integer, default=0)
    
    # Head pose
    head_pose_violations = Column(Integer, default=0)
    
    # Audio
    audio_enabled = Column(Boolean, default=True)
    audio_violations = Column(Integer, default=0)
    
    # Environment
    tab_switch_count = Column(Integer, default=0)
    fullscreen_exit_count = Column(Integer, default=0)
    copy_paste_count = Column(Integer, default=0)
    phone_detected_count = Column(Integer, default=0)
    
    # Final decision
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String, nullable=True)
    auto_submit_triggered = Column(Boolean, default=False)
    
    # Metadata
    proctoring_version = Column(String, default="1.0")
    ai_models_used = Column(JSON, nullable=True)  # List of AI models used
    session_metadata = Column(JSON, nullable=True)  # Session metadata for tracking state
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attempt = relationship("Attempt", back_populates="proctoring_session")
    user = relationship("User", back_populates="proctoring_sessions")
