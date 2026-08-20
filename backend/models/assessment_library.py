from datetime import datetime
from sqlalchemy import Column, DateTime, String, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from backend.database import Base


class Board(Base):
    """Educational boards (CBSE, ICSE, State Boards, etc.)."""
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)  # e.g., "CBSE", "ICSE"
    code = Column(String, nullable=False, unique=True)  # e.g., "CBSE", "KA_STATE"
    board_type = Column(String, nullable=False)  # 'national', 'state', 'international', 'competitive', 'university'
    description = Column(Text, nullable=True)
    country = Column(String, nullable=True)  # e.g., "India", "USA"
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    classes = relationship("ClassLevel", back_populates="board", cascade="all, delete-orphan")


class ClassLevel(Base):
    """Class/Grade levels within a board."""
    __tablename__ = "class_levels"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Class 10", "Grade 12", "Year 1"
    grade_level = Column(Integer, nullable=True)  # Numeric grade for sorting (e.g., 10, 12)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    board = relationship("Board", back_populates="classes")
    subjects = relationship("Subject", back_populates="class_level", cascade="all, delete-orphan")


class Subject(Base):
    """Subjects within a class level."""
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("class_levels.id"), nullable=False)
    name = Column(String, nullable=False, index=True)  # e.g., "Mathematics", "Physics"
    code = Column(String, nullable=True)  # e.g., "MATH", "PHY"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    class_level = relationship("ClassLevel", back_populates="subjects")
    topics = relationship("LibraryTopic", back_populates="subject", cascade="all, delete-orphan")


class LibraryTopic(Base):
    """Topics within a subject (expanded from current Topic model)."""
    __tablename__ = "library_topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    parent_topic_id = Column(Integer, ForeignKey("library_topics.id"), nullable=True)  # For hierarchical topics
    
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    chapter_number = Column(Integer, nullable=True)  # For ordered curriculum
    
    # Metadata
    difficulty_level = Column(String, nullable=True)  # 'beginner', 'intermediate', 'advanced'
    estimated_hours = Column(Integer, nullable=True)  # Estimated learning time
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="topics")
    parent = relationship("LibraryTopic", remote_side=[id], back_populates="subtopics")
    subtopics = relationship("LibraryTopic", back_populates="parent")
    library_questions = relationship("LibraryQuestion", back_populates="topic", cascade="all, delete-orphan")


class LibraryQuestion(Base):
    """Questions in the assessment library with full metadata."""
    __tablename__ = "library_questions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("library_topics.id"), nullable=False)
    
    # Question content
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)  # 'mcq', 'true_false', 'short_answer', 'essay'
    options = Column(Text, nullable=True)  # JSON string for MCQ options
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    
    # Metadata
    difficulty = Column(String, nullable=False, index=True)  # 'easy', 'medium', 'hard'
    marks = Column(Integer, default=1)
    time_limit_seconds = Column(Integer, nullable=True)
    
    # Source information
    year = Column(Integer, nullable=True)  # Exam year
    paper_code = Column(String, nullable=True)  # e.g., "2023_CBSE_10_041_2_3"
    source = Column(String, nullable=True)  # e.g., "CBSE Board Exam", "JEE Main"
    
    # Tags and classification
    tags = Column(Text, nullable=True)  # JSON array of tags
    concepts = Column(Text, nullable=True)  # JSON array of concepts covered
    
    # Quality control
    is_verified = Column(Boolean, default=False)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verification_date = Column(DateTime, nullable=True)
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    topic = relationship("LibraryTopic", back_populates="library_questions")
