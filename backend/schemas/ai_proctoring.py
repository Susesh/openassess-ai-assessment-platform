from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AIViolationBase(BaseModel):
    violation_type: str = Field(..., description="Type of violation detected")
    severity: str = Field(..., description="Severity level: low, medium, high, critical")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class AIViolationCreate(AIViolationBase):
    attempt_id: int
    violation_data: Optional[Dict[str, Any]] = None
    question_id: Optional[int] = None
    session_time_seconds: Optional[int] = None


class AIViolationOut(BaseModel):
    id: int
    attempt_id: int
    user_id: int
    violation_type: str
    severity: str
    confidence_score: Optional[float]
    detection_timestamp: datetime
    frame_timestamp: Optional[float]
    screenshot_path: Optional[str]
    violation_data: Optional[Dict[str, Any]]
    question_id: Optional[int]
    session_time_seconds: Optional[int]
    is_resolved: bool
    resolved_by: Optional[str]
    resolution_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProctoringSessionBase(BaseModel):
    eye_tracking_enabled: bool = True
    audio_enabled: bool = True


class ProctoringSessionCreate(ProctoringSessionBase):
    attempt_id: int


class ProctoringSessionOut(BaseModel):
    id: int
    attempt_id: int
    user_id: int
    status: str
    started_at: datetime
    ended_at: Optional[datetime]
    integrity_score: float
    violation_count: int
    high_severity_count: int
    critical_severity_count: int
    face_detected_count: int
    face_not_detected_count: int
    multiple_face_detected_count: int
    eye_tracking_enabled: bool
    eye_movement_violations: int
    head_pose_violations: int
    audio_enabled: bool
    audio_violations: int
    tab_switch_count: int
    fullscreen_exit_count: int
    copy_paste_count: int
    phone_detected_count: int
    is_flagged: bool
    flag_reason: Optional[str]
    auto_submit_triggered: bool
    proctoring_version: str
    ai_models_used: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EnvironmentViolationCreate(BaseModel):
    attempt_id: int
    violation_type: str = Field(..., description="tab_switch, fullscreen_exit, copy_paste, phone_detected")
    session_time_seconds: int


class FrameAnalysisResult(BaseModel):
    face_count: int
    violations_detected: int
    violations: List[Dict[str, Any]]


class ProctoringSummary(BaseModel):
    session: ProctoringSessionOut
    violations: List[AIViolationOut]
    integrity_score: float
    is_flagged: bool
    should_auto_submit: bool
