from sqlalchemy import Column, ForeignKey, Integer, JSON, String, Text, Float
from sqlalchemy.orm import relationship

from backend.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=True)
    
    # Question content
    text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False, default="mcq")  # mcq, multiple_select, true_false, fill_in_blank, numerical, short_answer, long_answer, assertion_reason, case_study
    options = Column(JSON, nullable=True)  # For MCQ, multiple-select, true/false
    correct_option = Column(String, nullable=True)  # For MCQ, multiple-select, true_false, fill_in_blank, numerical
    correct_options = Column(JSON, nullable=True)  # For multiple-select (array of correct options)
    explanation = Column(Text, nullable=True)
    
    # Difficulty and metadata
    difficulty = Column(String, default="medium")  # easy / medium / hard
    exam_module = Column(String, nullable=True)  # CBSE, NEET, JEE, Standard, etc.
    
    # IRT parameters for adaptive difficulty
    irt_difficulty = Column(Float, default=0.0)  # IRT b-parameter (difficulty)
    irt_discrimination = Column(Float, default=1.0)  # IRT a-parameter (discrimination)
    irt_guessing = Column(Float, default=0.25)  # IRT c-parameter (guessing)
    
    # Assessment Library metadata
    board = Column(String, nullable=True)
    class_name = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    source = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)
    meta_data = Column(JSON, nullable=True)
    
    # Question-specific fields
    marks = Column(Float, default=1.0)
    time_limit_seconds = Column(Integer, nullable=True)
    case_study_text = Column(Text, nullable=True)  # For case study questions
    assertion_statement = Column(Text, nullable=True)  # For assertion-reason questions
    reason_statement = Column(Text, nullable=True)  # For assertion-reason questions

    topic = relationship("Topic", back_populates="questions")
    subtopic = relationship("Subtopic", back_populates="questions")
    paper_items = relationship("QuestionPaperQuestion", back_populates="question")
    results = relationship("Result", back_populates="question")
