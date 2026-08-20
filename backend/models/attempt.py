from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.database import Base



class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    exam_criteria_id = Column(Integer, ForeignKey("exam_criteria.id"), nullable=True)
    question_paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=True)
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    server_started_at = Column(DateTime, nullable=True)
    deadline_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    time_spent_seconds = Column(Integer, nullable=False, default=0)
    submission_reason = Column(String, nullable=True)
    
    # Scoring
    score = Column(Integer, nullable=False, default=0)
    raw_score = Column(Float, nullable=False, default=0.0)
    total_marks = Column(Float, nullable=False, default=0.0)
    passing_percentage = Column(Float, nullable=False, default=40.0)
    negative_marking = Column(Float, nullable=False, default=0.0)
    total_questions = Column(Integer, nullable=False, default=0)
    is_passed = Column(Boolean, default=False)
    
    # Question tracking
    question_ids = Column(JSON, nullable=True)  # question IDs selected at quiz start
    answers_snapshot = Column(JSON, nullable=True)  # {question_id: answer}
    per_question_time = Column(JSON, nullable=True)  # {question_id: seconds}
    question_status = Column(JSON, nullable=True)  # {question_id: "answered"|"review"|"unanswered"|"visited"}
    marked_for_review = Column(JSON, nullable=True)  # [question_ids marked for review]
    
    # Criteria snapshot
    criteria_snapshot = Column(JSON, nullable=True)
    adaptive_recommendation = Column(JSON, nullable=True)
    
    # Adaptive difficulty tracking
    difficulty_progression = Column(JSON, nullable=True)  # Track difficulty changes during quiz
    initial_difficulty = Column(String, nullable=True)  # Starting difficulty level
    final_difficulty = Column(String, nullable=True)  # Ending difficulty level
    
    # Proctoring and recording
    proctoring_enabled = Column(Boolean, default=True)
    video_recording_enabled = Column(Boolean, default=True)
    integrity_score = Column(Float, nullable=True)
    proctoring_violations_count = Column(Integer, default=0)
    
    # Recruiter actions
    is_approved = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    is_disqualified = Column(Boolean, default=False)
    recruiter_notes = Column(String, nullable=True)
    recruiter_action = Column(String, nullable=True)
    recruiter_action_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="attempts")
    topic = relationship("Topic", back_populates="attempts")
    exam_criteria = relationship("ExamCriteria")
    question_paper = relationship("QuestionPaper")
    results = relationship("Result", back_populates="attempt", cascade="all, delete-orphan")
    proctor_logs = relationship(
        "ProctorLog", back_populates="attempt", cascade="all, delete-orphan"
    )
    video_recording = relationship("VideoRecording", back_populates="attempt", uselist=False)
    ai_violations = relationship("AIViolation", back_populates="attempt", cascade="all, delete-orphan")
    proctoring_session = relationship("ProctoringSession", back_populates="attempt", uselist=False)

    @property
    def percentage(self) -> float:
        if self.total_questions == 0:
            return 0.0
        return round((self.score / self.total_questions) * 100, 1)
