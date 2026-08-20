from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import relationship

from backend.database import Base

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=True)
    certificate_type = Column(String(50), nullable=False, default="participation")  # 'participation' or 'achievement'
    score = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    verification_token = Column(String(255), unique=True, nullable=True)
    is_paid = Column(Boolean, default=False)  # Whether certificate was paid for
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User")
    topic = relationship("Topic")
    attempt = relationship("Attempt")
