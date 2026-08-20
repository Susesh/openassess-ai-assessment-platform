"""
KPI (Key Performance Indicator) service for business intelligence.

Calculates and aggregates platform metrics for business intelligence dashboard.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from backend.models.user import User
from backend.models.attempt import Attempt
from backend.models.certificate import Certificate
from backend.models.organization import Organization


class KPIService:
    """Service for calculating and aggregating KPIs."""
    
    @staticmethod
    def get_daily_assessments(db: Session, days: int = 30) -> List[Dict]:
        """Get assessment counts per day for the specified period."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        results = db.query(
            func.date(Attempt.completed_at).label('date'),
            func.count(Attempt.id).label('count')
        ).filter(
            Attempt.completed_at >= start_date,
            Attempt.completed_at.isnot(None)
        ).group_by(
            func.date(Attempt.completed_at)
        ).order_by(
            func.date(Attempt.completed_at)
        ).all()
        
        return [
            {
                "date": str(result.date),
                "count": result.count
            }
            for result in results
        ]
    
    @staticmethod
    def get_assessments_per_day(db: Session, days: int = 7) -> Dict:
        """Get average assessments per day for the specified period."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total_assessments = db.query(Attempt).filter(
            Attempt.completed_at >= start_date,
            Attempt.completed_at.isnot(None)
        ).count()
        
        return {
            "period_days": days,
            "total_assessments": total_assessments,
            "average_per_day": round(total_assessments / days, 2) if days > 0 else 0
        }
    
    @staticmethod
    def get_remediation_completion_rate(db: Session, days: int = 30) -> Dict:
        """Get remedial session completion rate for the specified period."""
        from backend.models.tutor_session import TutorSession
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total_scheduled = db.query(TutorSession).filter(
            TutorSession.scheduled_at >= start_date
        ).count()
        
        completed_sessions = db.query(TutorSession).filter(
            TutorSession.scheduled_at >= start_date,
            TutorSession.status == "completed"
        ).count()
        
        completion_rate = round((completed_sessions / total_scheduled * 100) if total_scheduled > 0 else 0, 2)
        
        return {
            "period_days": days,
            "total_scheduled": total_scheduled,
            "completed": completed_sessions,
            "completion_rate": completion_rate
        }
    
    @staticmethod
    def get_certification_volume(db: Session, days: int = 30) -> Dict:
        """Get certificate issuance volume for the specified period."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total_certificates = db.query(Certificate).filter(
            Certificate.issued_at >= start_date
        ).count()
        
        participation_certificates = db.query(Certificate).filter(
            Certificate.issued_at >= start_date,
            Certificate.certificate_type == "participation"
        ).count()
        
        achievement_certificates = db.query(Certificate).filter(
            Certificate.issued_at >= start_date,
            Certificate.certificate_type == "achievement"
        ).count()
        
        return {
            "period_days": days,
            "total_certificates": total_certificates,
            "participation_certificates": participation_certificates,
            "achievement_certificates": achievement_certificates
        }
    
    @staticmethod
    def get_employer_queries(db: Session, days: int = 30) -> Dict:
        """Get employer/university API query count for the specified period."""
        # This would require implementing API usage tracking
        # For now, return organization count as a proxy
        total_organizations = db.query(Organization).count()
        
        return {
            "period_days": days,
            "total_organizations": total_organizations,
            "estimated_queries": total_organizations * 10  # Rough estimate
        }
    
    @staticmethod
    def get_all_kpis(db: Session, days: int = 30) -> Dict:
        """Get all KPIs in a single call."""
        return {
            "assessments_per_day": KPIService.get_assessments_per_day(db, days),
            "remediation_completion_rate": KPIService.get_remediation_completion_rate(db, days),
            "certification_volume": KPIService.get_certification_volume(db, days),
            "employer_queries": KPIService.get_employer_queries(db, days),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def get_historical_trends(db: Session, metric: str, days: int = 90) -> List[Dict]:
        """Get historical trends for a specific metric."""
        if metric == "assessments":
            return KPIService.get_daily_assessments(db, days)
        elif metric == "certificates":
            start_date = datetime.utcnow() - timedelta(days=days)
            results = db.query(
                func.date(Certificate.issued_at).label('date'),
                func.count(Certificate.id).label('count')
            ).filter(
                Certificate.issued_at >= start_date
            ).group_by(
                func.date(Certificate.issued_at)
            ).order_by(
                func.date(Certificate.issued_at)
            ).all()
            
            return [
                {
                    "date": str(result.date),
                    "count": result.count
                }
                for result in results
            ]
        else:
            return []
    
    @staticmethod
    def get_platform_overview(db: Session) -> Dict:
        """Get high-level platform overview metrics."""
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        total_assessments = db.query(Attempt).count()
        total_certificates = db.query(Certificate).count()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_assessments": total_assessments,
            "total_certificates": total_certificates,
            "user_growth_rate": 0.0,  # Would need historical data
            "assessment_growth_rate": 0.0  # Would need historical data
        }
