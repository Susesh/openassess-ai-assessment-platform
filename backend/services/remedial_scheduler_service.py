"""
Remedial Class Scheduler Service

Automatically schedules remedial classes for students who fail assessments.
Integrates with SkillsDrome for tutor matching and session booking.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.attempt import Attempt
from backend.models.tutor import TutorProfile, TutorAvailability, TutorSession
from backend.models.topic import Topic, Subtopic
from backend.models.user import User
from backend.services.skillsdrome_service import tutoring_service_manager


class RemedialSchedulerService:
    """Service for automatic remedial class scheduling."""
    
    # Scheduling preferences
    PREFERRED_HOURS_AHEAD = 24  # Prefer slots 24-48 hours ahead
    MAX_HOURS_AHEAD = 168  # Max 1 week ahead
    MIN_HOURS_AHEAD = 12  # Min 12 hours ahead
    
    # Tutor matching weights
    WEIGHT_SUBJECT_EXPERTISE = 0.4
    WEIGHT_AVAILABILITY_PROXIMITY = 0.3
    WEIGHT_RATING = 0.2
    WEIGHT_PRICE = 0.1
    
    @staticmethod
    def trigger_remedial_scheduling(
        db: Session,
        attempt_id: int
    ) -> Dict:
        """
        Trigger remedial scheduling after a failed assessment.
        
        Args:
            db: Database session
            attempt_id: Failed attempt ID
            
        Returns:
            Dictionary with scheduling results
        """
        attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if not attempt:
            return {"success": False, "error": "Attempt not found"}
        
        # Only schedule for failed attempts
        if attempt.percentage >= attempt.passing_percentage:
            return {"success": False, "error": "Attempt was passed, no remedial needed"}
        
        # Identify weak topics from the attempt
        weak_topics = RemedialSchedulerService._identify_weak_topics(db, attempt)
        
        if not weak_topics:
            return {"success": False, "error": "No weak topics identified"}
        
        # Find suitable tutors
        recommended_tutors = RemedialSchedulerService._find_recommended_tutors(
            db, attempt.topic_id, weak_topics
        )
        
        if not recommended_tutors:
            return {"success": False, "error": "No suitable tutors found"}
        
        # Generate optimal time slots
        time_slots = RemedialSchedulerService._generate_optimal_slots(
            db, recommended_tutors[0]['tutor_id']
        )
        
        if not time_slots:
            return {"success": False, "error": "No available time slots"}
        
        # Create tentative session (auto_scheduled = True)
        best_slot = time_slots[0]
        session = RemedialSchedulerService._create_remedial_session(
            db=db,
            attempt_id=attempt_id,
            tutor_id=recommended_tutors[0]['tutor_id'],
            student_id=attempt.user_id,
            scheduled_at=best_slot['scheduled_at'],
            weak_topics=weak_topics,
            auto_scheduled=True
        )
        
        return {
            "success": True,
            "session_id": session.id,
            "tutor_name": recommended_tutors[0]['tutor_name'],
            "scheduled_at": session.scheduled_at.isoformat(),
            "weak_topics": weak_topics,
            "meeting_link": session.meeting_link
        }
    
    @staticmethod
    def _identify_weak_topics(db: Session, attempt: Attempt) -> List[str]:
        """Identify weak topics from a failed attempt."""
        from backend.models.result import Result
        from backend.models.question import Question
        
        results = db.query(Result).filter(Result.attempt_id == attempt.id).all()
        weak_topics = set()
        
        for result in results:
            if not RemedialSchedulerService._is_correct_value(result.is_correct):
                question = db.query(Question).filter(Question.id == result.question_id).first()
                if question:
                    if question.subtopic:
                        weak_topics.add(question.subtopic.name)
                    elif question.topic:
                        weak_topics.add(question.topic.name)
        
        return list(weak_topics)
    
    @staticmethod
    def _is_correct_value(value) -> bool:
        """Normalize various boolean representations."""
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            return value.strip().lower() in {"true", "t", "1", "yes", "y"}
        return False
    
    @staticmethod
    def _find_recommended_tutors(
        db: Session,
        topic_id: int,
        weak_topics: List[str],
        limit: int = 5
    ) -> List[Dict]:
        """
        Find recommended tutors based on weak topics and availability.
        
        Args:
            db: Database session
            topic_id: Topic ID
            weak_topics: List of weak topic names
            limit: Maximum number of tutors to return
            
        Returns:
            List of recommended tutors with scores
        """
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            return []
        
        # Get subject from topic
        subject = topic.subject or topic.name
        
        # Find tutors who teach this subject
        # Use JSON contains instead of array_contains for better compatibility
        tutors = db.query(TutorProfile).filter(
            TutorProfile.is_active == True,
            TutorProfile.subjects.isnot(None)
        ).all()
        
        # Filter tutors who teach the subject (manual filtering for compatibility)
        tutors = [t for t in tutors if t.subjects and subject in t.subjects]
        
        scored_tutors = []
        
        for tutor in tutors:
            score = RemedialSchedulerService._calculate_tutor_score(
                db, tutor, subject, weak_topics
            )
            
            scored_tutors.append({
                "tutor_id": tutor.id,
                "tutor_name": tutor.name,
                "subjects": tutor.subjects,
                "rating": tutor.rating,
                "hourly_rate": tutor.hourly_rate,
                "total_sessions": tutor.total_sessions,
                "score": score
            })
        
        # Sort by score (descending)
        scored_tutors.sort(key=lambda x: x['score'], reverse=True)
        
        return scored_tutors[:limit]
    
    @staticmethod
    def _calculate_tutor_score(
        db: Session,
        tutor: TutorProfile,
        subject: str,
        weak_topics: List[str]
    ) -> float:
        """Calculate tutor matching score based on multiple factors."""
        score = 0.0
        
        # Subject expertise (40%)
        if subject in tutor.subjects:
            score += RemedialSchedulerService.WEIGHT_SUBJECT_EXPERTISE * 1.0
        
        # Check if tutor specializes in weak topics
        weak_topic_match = sum(1 for topic in weak_topics if topic in tutor.subjects)
        if weak_topic_match > 0:
            score += RemedialSchedulerService.WEIGHT_SUBJECT_EXPERTISE * (weak_topic_match / len(weak_topics)) * 0.5
        
        # Availability proximity (30%)
        # Check if tutor has availability in the next 48 hours
        now = datetime.utcnow()
        future_48h = now + timedelta(hours=48)
        
        availabilities = db.query(TutorAvailability).filter(
            TutorAvailability.tutor_id == tutor.id,
            TutorAvailability.is_booked == False
        ).all()
        
        if availabilities:
            # Calculate how many available slots are in preferred time window
            preferred_slots = 0
            for avail in availabilities:
                # Generate next occurrence of this day
                days_ahead = (avail.day_of_week - now.weekday() + 7) % 7
                if days_ahead == 0:
                    days_ahead = 7  # Next week
                
                slot_time = now + timedelta(days=days_ahead)
                [h, m] = avail.start_time.split(":")
                slot_time = slot_time.replace(hour=int(h), minute=int(m))
                
                hours_ahead = (slot_time - now).total_seconds() / 3600
                
                if RemedialSchedulerService.MIN_HOURS_AHEAD <= hours_ahead <= RemedialSchedulerService.PREFERRED_HOURS_AHEAD:
                    preferred_slots += 1
            
            availability_score = min(1.0, preferred_slots / 3.0)  # Normalize to 0-1
            score += RemedialSchedulerService.WEIGHT_AVAILABILITY_PROXIMITY * availability_score
        
        # Rating (20%)
        rating_score = (tutor.rating - 3.0) / 2.0  # Normalize 3-5 to 0-1
        rating_score = max(0.0, min(1.0, rating_score))
        score += RemedialSchedulerService.WEIGHT_RATING * rating_score
        
        # Price (10%) - lower is better
        # Assume reasonable rate is 20-100, normalize inversely
        if tutor.hourly_rate > 0:
            price_score = max(0.0, (100 - tutor.hourly_rate) / 80.0)
            score += RemedialSchedulerService.WEIGHT_PRICE * price_score
        
        return round(score, 3)
    
    @staticmethod
    def _generate_optimal_slots(
        db: Session,
        tutor_id: int,
        limit: int = 5
    ) -> List[Dict]:
        """
        Generate optimal time slots for a tutor based on preferences.
        
        Args:
            db: Database session
            tutor_id: Tutor ID
            limit: Maximum number of slots to return
            
        Returns:
            List of available time slots with scheduled datetime
        """
        now = datetime.utcnow()
        availabilities = db.query(TutorAvailability).filter(
            TutorAvailability.tutor_id == tutor_id,
            TutorAvailability.is_booked == False
        ).all()
        
        slots = []
        
        for avail in availabilities:
            # Generate next occurrence of this day
            days_ahead = (avail.day_of_week - now.weekday() + 7) % 7
            if days_ahead == 0:
                days_ahead = 7  # Next week
            
            slot_time = now + timedelta(days=days_ahead)
            [h, m] = avail.start_time.split(":")
            slot_time = slot_time.replace(hour=int(h), minute=int(m))
            
            hours_ahead = (slot_time - now).total_seconds() / 3600
            
            # Check if slot is within preferred window
            if RemedialSchedulerService.MIN_HOURS_AHEAD <= hours_ahead <= RemedialSchedulerService.MAX_HOURS_AHEAD:
                # Calculate preference score (closer to PREFERRED_HOURS_AHEAD is better)
                preference_score = 1.0 - abs(hours_ahead - RemedialSchedulerService.PREFERRED_HOURS_AHEAD) / RemedialSchedulerService.PREFERRED_HOURS_AHEAD
                
                slots.append({
                    "availability_id": avail.id,
                    "scheduled_at": slot_time,
                    "duration_minutes": 60,
                    "preference_score": preference_score
                })
        
        # Sort by preference score
        slots.sort(key=lambda x: x['preference_score'], reverse=True)
        
        return slots[:limit]
    
    @staticmethod
    def _create_remedial_session(
        db: Session,
        attempt_id: int,
        tutor_id: int,
        student_id: int,
        scheduled_at: datetime,
        weak_topics: List[str],
        auto_scheduled: bool = False
    ) -> TutorSession:
        """Create a remedial tutoring session."""
        
        session = TutorSession(
            tutor_id=tutor_id,
            student_id=student_id,
            scheduled_at=scheduled_at,
            duration_minutes=60,
            status="scheduled",
            meeting_link=f"https://meet.openassess.com/remedial/{attempt_id}",
            remedial_attempt_id=attempt_id,
            weak_topics=weak_topics,
            auto_scheduled=auto_scheduled
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def get_remedial_recommendations(
        db: Session,
        attempt_id: int
    ) -> Dict:
        """
        Get remedial recommendations without auto-scheduling.
        Returns tutor recommendations and available time slots.
        
        Args:
            db: Database session
            attempt_id: Attempt ID
            
        Returns:
            Dictionary with recommendations
        """
        attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if not attempt:
            return {"success": False, "error": "Attempt not found"}
        
        weak_topics = RemedialSchedulerService._identify_weak_topics(db, attempt)
        
        if not weak_topics:
            return {"success": False, "error": "No weak topics identified"}
        
        recommended_tutors = RemedialSchedulerService._find_recommended_tutors(
            db, attempt.topic_id, weak_topics, limit=3
        )
        
        if not recommended_tutors:
            return {"success": False, "error": "No suitable tutors found"}
        
        # Get time slots for top 3 tutors
        tutor_slots = {}
        for tutor_rec in recommended_tutors:
            slots = RemedialSchedulerService._generate_optimal_slots(db, tutor_rec['tutor_id'], limit=3)
            tutor_slots[tutor_rec['tutor_id']] = slots
        
        return {
            "success": True,
            "weak_topics": weak_topics,
            "recommended_tutors": recommended_tutors,
            "tutor_slots": tutor_slots
        }


# Global service instance
remedial_scheduler_service = RemedialSchedulerService()
