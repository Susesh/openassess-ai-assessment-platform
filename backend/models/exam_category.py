from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String

from backend.database import Base


class ExamCategory(Base):
    __tablename__ = "exam_categories"

    id = Column(String, primary_key=True)
    display_name = Column(String, nullable=False, unique=True, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
