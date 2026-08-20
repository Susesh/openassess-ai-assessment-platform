"""
Calendar Service

Handles calendar integration for tutoring sessions.
Supports iCal generation for session scheduling.
"""

from datetime import datetime, timedelta
from typing import Optional
from backend.models.tutor import TutorSession
from backend.models.user import User


class CalendarService:
    """Service for calendar integration and iCal generation."""
    
    @staticmethod
    def generate_ical_event(
        session: TutorSession,
        student: User,
        tutor_name: str
    ) -> str:
        """
        Generate an iCal (.ics) file content for a tutoring session.
        
        Args:
            session: Tutor session
            student: Student user
            tutor_name: Name of the tutor
            
        Returns:
            iCal formatted string
        """
        # Format dates for iCal
        start_dt = session.scheduled_at
        end_dt = start_dt + timedelta(minutes=session.duration_minutes)
        
        # iCal date format: YYYYMMDDTHHMMSSZ
        dt_format = "%Y%m%dT%H%M%SZ"
        start_str = start_dt.strftime(dt_format)
        end_str = end_dt.strftime(dt_format)
        now_str = datetime.utcnow().strftime(dt_format)
        
        # Create iCal content
        ical_content = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//OpenAssess//Remedial Sessions//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            f"UID:session-{session.id}@openassess.com",
            f"DTSTAMP:{now_str}",
            f"DTSTART:{start_str}",
            f"DTEND:{end_str}",
            f"SUMMARY:Remedial Class with {tutor_name}",
            f"DESCRIPTION:Remedial tutoring session for weak topics: {', '.join(session.weak_topics or [])}\\n\\nMeeting Link: {session.meeting_link}",
            f"LOCATION:{session.meeting_link}",
            "STATUS:CONFIRMED",
            "BEGIN:VALARM",
            "TRIGGER:-PT24H",
            "ACTION:DISPLAY",
            "DESCRIPTION:Reminder: Remedial class in 24 hours",
            "END:VALARM",
            "BEGIN:VALARM",
            "TRIGGER:-PT1H",
            "ACTION:DISPLAY",
            "DESCRIPTION:Reminder: Remedial class in 1 hour",
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR"
        ]
        
        return "\r\n".join(ical_content)
    
    @staticmethod
    def generate_google_calendar_link(
        session: TutorSession,
        tutor_name: str
    ) -> str:
        """
        Generate a Google Calendar event link.
        
        Args:
            session: Tutor session
            tutor_name: Name of the tutor
            
        Returns:
            URL to add event to Google Calendar
        """
        start_dt = session.scheduled_at
        end_dt = start_dt + timedelta(minutes=session.duration_minutes)
        
        # Format dates for Google Calendar URL
        dt_format = "%Y%m%dT%H%M%SZ"
        start_str = start_dt.strftime(dt_format)
        end_str = end_dt.strftime(dt_format)
        
        # Build URL parameters
        params = {
            "action": "TEMPLATE",
            "text": f"Remedial Class with {tutor_name}",
            "dates": f"{start_str}/{end_str}",
            "details": f"Remedial tutoring session for weak topics: {', '.join(session.weak_topics or [])}\n\nMeeting Link: {session.meeting_link}",
            "location": session.meeting_link,
        }
        
        # Encode parameters
        from urllib.parse import urlencode
        url = f"https://calendar.google.com/calendar/render?{urlencode(params)}"
        
        return url
    
    @staticmethod
    def generate_outlook_calendar_link(
        session: TutorSession,
        tutor_name: str
    ) -> str:
        """
        Generate an Outlook Calendar event link.
        
        Args:
            session: Tutor session
            tutor_name: Name of the tutor
            
        Returns:
            URL to add event to Outlook Calendar
        """
        start_dt = session.scheduled_at
        end_dt = start_dt + timedelta(minutes=session.duration_minutes)
        
        # Format dates for Outlook URL
        dt_format = "%Y-%m-%dT%H:%M:%S"
        start_str = start_dt.strftime(dt_format)
        end_str = end_dt.strftime(dt_format)
        
        # Build URL parameters
        params = {
            "path": "/calendar/action/compose",
            "rru": "addevent",
            "startdt": start_str,
            "enddt": end_str,
            "subject": f"Remedial Class with {tutor_name}",
            "body": f"Remedial tutoring session for weak topics: {', '.join(session.weak_topics or [])}\n\nMeeting Link: {session.meeting_link}",
            "location": session.meeting_link,
        }
        
        # Encode parameters
        from urllib.parse import urlencode
        url = f"https://outlook.live.com/calendar/0/deeplink/compose?{urlencode(params)}"
        
        return url
    
    @staticmethod
    def detect_conflicts(
        db,
        user_id: int,
        start_time: datetime,
        end_time: datetime
    ) -> list:
        """
        Detect scheduling conflicts for a user.
        
        Args:
            db: Database session
            user_id: User ID
            start_time: Proposed start time
            end_time: Proposed end time
            
        Returns:
            List of conflicting sessions
        """
        from backend.models.tutor import TutorSession
        
        # Find sessions that overlap with the proposed time
        conflicts = db.query(TutorSession).filter(
            TutorSession.student_id == user_id,
            TutorSession.status == "scheduled",
            TutorSession.scheduled_at < end_time,
            (TutorSession.scheduled_at + timedelta(minutes=TutorSession.duration_minutes)) > start_time
        ).all()
        
        return conflicts


# Global service instance
calendar_service = CalendarService()
