from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from backend.database import Base


class QuestionPaper(Base):
    __tablename__ = "question_papers"

    id = Column(Integer, primary_key=True, index=True)
    exam_category = Column(String, nullable=False, index=True)
    board = Column(String, nullable=False, index=True)
    exam_name = Column(String, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    academic_year = Column(String, nullable=True)
    class_name = Column(String, nullable=True, index=True)
    subject = Column(String, nullable=False, index=True)
    topic_name = Column(String, nullable=True, index=True)
    subtopic_name = Column(String, nullable=True, index=True)
    question_type = Column(String, nullable=True, index=True)
    difficulty = Column(String, nullable=True, index=True)
    language = Column(String, nullable=False, default="en")
    total_questions = Column(Integer, nullable=False, default=0)
    total_marks = Column(Integer, nullable=False, default=0)
    pdf_url = Column(Text, nullable=True)
    answer_key_url = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    meta_data = Column(JSON, nullable=True)
    is_published = Column(Boolean, nullable=False, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    questions = relationship(
        "QuestionPaperQuestion",
        back_populates="paper",
        cascade="all, delete-orphan",
        order_by="QuestionPaperQuestion.question_number",
    )


class QuestionPaperQuestion(Base):
    __tablename__ = "question_paper_questions"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    question_number = Column(Integer, nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True, index=True)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=True, index=True)
    question_type = Column(String, nullable=False, default="mcq")
    difficulty = Column(String, nullable=False, default="medium", index=True)
    marks = Column(Integer, nullable=False, default=1)
    question_text_snapshot = Column(Text, nullable=True)
    options_snapshot = Column(JSON, nullable=True)
    correct_option_snapshot = Column(String, nullable=True)
    explanation_snapshot = Column(Text, nullable=True)
    meta_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    paper = relationship("QuestionPaper", back_populates="questions")
    question = relationship("Question", back_populates="paper_items")
    topic = relationship("Topic")
    subtopic = relationship("Subtopic")