import os
import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from backend.models.video_recording import VideoRecording
from backend.models.attempt import Attempt


class VideoRecordingService:
    """Service for managing assessment video recordings."""
    
    def __init__(self, storage_path: str = "recordings"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
    
    def create_recording(
        self,
        db: Session,
        attempt_id: int,
        user_id: int,
        recording_type: str = "camera",
        resolution: str = "1280x720",
        frame_rate: int = 30
    ) -> VideoRecording:
        """Create a new video recording entry."""
        
        # Verify attempt exists and belongs to user
        attempt = db.query(Attempt).filter(
            Attempt.id == attempt_id,
            Attempt.user_id == user_id
        ).first()
        
        if not attempt:
            raise ValueError("Attempt not found or access denied")
        
        # Check if recording already exists
        existing = db.query(VideoRecording).filter(
            VideoRecording.attempt_id == attempt_id
        ).first()
        
        if existing:
            raise ValueError("Recording already exists for this attempt")
        
        # Generate unique recording ID
        recording_id = str(uuid.uuid4())
        file_path = os.path.join(self.storage_path, f"{recording_id}.webm")
        
        recording = VideoRecording(
            attempt_id=attempt_id,
            user_id=user_id,
            recording_type=recording_type,
            file_path=file_path,
            status="recording",
            started_at=datetime.utcnow(),
            resolution=resolution,
            frame_rate=frame_rate
        )
        
        db.add(recording)
        db.commit()
        db.refresh(recording)
        
        return recording
    
    def stop_recording(
        self,
        db: Session,
        attempt_id: int,
        user_id: int,
        duration_seconds: float,
        file_size_bytes: Optional[int] = None
    ) -> VideoRecording:
        """Stop a video recording and update metadata."""
        
        recording = db.query(VideoRecording).filter(
            VideoRecording.attempt_id == attempt_id,
            VideoRecording.user_id == user_id
        ).first()
        
        if not recording:
            raise ValueError("Recording not found")
        
        recording.status = "processing"
        recording.stopped_at = datetime.utcnow()
        recording.duration_seconds = duration_seconds
        if file_size_bytes:
            recording.file_size_bytes = file_size_bytes
        
        db.commit()
        db.refresh(recording)
        
        return recording
    
    def complete_recording(
        self,
        db: Session,
        recording_id: int,
        cloud_storage_url: Optional[str] = None,
        thumbnail_url: Optional[str] = None
    ) -> VideoRecording:
        """Mark recording as completed after processing."""
        
        recording = db.query(VideoRecording).filter(
            VideoRecording.id == recording_id
        ).first()
        
        if not recording:
            raise ValueError("Recording not found")
        
        recording.status = "completed"
        recording.uploaded_at = datetime.utcnow()
        if cloud_storage_url:
            recording.cloud_storage_url = cloud_storage_url
        if thumbnail_url:
            recording.thumbnail_url = thumbnail_url
        
        # Set expiration to 90 days from now
        recording.expires_at = datetime.utcnow() + timedelta(days=90)
        
        db.commit()
        db.refresh(recording)
        
        return recording
    
    def fail_recording(
        self,
        db: Session,
        recording_id: int,
        error_message: str
    ) -> VideoRecording:
        """Mark recording as failed."""
        
        recording = db.query(VideoRecording).filter(
            VideoRecording.id == recording_id
        ).first()
        
        if not recording:
            raise ValueError("Recording not found")
        
        recording.status = "failed"
        recording.processing_error = error_message
        recording.stopped_at = datetime.utcnow()
        
        db.commit()
        db.refresh(recording)
        
        return recording
    
    def get_recording_by_attempt(
        self,
        db: Session,
        attempt_id: int,
        user_id: int
    ) -> Optional[VideoRecording]:
        """Get recording for a specific attempt."""
        return db.query(VideoRecording).filter(
            VideoRecording.attempt_id == attempt_id,
            VideoRecording.user_id == user_id
        ).first()
    
    def get_user_recordings(
        self,
        db: Session,
        user_id: int,
        limit: int = 50
    ) -> list[VideoRecording]:
        """Get all recordings for a user."""
        return db.query(VideoRecording).filter(
            VideoRecording.user_id == user_id
        ).order_by(VideoRecording.created_at.desc()).limit(limit).all()
    
    def cleanup_expired_recordings(self, db: Session) -> int:
        """Delete expired recordings from database."""
        now = datetime.utcnow()
        expired = db.query(VideoRecording).filter(
            VideoRecording.expires_at < now
        ).all()
        
        count = len(expired)
        for recording in expired:
            # Delete file if exists locally
            if recording.file_path and os.path.exists(recording.file_path):
                try:
                    os.remove(recording.file_path)
                except OSError:
                    pass
            db.delete(recording)
        
        db.commit()
        return count


# Global service instance
video_service = VideoRecordingService()
