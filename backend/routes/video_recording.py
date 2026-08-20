from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models.user import User
from backend.schemas.video_recording import (
    VideoRecordingCreate,
    VideoRecordingOut,
    VideoRecordingStart,
    VideoRecordingStop,
    VideoRecordingUpload,
)
from backend.services.video_service import video_service
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/video-recordings", tags=["Video Recordings"])


@router.post(
    "/start",
    response_model=VideoRecordingOut,
    status_code=status.HTTP_201_CREATED,
    summary="Start video recording for an assessment"
)
def start_recording(
    data: VideoRecordingStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize a new video recording when assessment begins."""
    try:
        recording = video_service.create_recording(
            db=db,
            attempt_id=data.attempt_id,
            user_id=current_user.id,
            recording_type=data.recording_type,
            resolution=data.resolution,
            frame_rate=data.frame_rate
        )
        return recording
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/stop",
    response_model=VideoRecordingOut,
    summary="Stop video recording"
)
def stop_recording(
    data: VideoRecordingStop,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stop recording when assessment is submitted."""
    try:
        recording = video_service.stop_recording(
            db=db,
            attempt_id=data.attempt_id,
            user_id=current_user.id,
            duration_seconds=data.duration_seconds,
            file_size_bytes=data.file_size_bytes
        )
        return recording
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/complete",
    response_model=VideoRecordingOut,
    summary="Mark recording as completed after upload"
)
def complete_recording(
    data: VideoRecordingUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark recording as completed after processing and upload."""
    try:
        recording = video_service.complete_recording(
            db=db,
            recording_id=data.recording_id,
            cloud_storage_url=data.cloud_storage_url
        )
        return recording
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/attempt/{attempt_id}",
    response_model=VideoRecordingOut,
    summary="Get recording for an attempt"
)
def get_attempt_recording(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve video recording for a specific attempt."""
    recording = video_service.get_recording_by_attempt(
        db=db,
        attempt_id=attempt_id,
        user_id=current_user.id
    )
    if not recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found"
        )
    return recording


@router.get(
    "/my-recordings",
    response_model=List[VideoRecordingOut],
    summary="Get all user recordings"
)
def get_my_recordings(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all video recordings for the authenticated user."""
    recordings = video_service.get_user_recordings(
        db=db,
        user_id=current_user.id,
        limit=limit
    )
    return recordings


@router.delete(
    "/{recording_id}",
    summary="Delete a recording"
)
def delete_recording(
    recording_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a video recording (soft delete)."""
    from backend.models.video_recording import VideoRecording
    
    recording = db.query(VideoRecording).filter(
        VideoRecording.id == recording_id,
        VideoRecording.user_id == current_user.id
    ).first()
    
    if not recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found"
        )
    
    # Mark as expired for cleanup
    recording.expires_at = None  # Immediate deletion
    db.commit()
    
    return {"message": "Recording marked for deletion"}
