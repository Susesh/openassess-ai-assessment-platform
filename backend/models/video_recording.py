from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import relationship

from backend.database import Base


class VideoRecording(Base):
    """Stores assessment session recordings for proctoring and review."""
    __tablename__ = "video_recordings"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Recording metadata
    recording_type = Column(String, nullable=False)  # 'camera', 'screen', 'combined'
    file_path = Column(String, nullable=True)  # Local storage path
    cloud_storage_url = Column(String, nullable=True)  # GCS/AWS S3 URL
    file_size_bytes = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    
    # Recording status
    status = Column(String, default="pending")  # 'pending', 'recording', 'processing', 'completed', 'failed'
    started_at = Column(DateTime, nullable=True)
    stopped_at = Column(DateTime, nullable=True)
    uploaded_at = Column(DateTime, nullable=True)
    
    # Quality metrics
    resolution = Column(String, nullable=True)  # e.g., '1280x720'
    frame_rate = Column(Integer, nullable=True)  # e.g., 30
    bitrate_kbps = Column(Integer, nullable=True)
    
    # Processing info
    processing_error = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    
    # Access control
    is_public = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attempt = relationship("Attempt", back_populates="video_recording")
    user = relationship("User", back_populates="video_recordings")
