from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field

EventType = Literal[
    "camera_disconnected",
    "face_not_detected",
    "multiple_faces_detected",
    "tab_switch",
    "browser_minimized",
    "fullscreen_exit",
    "copy_paste_attempt",
    "right_click_attempt",
    "devtools_attempt",
]

SeverityType = Literal["info", "warning", "critical"]


class ProctorLogCreate(BaseModel):
    attempt_id: int = Field(..., example=1)
    event_type: EventType = Field(..., example="tab_switch")
    event_description: str = Field(..., example="User switched browser tab during assessment")
    severity: SeverityType = Field(default="warning", example="warning")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ProctorLogOut(BaseModel):
    id: int
    user_id: int
    attempt_id: int
    event_type: str
    event_description: str
    severity: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class ProctorLogSuccess(BaseModel):
    message: str = Field(default="logged successfully")
    log_id: int
    warning_count: int
    should_auto_submit: bool


class ProctorReportOut(BaseModel):
    attempt_id: int
    total_events: int
    warning_count: int
    risk_level: Literal["low", "medium", "high"]
    events: List[ProctorLogOut]


class AdminProctoringReportItem(BaseModel):
    assessment_id: int
    student_name: str
    violation_count: int
    risk_level: Literal["low", "medium", "high"]
    proctoring_report: ProctorReportOut


class AdminProctoringReportResponse(BaseModel):
    reports: List[AdminProctoringReportItem]
