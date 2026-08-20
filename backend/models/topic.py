from sqlalchemy import Column, ForeignKey, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship

from backend.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    subject = Column(String, nullable=True)  # e.g., "Mathematics", "Science", "Programming"
    duration = Column(Integer, nullable=True)  # Duration in minutes
    total_questions = Column(Integer, default=0)  # Number of questions in quiz
    passing_score = Column(Float, default=40.0)  # Percentage needed to pass

    subtopics = relationship("Subtopic", back_populates="topic", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="topic")
    attempts = relationship("Attempt", back_populates="topic")
    certifications = relationship("Certification", back_populates="topic")
    certificates = relationship("Certificate", back_populates="topic")
    subtopic_certifications = relationship("SubtopicCertification", back_populates="topic")


class Subtopic(Base):
    __tablename__ = "subtopics"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    topic = relationship("Topic", back_populates="subtopics")
    questions = relationship("Question", back_populates="subtopic")
    certifications = relationship("SubtopicCertification", back_populates="subtopic")
