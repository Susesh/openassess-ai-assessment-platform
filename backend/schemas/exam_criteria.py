from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


BoardName = Literal[
    "CBSE",
    "ICSE",
    "State Board",
    "IIT-JEE",
    "NEET",
    "UPSC",
    "University",
    "Custom",
]

DifficultyName = Literal["easy", "medium", "hard", "adaptive"]


class ExamCriteriaBase(BaseModel):
    exam_name: str = Field(..., min_length=3, max_length=200)
    board: BoardName = "Custom"
    subject: str = Field(..., min_length=1, max_length=120)
    topic_id: int = Field(..., gt=0)
    subtopic_id: Optional[int] = Field(None, gt=0)
    difficulty: DifficultyName = "adaptive"
    total_questions: int = Field(10, ge=1, le=50)
    total_marks: float = Field(10.0, gt=0)
    passing_percentage: float = Field(40.0, ge=0, le=100)
    negative_marking: float = Field(0.0, ge=0)
    maximum_attempts: int = Field(0, ge=0, description="0 means unlimited attempts")
    duration_minutes: int = Field(60, ge=60)
    video_recording_enabled: bool = True
    ai_proctoring_enabled: bool = True
    certificate_enabled: bool = True
    instructions: Optional[str] = None
    is_active: bool = True

    @field_validator("difficulty")
    @classmethod
    def normalize_difficulty(cls, value: str) -> str:
        return value.lower()


class ExamCriteriaCreate(ExamCriteriaBase):
    pass


class ExamCriteriaUpdate(BaseModel):
    exam_name: Optional[str] = Field(None, min_length=3, max_length=200)
    board: Optional[BoardName] = None
    subject: Optional[str] = Field(None, min_length=1, max_length=120)
    topic_id: Optional[int] = Field(None, gt=0)
    subtopic_id: Optional[int] = Field(None, gt=0)
    difficulty: Optional[DifficultyName] = None
    total_questions: Optional[int] = Field(None, ge=1, le=50)
    total_marks: Optional[float] = Field(None, gt=0)
    passing_percentage: Optional[float] = Field(None, ge=0, le=100)
    negative_marking: Optional[float] = Field(None, ge=0)
    maximum_attempts: Optional[int] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=60)
    video_recording_enabled: Optional[bool] = None
    ai_proctoring_enabled: Optional[bool] = None
    certificate_enabled: Optional[bool] = None
    instructions: Optional[str] = None
    is_active: Optional[bool] = None


class ExamCriteriaOut(ExamCriteriaBase):
    id: int
    topic_name: Optional[str] = None
    subtopic_name: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExamCriteriaListOut(BaseModel):
    items: list[ExamCriteriaOut]
    total: int
