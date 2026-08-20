from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from backend.schemas.certificate import CertificateOut


class QuizStart(BaseModel):
    topic_id: Optional[int] = Field(None, example=1)
    exam_criteria_id: Optional[int] = Field(None, example=1)
    paper_id: Optional[int] = Field(None, example=1)
    subtopic_id: Optional[int] = Field(None, example=2)
    num_questions: int = Field(10, ge=1, le=50, example=10)


class QuizQuestionOut(BaseModel):
    id: int
    topic_id: int
    subtopic_id: Optional[int] = None
    text: str
    options: List[str]
    difficulty: str
    board: Optional[str] = None
    class_name: Optional[str] = None
    subject: Optional[str] = None
    year: Optional[int] = None
    question_type: str = "mcq"
    source: Optional[str] = None

    model_config = {"from_attributes": True}


class QuizStartOut(BaseModel):
    attempt_id: int
    questions: List[QuizQuestionOut]
    exam_name: Optional[str] = None
    duration_minutes: int = 60
    server_started_at: Optional[str] = None
    deadline_at: Optional[str] = None
    remaining_seconds: Optional[int] = None
    total_marks: float = 0.0
    passing_percentage: float = 40.0
    negative_marking: float = 0.0
    video_recording_enabled: bool = True
    ai_proctoring_enabled: bool = True
    certificate_enabled: bool = True
    instructions: Optional[str] = None
    saved_answers: Dict[str, Optional[str]] = {}
    per_question_time: Dict[str, int] = {}
    question_status: Dict[str, str] = {}
    marked_for_review: List[int] = []


class QuizAttemptSummary(BaseModel):
    attempt_id: int
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    score: int = 0
    total_questions: int = 0
    passed: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class QuizAnswerIn(BaseModel):
    question_id: int
    selected_option: Optional[str] = None
    time_spent_seconds: int = Field(0, ge=0)


class QuizSubmit(BaseModel):
    attempt_id: int
    answers: List[QuizAnswerIn] = Field(..., min_length=1)
    submission_reason: Literal["manual", "timeout", "proctoring_auto_submit"] = "manual"


class QuizAutosave(BaseModel):
    attempt_id: int
    answers: List[QuizAnswerIn]
    current_question_id: Optional[int] = None
    question_status: Optional[Dict[str, str]] = None
    marked_for_review: Optional[List[int]] = None


class QuizAutosaveOut(BaseModel):
    attempt_id: int
    saved_at: datetime
    remaining_seconds: int
    is_submitted: bool


class QuizStatusOut(BaseModel):
    attempt_id: int
    is_submitted: bool
    remaining_seconds: int
    server_now: datetime
    deadline_at: Optional[datetime] = None
    saved_answers: Dict[str, Optional[str]] = {}
    per_question_time: Dict[str, int] = {}
    question_status: Dict[str, str] = {}
    marked_for_review: List[int] = []


class QuizResumeOut(BaseModel):
    attempt_id: int
    questions: List[QuizQuestionOut]
    is_submitted: bool
    exam_name: Optional[str] = None
    duration_minutes: int = 60
    server_started_at: Optional[str] = None
    deadline_at: Optional[str] = None
    remaining_seconds: int = 0
    total_marks: float = 0.0
    passing_percentage: float = 40.0
    negative_marking: float = 0.0
    video_recording_enabled: bool = True
    ai_proctoring_enabled: bool = True
    certificate_enabled: bool = True
    instructions: Optional[str] = None
    saved_answers: Dict[str, Optional[str]] = {}
    per_question_time: Dict[str, int] = {}
    question_status: Dict[str, str] = {}
    marked_for_review: List[int] = []


class QuestionResultItem(BaseModel):
    question_id: int
    selected_option: str
    correct_option: str
    is_correct: bool
    explanation: Optional[str] = None
    ai_explanation: Optional[str] = None


class QuizResult(BaseModel):
    score: int
    total: int
    passed: bool
    percentage: float
    completed_at: str
    participation_certificate: Optional[CertificateOut] = None
    achievement_certificate: Optional[CertificateOut] = None
    results: List[QuestionResultItem]
    total_marks: float = 0.0
    raw_score: float = 0.0
    passing_percentage: float = 40.0
    submission_reason: str = "manual"
    adaptive_recommendation: Optional[dict] = None
    weak_topics: List[str] = []
    remedial_plan: List[str] = []
    gap_analysis: Optional[str] = None
    learning_resources: List[str] = []
    reattempt_recommended: bool = False
    reattempt_available: bool = True
    subtopic_certifications_awarded: int = 0
    portfolio_updated: bool = False
    next_difficulty_unlocked: Optional[str] = None
