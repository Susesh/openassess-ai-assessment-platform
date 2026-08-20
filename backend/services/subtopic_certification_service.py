import uuid
import qrcode
from io import BytesIO
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.subtopic_certification import SubtopicCertification
from backend.models.attempt import Attempt
from backend.models.result import Result
from backend.models.question import Question
from backend.models.topic import Topic, Subtopic
from backend.models.user import User


class SubtopicCertificationService:
    """Service for managing subtopic-level micro-certifications."""
    
    PASS_THRESHOLD = 80.0  # Minimum score to earn subtopic certification
    
    def generate_certificate_code(self) -> str:
        """Generate unique certificate code."""
        return f"SUB-{uuid.uuid4().hex[:12].upper()}"
    
    def generate_verification_token(self) -> str:
        """Generate unique verification token."""
        return uuid.uuid4().hex
    
    def generate_qr_code(self, verification_token: str) -> str:
        """Generate QR code for verification and return base64 string."""
        # In production, this would upload to cloud storage and return URL
        # For now, return a placeholder URL
        verification_url = f"https://openassess.com/verify/{verification_token}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 for storage
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = buffered.getvalue()
        
        # In production: upload to GCS/S3 and return URL
        # For now: return placeholder
        return f"https://openassess.com/qr/{verification_token}.png"
    
    def calculate_subtopic_performance(
        self,
        db: Session,
        user_id: int,
        subtopic_id: int
    ) -> dict:
        """Calculate user's performance on a specific subtopic."""
        
        # Get all results for questions in this subtopic
        subtopic_questions = db.query(Question.id).filter(
            Question.subtopic_id == subtopic_id
        ).all()
        
        question_ids = [q.id for q in subtopic_questions]
        
        if not question_ids:
            return {
                'average_score': 0.0,
                'attempts_count': 0,
                'questions_correct': 0,
                'questions_total': 0,
                'first_attempted_at': None
            }
        
        # Get all attempts that include these questions
        results = db.query(Result, Attempt).join(
            Attempt, Result.attempt_id == Attempt.id
        ).filter(
            Attempt.user_id == user_id,
            Result.question_id.in_(question_ids),
            Attempt.completed_at.isnot(None)
        ).all()
        
        if not results:
            return {
                'average_score': 0.0,
                'attempts_count': 0,
                'questions_correct': 0,
                'questions_total': 0,
                'first_attempted_at': None
            }
        
        # Calculate metrics
        total_correct = sum(1 for r, a in results if r.is_correct)
        total_questions = len(results)
        attempts = set(r.attempt_id for r, a in results)
        attempts_count = len(attempts)
        
        # Get first attempt time
        first_attempt = db.query(Attempt).filter(
            Attempt.id.in_(attempts)
        ).order_by(Attempt.started_at.asc()).first()
        
        average_score = (total_correct / total_questions * 100) if total_questions > 0 else 0.0
        
        return {
            'average_score': round(average_score, 1),
            'attempts_count': attempts_count,
            'questions_correct': total_correct,
            'questions_total': total_questions,
            'first_attempted_at': first_attempt.started_at if first_attempt else None
        }
    
    def check_and_issue_certification(
        self,
        db: Session,
        user_id: int,
        subtopic_id: int,
        topic_id: int
    ) -> Optional[SubtopicCertification]:
        """Check if user qualifies for subtopic certification and issue if eligible."""
        
        # Check if already certified
        existing = db.query(SubtopicCertification).filter(
            SubtopicCertification.user_id == user_id,
            SubtopicCertification.subtopic_id == subtopic_id,
            SubtopicCertification.is_active == 1
        ).first()
        
        if existing:
            return existing  # Already certified
        
        # Calculate performance
        performance = self.calculate_subtopic_performance(db, user_id, subtopic_id)
        
        # Check if meets threshold
        if performance['average_score'] < self.PASS_THRESHOLD:
            return None  # Not eligible yet
        
        # Issue certification
        certificate = SubtopicCertification(
            user_id=user_id,
            topic_id=topic_id,
            subtopic_id=subtopic_id,
            certificate_code=self.generate_certificate_code(),
            verification_token=self.generate_verification_token(),
            average_score=performance['average_score'],
            attempts_count=performance['attempts_count'],
            questions_correct=performance['questions_correct'],
            questions_total=performance['questions_total'],
            first_attempted_at=performance['first_attempted_at'],
            certified_at=datetime.utcnow(),
            qr_code_url=self.generate_qr_code("placeholder")  # Will update with actual token
        )
        
        # Update QR code with actual verification token
        certificate.qr_code_url = self.generate_qr_code(certificate.verification_token)
        
        db.add(certificate)
        db.commit()
        db.refresh(certificate)
        
        return certificate
    
    def get_user_subtopic_certifications(
        self,
        db: Session,
        user_id: int
    ) -> List[SubtopicCertification]:
        """Get all active subtopic certifications for a user."""
        return db.query(SubtopicCertification).filter(
            SubtopicCertification.user_id == user_id,
            SubtopicCertification.is_active == 1
        ).order_by(SubtopicCertification.certified_at.desc()).all()
    
    def verify_certificate(
        self,
        db: Session,
        verification_token: str
    ) -> Optional[SubtopicCertification]:
        """Verify a certificate using its verification token."""
        return db.query(SubtopicCertification).filter(
            SubtopicCertification.verification_token == verification_token,
            SubtopicCertification.is_active == 1
        ).first()
    
    def revoke_certificate(
        self,
        db: Session,
        certification_id: int,
        reason: str
    ) -> SubtopicCertification:
        """Revoke a subtopic certification."""
        certification = db.query(SubtopicCertification).filter(
            SubtopicCertification.id == certification_id
        ).first()
        
        if not certification:
            raise ValueError("Certification not found")
        
        certification.is_active = 0
        certification.revocation_reason = reason
        certification.revoked_at = datetime.utcnow()
        
        db.commit()
        db.refresh(certification)
        
        return certification
    
    def update_certificate_after_attempt(
        self,
        db: Session,
        attempt_id: int
    ):
        """Check and update certifications after an attempt is submitted."""
        
        attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if not attempt:
            return
        
        # Get all subtopics covered in this attempt
        results = db.query(Result).filter(Result.attempt_id == attempt_id).all()
        question_ids = [r.question_id for r in results]
        
        questions = db.query(Question).filter(Question.id.in_(question_ids)).all()
        subtopic_ids = set(q.subtopic_id for q in questions if q.subtopic_id)
        
        # Check each subtopic for certification eligibility
        for subtopic_id in subtopic_ids:
            self.check_and_issue_certification(
                db=db,
                user_id=attempt.user_id,
                subtopic_id=subtopic_id,
                topic_id=attempt.topic_id
            )


# Global service instance
subtopic_certification_service = SubtopicCertificationService()
