from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship

from backend.database import Base


class Notification(Base):
    """User notifications for sessions, reminders, and updates."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    type = Column(String, nullable=False)  # session_scheduled, session_reminder, session_cancelled, tutor_available, etc.
    title = Column(String, nullable=False)
    body = Column(String, nullable=True)
    data = Column(JSON, nullable=True)  # Additional data like session_id, tutor_id, etc.
    
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

    @property
    def is_read(self) -> bool:
        return self.read_at is not None
