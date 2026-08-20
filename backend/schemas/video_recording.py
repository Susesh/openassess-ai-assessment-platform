from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VideoRecordingBase(BaseModel):
    recording_type: str = Field(..., description="Type of recording: camera, screen, or combined")
    status: str = Field(default="pending", description="Recording status")


class VideoRecordingCreate(VideoRecordingBase):
    attempt_id: int = Field(..., description="Associated attempt ID")


class VideoRecordingUpdate(BaseModel):
    status: Optional[str] = None
    file_path: Optional[str] = None
    cloud_storage_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    duration_seconds: Optional[float] = None
    started_at: Optional[datetime] = None
    stopped_at: Optional[datetime] = None
    uploaded_at: Optional[datetime] = None
    resolution: Optional[str] = None
    frame_rate: Optional[int] = None
    bitrate_kbps: Optional[int] = None
    processing_error: Optional[str] = None
    thumbnail_url: Optional[str] = None


class VideoRecordingOut(BaseModel):
    id: int
    attempt_id: int
    user_id: int
    recording_type: str
    file_path: Optional[str]
    cloud_storage_url: Optional[str]
    file_size_bytes: Optional[int]
    duration_seconds: Optional[float]
    status: str
    started_at: Optional[datetime]
    stopped_at: Optional[datetime]
    uploaded_at: Optional[datetime]
    resolution: Optional[str]
    frame_rate: Optional[int]
    bitrate_kbps: Optional[int]
    processing_error: Optional[str]
    thumbnail_url: Optional[str]
    is_public: bool
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VideoRecordingStart(BaseModel):
    attempt_id: int
    recording_type: str = Field(default="camera", description="camera, screen, or combined")
    resolution: Optional[str] = Field(default="1280x720", description="Video resolution")
    frame_rate: Optional[int] = Field(default=30, description="Frame rate")


class VideoRecordingStop(BaseModel):
    attempt_id: int
    duration_seconds: Optional[float] = None
    file_size_bytes: Optional[int] = None


class VideoRecordingUpload(BaseModel):
    recording_id: int
    file_path: str
    cloud_storage_url: Optional[str] = None
    file_size_bytes: int
    duration_seconds: float
    resolution: Optional[str] = None
    frame_rate: Optional[int] = None
