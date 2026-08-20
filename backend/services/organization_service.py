import secrets
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.organization import Organization, VerificationLog
from backend.models.user import User
from backend.models.certification import Certification
from backend.models.subtopic_certification import SubtopicCertification
from backend.models.topic import Topic, Subtopic


class OrganizationService:
    """Service for managing organizations and verification portal."""
    
    def generate_api_key(self) -> str:
        """Generate a secure API key for organizations."""
        return f"OA-{secrets.token_urlsafe(32)}"
    
    def hash_api_key(self, api_key: str) -> str:
        """Hash an API key for secure storage."""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    def verify_api_key(self, api_key: str, hashed_key: str) -> bool:
        """Verify an API key against its hash."""
        return self.hash_api_key(api_key) == hashed_key
    
    def create_organization(
        self,
        db: Session,
        name: str,
        organization_type: str,
        email: str,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        address: Optional[str] = None,
        verification_document_url: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Organization:
        """Create a new organization."""
        
        # Check if email already exists
        existing = db.query(Organization).filter(Organization.email == email).first()
        if existing:
            raise ValueError("Organization with this email already exists")
        
        api_key = self.generate_api_key()
        api_key_hash = self.hash_api_key(api_key)
        
        organization = Organization(
            name=name,
            organization_type=organization_type,
            email=email,
            phone=phone,
            website=website,
            address=address,
            api_key=api_key,
            api_key_hash=api_key_hash,
            verification_document_url=verification_document_url,
            notes=notes
        )
        
        db.add(organization)
        db.commit()
        db.refresh(organization)
        
        return organization
    
    def verify_organization(
        self,
        db: Session,
        organization_id: int
    ) -> Organization:
        """Verify an organization (admin action)."""
        
        organization = db.query(Organization).filter(
            Organization.id == organization_id
        ).first()
        
        if not organization:
            raise ValueError("Organization not found")
        
        organization.is_verified = True
        organization.verified_at = datetime.utcnow()
        
        db.commit()
        db.refresh(organization)
        
        return organization
    
    def authenticate_organization(
        self,
        db: Session,
        api_key: str
    ) -> Optional[Organization]:
        """Authenticate an organization by API key."""
        
        organization = db.query(Organization).filter(
            Organization.api_key == api_key,
            Organization.is_active == True,
            Organization.is_verified == True
        ).first()
        
        if organization:
            # Update last API call
            organization.last_api_call = datetime.utcnow()
            db.commit()
        
        return organization
    
    def check_rate_limit(
        self,
        db: Session,
        organization: Organization
    ) -> bool:
        """Check if organization is within rate limits."""
        
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(days=1)
        
        # Count requests in last hour
        hourly_count = db.query(VerificationLog).filter(
            VerificationLog.organization_id == organization.id,
            VerificationLog.request_timestamp >= hour_ago
        ).count()
        
        # Count requests in last day
        daily_count = db.query(VerificationLog).filter(
            VerificationLog.organization_id == organization.id,
            VerificationLog.request_timestamp >= day_ago
        ).count()
        
        if hourly_count >= organization.rate_limit_per_hour:
            return False
        
        if daily_count >= organization.rate_limit_per_day:
            return False
        
        return True
    
    def log_verification(
        self,
        db: Session,
        organization_id: int,
        verification_type: str,
        is_valid: bool,
        verification_data: Optional[Dict] = None,
        certificate_id: Optional[int] = None,
        verification_token: Optional[str] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        response_time_ms: Optional[int] = None
    ) -> VerificationLog:
        """Log a verification request."""
        
        log = VerificationLog(
            organization_id=organization_id,
            user_id=user_id,
            verification_type=verification_type,
            certificate_id=certificate_id,
            verification_token=verification_token,
            is_valid=is_valid,
            verification_data=json.dumps(verification_data) if verification_data else None,
            ip_address=ip_address,
            user_agent=user_agent,
            response_time_ms=response_time_ms
        )
        
        db.add(log)
        db.commit()
        db.refresh(log)
        
        return log
    
    def verify_certification(
        self,
        db: Session,
        api_key: str,
        verification_type: str,
        identifier: str
    ) -> Dict:
        """Verify a certification (public API for organizations)."""
        
        # Authenticate organization
        organization = self.authenticate_organization(db, api_key)
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive API key"
            )
        
        # Check rate limit
        if not self.check_rate_limit(db, organization):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        start_time = datetime.utcnow()
        
        # Verify based on type
        result = None
        is_valid = False
        user_id = None
        
        if verification_type == "topic_certification":
            # Try to find by certificate code
            cert = db.query(Certification).filter(
                Certification.certificate_code == identifier
            ).first()
            
            if cert and cert.user:
                user_id = cert.user.id
                topic = db.query(Topic).filter(Topic.id == cert.topic_id).first()
                result = {
                    "type": "topic_certification",
                    "certificate_code": cert.certificate_code,
                    "user_name": cert.user.full_name,
                    "topic_name": topic.name if topic else None,
                    "score": cert.score,
                    "issued_at": cert.issued_at.isoformat()
                }
                is_valid = True
        
        elif verification_type == "subtopic_certification":
            # Try to find by verification token or certificate code
            cert = db.query(SubtopicCertification).filter(
                (SubtopicCertification.verification_token == identifier) |
                (SubtopicCertification.certificate_code == identifier)
            ).first()
            
            if cert and cert.is_active == 1 and cert.user:
                user_id = cert.user.id
                topic = db.query(Topic).filter(Topic.id == cert.topic_id).first()
                subtopic = db.query(Subtopic).filter(Subtopic.id == cert.subtopic_id).first()
                result = {
                    "type": "subtopic_certification",
                    "certificate_code": cert.certificate_code,
                    "user_name": cert.user.full_name,
                    "topic_name": topic.name if topic else None,
                    "subtopic_name": subtopic.name if subtopic else None,
                    "average_score": cert.average_score,
                    "certified_at": cert.certified_at.isoformat()
                }
                is_valid = True
        
        # Calculate response time
        response_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Log the verification
        self.log_verification(
            db=db,
            organization_id=organization.id,
            verification_type=verification_type,
            is_valid=is_valid,
            verification_data=result,
            verification_token=identifier if verification_type == "subtopic_certification" else None,
            user_id=user_id,
            response_time_ms=response_time_ms
        )
        
        return {
            "is_valid": is_valid,
            "data": result if is_valid else None,
            "message": "Certificate verified successfully" if is_valid else "Certificate not found or invalid"
        }
    
    def search_candidate(
        self,
        db: Session,
        api_key: str,
        email: Optional[str] = None,
        full_name: Optional[str] = None
    ) -> Optional[Dict]:
        """Search for a candidate by email or name."""
        
        # Authenticate organization
        organization = self.authenticate_organization(db, api_key)
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive API key"
            )
        
        # Check rate limit
        if not self.check_rate_limit(db, organization):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        # Search for user
        query = db.query(User)
        if email:
            query = query.filter(User.email == email)
        elif full_name:
            query = query.filter(User.full_name.ilike(f"%{full_name}%"))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either email or full_name must be provided"
            )
        
        user = query.first()
        if not user:
            return None
        
        # Get topic certifications
        topic_certs = db.query(Certification).filter(
            Certification.user_id == user.id
        ).all()
        
        # Get subtopic certifications
        subtopic_certs = db.query(SubtopicCertification).filter(
            SubtopicCertification.user_id == user.id,
            SubtopicCertification.is_active == 1
        ).all()
        
        # Build certification list
        certifications = []
        
        for cert in topic_certs:
            topic = db.query(Topic).filter(Topic.id == cert.topic_id).first()
            certifications.append({
                "certification_type": "topic",
                "certificate_code": cert.certificate_code,
                "topic_name": topic.name if topic else None,
                "average_score": cert.score,
                "certified_at": cert.issued_at.isoformat(),
                "is_active": True
            })
        
        for cert in subtopic_certs:
            topic = db.query(Topic).filter(Topic.id == cert.topic_id).first()
            subtopic = db.query(Subtopic).filter(Subtopic.id == cert.subtopic_id).first()
            certifications.append({
                "certification_type": "subtopic",
                "certificate_code": cert.certificate_code,
                "topic_name": topic.name if topic else None,
                "subtopic_name": subtopic.name if subtopic else None,
                "average_score": cert.average_score,
                "certified_at": cert.certified_at.isoformat(),
                "is_active": cert.is_active == 1
            })
        
        # Sort by date
        certifications.sort(key=lambda x: x["certified_at"], reverse=True)
        
        return {
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "certifications": certifications,
            "total_certifications": len(certifications),
            "last_certification": certifications[0]["certified_at"] if certifications else None
        }
    
    def get_organization_logs(
        self,
        db: Session,
        organization_id: int,
        limit: int = 100
    ) -> List[VerificationLog]:
        """Get verification logs for an organization."""
        return db.query(VerificationLog).filter(
            VerificationLog.organization_id == organization_id
        ).order_by(VerificationLog.request_timestamp.desc()).limit(limit).all()


# Global service instance
organization_service = OrganizationService()
