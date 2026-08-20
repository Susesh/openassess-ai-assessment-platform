"""
Notification Service

Handles user notifications for sessions, reminders, and updates.
Supports in-app, email, and SMS notifications.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from backend.models.notification import Notification
from backend.models.user import User
from backend.models.tutor import TutorSession
from backend.models.attempt import Attempt


class NotificationService:
    """Service for creating and managing user notifications."""
    
    # Notification types
    TYPE_SESSION_SCHEDULED = "session_scheduled"
    TYPE_SESSION_REMINDER_24H = "session_reminder_24h"
    TYPE_SESSION_REMINDER_1H = "session_reminder_1h"
    TYPE_SESSION_CANCELLED = "session_cancelled"
    TYPE_TUTOR_AVAILABLE = "tutor_available"
    TYPE_REMEDIATION_AVAILABLE = "remediation_available"
    TYPE_ASSESSMENT_PASSED = "assessment_passed"
    TYPE_CERTIFICATION_EARNED = "certification_earned"
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        notification_type: str,
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> Notification:
        """Create a new notification for a user."""
        
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            body=body,
            data=data or {}
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        return notification
    
    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Notification]:
        """Get notifications for a user."""
        
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.read_at.is_(None))
        
        notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
        
        return notifications
    
    @staticmethod
    def mark_as_read(
        db: Session,
        notification_id: int,
        user_id: int
    ) -> bool:
        """Mark a notification as read."""
        
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            return False
        
        notification.read_at = datetime.utcnow()
        db.commit()
        
        return True
    
    @staticmethod
    def mark_all_as_read(
        db: Session,
        user_id: int
    ) -> int:
        """Mark all notifications as read for a user."""
        
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read_at.is_(None)
        ).update({"read_at": datetime.utcnow()})
        
        db.commit()
        
        return count
    
    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications for a user."""
        
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read_at.is_(None)
        ).count()
        
        return count
    
    @staticmethod
    def notify_session_scheduled(
        db: Session,
        session: TutorSession
    ):
        """Notify student when a session is scheduled."""
        
        tutor = session.tutor
        student = session.student
        
        title = f"Remedial Class Scheduled with {tutor.name}"
        body = f"Your remedial class is scheduled for {session.scheduled_at.strftime('%B %d, %Y at %I:%M %p')}. Meeting link: {session.meeting_link}"
        
        NotificationService.create_notification(
            db=db,
            user_id=student.id,
            notification_type=NotificationService.TYPE_SESSION_SCHEDULED,
            title=title,
            body=body,
            data={
                "session_id": session.id,
                "tutor_id": tutor.id,
                "tutor_name": tutor.name,
                "scheduled_at": session.scheduled_at.isoformat(),
                "meeting_link": session.meeting_link,
                "weak_topics": session.weak_topics
            }
        )
    
    @staticmethod
    def notify_session_reminder(
        db: Session,
        session: TutorSession,
        hours_before: int = 24
    ):
        """Notify student before a session."""
        
        tutor = session.tutor
        student = session.student
        
        notification_type = (
            NotificationService.TYPE_SESSION_REMINDER_24H if hours_before == 24
            else NotificationService.TYPE_SESSION_REMINDER_1H
        )
        
        title = f"Reminder: Class with {tutor.name} in {hours_before} hour{'s' if hours_before != 1 else ''}"
        body = f"Your remedial class starts at {session.scheduled_at.strftime('%I:%M %p')}. Join here: {session.meeting_link}"
        
        NotificationService.create_notification(
            db=db,
            user_id=student.id,
            notification_type=notification_type,
            title=title,
            body=body,
            data={
                "session_id": session.id,
                "scheduled_at": session.scheduled_at.isoformat(),
                "meeting_link": session.meeting_link
            }
        )
    
    @staticmethod
    def notify_session_cancelled(
        db: Session,
        session: TutorSession
    ):
        """Notify student when a session is cancelled."""
        
        tutor = session.tutor
        student = session.student
        
        title = f"Class with {tutor.name} Cancelled"
        body = f"Your remedial class scheduled for {session.scheduled_at.strftime('%B %d, %Y')} has been cancelled."
        
        NotificationService.create_notification(
            db=db,
            user_id=student.id,
            notification_type=NotificationService.TYPE_SESSION_CANCELLED,
            title=title,
            body=body,
            data={
                "session_id": session.id,
                "scheduled_at": session.scheduled_at.isoformat()
            }
        )
    
    @staticmethod
    def notify_remediation_available(
        db: Session,
        attempt: Attempt
    ):
        """Notify student when remedial resources are available after a failed attempt."""
        
        topic = attempt.topic
        student = attempt.user
        
        title = f"Remedial Plan Available for {topic.name if topic else 'Assessment'}"
        body = f"You scored {attempt.score}/{attempt.total_questions}. View your personalized remedial plan and book a tutor session."
        
        NotificationService.create_notification(
            db=db,
            user_id=student.id,
            notification_type=NotificationService.TYPE_REMEDIATION_AVAILABLE,
            title=title,
            body=body,
            data={
                "attempt_id": attempt.id,
                "topic_id": attempt.topic_id,
                "score": attempt.score,
                "total": attempt.total_questions,
                "percentage": attempt.percentage
            }
        )
    
    @staticmethod
    def notify_assessment_passed(
        db: Session,
        attempt: Attempt
    ):
        """Notify student when they pass an assessment."""
        
        topic = attempt.topic
        student = attempt.user
        
        title = f"Congratulations! You Passed {topic.name if topic else 'Assessment'}"
        body = f"You scored {attempt.score}/{attempt.total_questions} ({attempt.percentage}%). Keep up the great work!"
        
        NotificationService.create_notification(
            db=db,
            user_id=student.id,
            notification_type=NotificationService.TYPE_ASSESSMENT_PASSED,
            title=title,
            body=body,
            data={
                "attempt_id": attempt.id,
                "topic_id": attempt.topic_id,
                "score": attempt.score,
                "total": attempt.total_questions,
                "percentage": attempt.percentage
            }
        )
    
    @staticmethod
    def cleanup_old_notifications(
        db: Session,
        days_to_keep: int = 30
    ) -> int:
        """Delete notifications older than specified days."""
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        count = db.query(Notification).filter(
            Notification.created_at < cutoff_date,
            Notification.read_at.isnot(None)  # Only delete read notifications
        ).delete()
        
        db.commit()
        
        return count


# Global service instance
notification_service = NotificationService()
