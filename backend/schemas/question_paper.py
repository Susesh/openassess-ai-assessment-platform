from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


SUPPORTED_EXAM_CATEGORIES = {
    "CBSE",
    "ICSE",
    "State Board",
    "IIT-JEE",
    "NEET",
    "UPSC",
    "University Exams",
    "Custom Assessments",
}

SUPPORTED_QUESTION_TYPES = {
    "mcq",
    "multiple_select",
    "true_false",
    "short_answer",
    "long_answer",
    "numerical",
    "assertion_reason",
    "case_study",
    "essay",
}


class QuestionPaperQuestionBase(BaseModel):
    question_number: int = Field(..., gt=0)
    question_id: int = Field(..., gt=0)
    topic_id: Optional[int] = Field(None, gt=0)
    subtopic_id: Optional[int] = Field(None, gt=0)
    question_type: str = "mcq"
    difficulty: str = "medium"
    marks: int = Field(1, ge=1)
    question_text_snapshot: Optional[str] = None
    options_snapshot: Optional[List[str]] = None
    correct_option_snapshot: Optional[str] = None
    explanation_snapshot: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None

    @field_validator("question_type")
    @classmethod
    def validate_question_type(cls, value: str) -> str:
        if value not in SUPPORTED_QUESTION_TYPES:
            raise ValueError("Unsupported question_type")
        return value


class QuestionPaperQuestionCreate(QuestionPaperQuestionBase):
    pass


class QuestionPaperQuestionOut(QuestionPaperQuestionBase):
    id: int

    model_config = {"from_attributes": True}


class QuestionPaperBase(BaseModel):
    exam_category: str
    board: str
    exam_name: str
    year: int = Field(..., ge=1900, le=2100)
    academic_year: Optional[str] = None
    class_name: Optional[str] = None
    subject: str
    topic_name: Optional[str] = None
    subtopic_name: Optional[str] = None
    question_type: Optional[str] = None
    difficulty: Optional[str] = None
    language: str = "en"
    total_marks: int = Field(0, ge=0)
    pdf_url: Optional[str] = None
    answer_key_url: Optional[str] = None
    source: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None
    is_published: bool = False

    @field_validator("exam_category")
    @classmethod
    def validate_exam_category(cls, value: str) -> str:
        if value not in SUPPORTED_EXAM_CATEGORIES:
            raise ValueError("Unsupported exam category")
        return value


class QuestionPaperCreate(QuestionPaperBase):
    questions: List[QuestionPaperQuestionCreate] = Field(default_factory=list)


class QuestionPaperUpdate(BaseModel):
    exam_category: Optional[str] = None
    board: Optional[str] = None
    exam_name: Optional[str] = None
    year: Optional[int] = Field(None, ge=1900, le=2100)
    academic_year: Optional[str] = None
    class_name: Optional[str] = None
    subject: Optional[str] = None
    topic_name: Optional[str] = None
    subtopic_name: Optional[str] = None
    question_type: Optional[str] = None
    difficulty: Optional[str] = None
    language: Optional[str] = None
    total_marks: Optional[int] = Field(None, ge=0)
    pdf_url: Optional[str] = None
    answer_key_url: Optional[str] = None
    source: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None
    is_published: Optional[bool] = None


class QuestionPaperSummary(BaseModel):
    id: int
    exam_category: str
    board: str
    exam_name: str
    year: int
    academic_year: Optional[str] = None
    class_name: Optional[str] = None
    subject: str
    topic_name: Optional[str] = None
    subtopic_name: Optional[str] = None
    question_type: Optional[str] = None
    difficulty: Optional[str] = None
    language: str
    total_questions: int
    total_marks: int
    pdf_url: Optional[str] = None
    answer_key_url: Optional[str] = None
    source: Optional[str] = None
    is_published: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class QuestionPaperOut(QuestionPaperSummary):
    meta_data: Optional[Dict[str, Any]] = None
    questions: List[QuestionPaperQuestionOut] = Field(default_factory=list)


class QuestionPaperListOut(BaseModel):
    items: List[QuestionPaperSummary]
    total: int


class QuestionPaperImportPayload(BaseModel):
    paper: QuestionPaperCreate


class ExamModuleRuleSet(BaseModel):
    minimum_duration_minutes: int = 60
    default_duration_minutes: int = 60
    minimum_question_count: int = 60
    randomized_question_order: bool = True
    auto_save_answers: bool = True
    resume_assessment: bool = True
    fullscreen_required: bool = True
    timer_required: bool = True
    auto_submit_on_timeout: bool = True
    video_recording_integration: bool = True
    ai_proctoring_integration: bool = True


class ExamModuleSummary(BaseModel):
    exam_category: str
    slug: str
    display_name: str
    description: str
    instructions: list[str]
    rules: ExamModuleRuleSet
    total_papers: int
    published_papers: int
    years: list[int]
    subjects: list[str]
    topics: list[str]


class ExamModuleDetail(ExamModuleSummary):
    papers: list[QuestionPaperSummary]


class ExamModuleListOut(BaseModel):
    items: list[ExamModuleSummary]
    total: int