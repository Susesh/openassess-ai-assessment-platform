from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class TutorProfileOut(BaseModel):
    id: int
    user_id: int
    name: str
    bio: Optional[str] = None
    hourly_rate: int
    subjects: List[str] = Field(default_factory=list)
    rating: int
    total_sessions: int = 0
    is_active: bool

    @validator("subjects", pre=True, always=True)
    def normalize_subjects(cls, value):
        return value or []

    class Config:
        from_attributes = True


class TutorAvailabilityCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str


class TutorAvailabilityOut(TutorAvailabilityCreate):
    id: int
    tutor_id: int
    is_booked: bool

    class Config:
        from_attributes = True


class TutorSessionBook(BaseModel):
    tutor_id: int
    scheduled_at: datetime
    duration_minutes: int = 60


class TutorSessionOut(BaseModel):
    id: int
    tutor_id: int
    student_id: int
    scheduled_at: datetime
    duration_minutes: int
    status: str
    meeting_link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
