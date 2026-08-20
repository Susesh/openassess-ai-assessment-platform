from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.database import Base


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Float, nullable=False)
    certificate_code = Column(String, unique=True, nullable=False)

    user = relationship("User", back_populates="certifications")
    topic = relationship("Topic", back_populates="certifications")
