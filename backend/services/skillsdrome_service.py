"""
SkillsDrome Integration Service

This service provides the architecture for integrating with SkillsDrome (or similar tutoring platforms).
It includes:
- Abstract interface for tutoring platforms
- SkillsDrome-specific implementation (when API credentials are provided)
- Fallback to local tutor management
- Session synchronization
- Calendar integration hooks
"""

import os
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import httpx

from backend.models.tutor import TutorProfile, TutorAvailability, TutorSession
from backend.models.user import User


class TutoringPlatformInterface:
    """Abstract interface for tutoring platform integrations."""
    
    def create_session(
        self,
        tutor_id: str,
        student_id: str,
        scheduled_at: datetime,
        duration_minutes: int
    ) -> Dict:
        """Create a tutoring session on the platform."""
        raise NotImplementedError
    
    def cancel_session(self, session_id: str) -> bool:
        """Cancel a tutoring session."""
        raise NotImplementedError
    
    def get_availability(
        self,
        tutor_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Get tutor availability from the platform."""
        raise NotImplementedError
    
    def sync_tutor_profile(self, tutor_data: Dict) -> bool:
        """Sync tutor profile with the platform."""
        raise NotImplementedError


class SkillsDromeService(TutoringPlatformInterface):
    """SkillsDrome platform integration service."""
    
    def __init__(self):
        self.api_key = os.getenv("SKILLSDROME_API_KEY")
        self.api_url = os.getenv("SKILLSDROME_API_URL", "https://api.skillsdrome.com/v1")
        self.enabled = bool(self.api_key)
    
    async def create_session(
        self,
        tutor_id: str,
        student_id: str,
        scheduled_at: datetime,
        duration_minutes: int
    ) -> Dict:
        """Create a tutoring session on SkillsDrome."""
        if not self.enabled:
            raise ValueError("SkillsDrome integration is not enabled")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/sessions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "tutor_id": tutor_id,
                    "student_id": student_id,
                    "scheduled_at": scheduled_at.isoformat(),
                    "duration_minutes": duration_minutes
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def cancel_session(self, session_id: str) -> bool:
        """Cancel a tutoring session on SkillsDrome."""
        if not self.enabled:
            return False
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.api_url}/sessions/{session_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=30.0
            )
            return response.status_code == 200
    
    async def get_availability(
        self,
        tutor_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Get tutor availability from SkillsDrome."""
        if not self.enabled:
            return []
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_url}/tutors/{tutor_id}/availability",
                headers={"Authorization": f"Bearer {self.api_key}"},
                params={
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def sync_tutor_profile(self, tutor_data: Dict) -> bool:
        """Sync tutor profile with SkillsDrome."""
        if not self.enabled:
            return False
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/tutors/sync",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json=tutor_data,
                timeout=30.0
            )
            return response.status_code == 200


class LocalTutorService:
    """Fallback local tutor management when external platform is not available."""
    
    @staticmethod
    def create_session(
        db: Session,
        tutor_id: int,
        student_id: int,
        scheduled_at: datetime,
        duration_minutes: int = 60
    ) -> TutorSession:
        """Create a local tutoring session."""
        
        # Verify tutor exists and is available
        tutor = db.query(TutorProfile).filter(
            TutorProfile.id == tutor_id,
            TutorProfile.is_active == True
        ).first()
        
        if not tutor:
            raise ValueError("Tutor not found or inactive")
        
        # Check availability
        day_of_week = scheduled_at.weekday()
        time_str = scheduled_at.strftime("%H:%M")
        
        availability = db.query(TutorAvailability).filter(
            TutorAvailability.tutor_id == tutor_id,
            TutorAvailability.day_of_week == day_of_week,
            TutorAvailability.start_time <= time_str,
            TutorAvailability.end_time > time_str,
            TutorAvailability.is_booked == False
        ).first()
        
        if not availability:
            raise ValueError("Tutor not available at this time")
        
        # Create session
        session = TutorSession(
            tutor_id=tutor_id,
            student_id=student_id,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            status="scheduled",
            meeting_link=f"https://meet.openassess.com/session/{tutor_id}_{student_id}_{int(scheduled_at.timestamp())}"
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def cancel_session(db: Session, session_id: int, user_id: int) -> bool:
        """Cancel a local tutoring session."""
        
        session = db.query(TutorSession).filter(
            TutorSession.id == session_id,
            TutorSession.student_id == user_id
        ).first()
        
        if not session:
            raise ValueError("Session not found")
        
        if session.status != "scheduled":
            raise ValueError("Cannot cancel a completed or already cancelled session")
        
        session.status = "cancelled"
        db.commit()
        
        return True
    
    @staticmethod
    def get_tutor_availability(
        db: Session,
        tutor_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Get tutor availability for a date range."""
        
        availabilities = db.query(TutorAvailability).filter(
            TutorAvailability.tutor_id == tutor_id,
            TutorAvailability.is_booked == False
        ).all()
        
        result = []
        for avail in availabilities:
            # Generate time slots for this availability
            day_map = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
            
            result.append({
                "day_of_week": avail.day_of_week,
                "day_name": day_map.get(avail.day_of_week, "Unknown"),
                "start_time": avail.start_time,
                "end_time": avail.end_time,
                "is_booked": avail.is_booked
            })
        
        return result


class TutoringServiceManager:
    """Manager for tutoring service with fallback to local management."""
    
    def __init__(self):
        self.skillsdrome = SkillsDromeService()
        self.local = LocalTutorService()
        self.use_external = self.skillsdrome.enabled
    
    async def create_session(
        self,
        db: Session,
        tutor_id: int,
        student_id: int,
        scheduled_at: datetime,
        duration_minutes: int = 60,
        external_tutor_id: Optional[str] = None
    ) -> Dict:
        """Create a tutoring session using external platform or local fallback."""
        
        if self.use_external and external_tutor_id:
            # Use SkillsDrome
            student = db.query(User).filter(User.id == student_id).first()
            result = await self.skillsdrome.create_session(
                tutor_id=external_tutor_id,
                student_id=str(student_id),
                scheduled_at=scheduled_at,
                duration_minutes=duration_minutes
            )
            
            # Also create local record for tracking
            local_session = self.local.create_session(
                db=db,
                tutor_id=tutor_id,
                student_id=student_id,
                scheduled_at=scheduled_at,
                duration_minutes=duration_minutes
            )
            
            return {
                "external_session_id": result.get("id"),
                "local_session_id": local_session.id,
                "meeting_link": result.get("meeting_link", local_session.meeting_link),
                "platform": "skillsdrome"
            }
        else:
            # Use local management
            local_session = self.local.create_session(
                db=db,
                tutor_id=tutor_id,
                student_id=student_id,
                scheduled_at=scheduled_at,
                duration_minutes=duration_minutes
            )
            
            return {
                "local_session_id": local_session.id,
                "meeting_link": local_session.meeting_link,
                "platform": "local"
            }
    
    async def cancel_session(
        self,
        db: Session,
        session_id: int,
        user_id: int,
        external_session_id: Optional[str] = None
    ) -> bool:
        """Cancel a tutoring session."""
        
        if self.use_external and external_session_id:
            await self.skillsdrome.cancel_session(external_session_id)
        
        return self.local.cancel_session(db, session_id, user_id)
    
    async def get_availability(
        self,
        db: Session,
        tutor_id: int,
        start_date: datetime,
        end_date: datetime,
        external_tutor_id: Optional[str] = None
    ) -> List[Dict]:
        """Get tutor availability."""
        
        if self.use_external and external_tutor_id:
            return await self.skillsdrome.get_availability(
                tutor_id=external_tutor_id,
                start_date=start_date,
                end_date=end_date
            )
        else:
            return self.local.get_tutor_availability(
                db=db,
                tutor_id=tutor_id,
                start_date=start_date,
                end_date=end_date
            )


# Global service instance
tutoring_service_manager = TutoringServiceManager()
