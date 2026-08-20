from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.database import Base


class ProctorLog(Base):
    __tablename__ = "proctor_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    event_type = Column(String, nullable=False)
    event_description = Column(String, nullable=False, default="")
    severity = Column(String, nullable=False, default="warning")
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)

    attempt = relationship("Attempt", back_populates="proctor_logs")
    user = relationship("User")
