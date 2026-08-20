from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

PASS_DIFFICULTIES = {"easy", "medium", "hard"}


class QuestionOption(BaseModel):
    id: str
    text: str


class SubtopicOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class TopicWithSubtopics(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    subtopics: List[SubtopicOut] = []
    question_count: int = 0
    subject: Optional[str] = None
    duration: Optional[int] = None
    total_questions: Optional[int] = None
    amount_inr: Optional[float] = None
    is_paid: Optional[bool] = None
    passing_score: Optional[float] = None

    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    id: int
    topic_id: int
    subtopic_id: Optional[int] = None
    text: str
    options: List[QuestionOption]
    difficulty: str
    board: Optional[str] = None
    class_name: Optional[str] = None
    subject: Optional[str] = None
    year: Optional[int] = None
    question_type: str = "mcq"
    source: Optional[str] = None

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    topic_id: int
    subtopic_id: Optional[int] = None
    text: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_option: Literal["A", "B", "C", "D"]
    explanation: Optional[str] = None
    difficulty: str = "medium"
    board: Optional[str] = None
    class_name: Optional[str] = None
    subject: Optional[str] = None
    year: Optional[int] = None
    question_type: str = "mcq"
    source: Optional[str] = None
    tags: Optional[List[str]] = None
    meta_data: Optional[dict] = None

    @field_validator("options")
    @classmethod
    def validate_options_count(cls, v: List[str]) -> List[str]:
        if len(v) != 4:
            raise ValueError("options must contain exactly 4 items")
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        if v not in PASS_DIFFICULTIES:
            raise ValueError("difficulty must be easy, medium, or hard")
        return v


class QuestionCreated(BaseModel):
    id: int
    topic_id: int
    subtopic_id: Optional[int] = None
    text: str
    options: List[str]
    correct_option: str
    explanation: Optional[str] = None
    difficulty: str
    board: Optional[str] = None
    class_name: Optional[str] = None
    subject: Optional[str] = None
    year: Optional[int] = None
    question_type: str
    source: Optional[str] = None

    model_config = {"from_attributes": True}
