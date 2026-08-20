"""
KPI (Key Performance Indicator) API routes.

Provides endpoints for accessing business intelligence metrics
and platform performance data.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.database import get_db
from backend.models.user import User
from backend.utils.auth_utils import get_current_user
from backend.services.kpi_service import KPIService

router = APIRouter(prefix="/kpi", tags=["KPI"])


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user is an admin."""
    if current_user.role != "admin":
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access KPI data"
        )
    return current_user


@router.get(
    "/overview",
    summary="Get platform overview metrics",
    description="High-level platform metrics including users, assessments, and certificates."
)
def get_platform_overview(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get high-level platform overview metrics."""
    return KPIService.get_platform_overview(db)


@router.get(
    "/assessments-per-day",
    summary="Get assessments per day",
    description="Average number of assessments taken per day over a specified period."
)
def get_assessments_per_day(
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get average assessments per day for the specified period."""
    return KPIService.get_assessments_per_day(db, days)


@router.get(
    "/daily-assessments",
    summary="Get daily assessment counts",
    description="Assessment counts per day for trend analysis."
)
def get_daily_assessments(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get assessment counts per day for the specified period."""
    return KPIService.get_daily_assessments(db, days)


@router.get(
    "/remediation-rate",
    summary="Get remedial completion rate",
    description="Percentage of remedial sessions completed over a specified period."
)
def get_remediation_completion_rate(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get remedial session completion rate for the specified period."""
    return KPIService.get_remediation_completion_rate(db, days)


@router.get(
    "/certification-volume",
    summary="Get certificate issuance volume",
    description="Number of certificates issued over a specified period."
)
def get_certification_volume(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get certificate issuance volume for the specified period."""
    return KPIService.get_certification_volume(db, days)


@router.get(
    "/employer-queries",
    summary="Get employer query metrics",
    description="Employer/university API query activity over a specified period."
)
def get_employer_queries(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get employer query metrics for the specified period."""
    return KPIService.get_employer_queries(db, days)


@router.get(
    "/all",
    summary="Get all KPIs",
    description="All key performance indicators in a single response."
)
def get_all_kpis(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all KPIs for the specified period."""
    return KPIService.get_all_kpis(db, days)


@router.get(
    "/trends/{metric}",
    summary="Get historical trends",
    description="Historical trend data for a specific metric."
)
def get_historical_trends(
    metric: str,
    days: int = Query(90, ge=1, le=365, description="Number of days to analyze"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get historical trends for a specific metric."""
    valid_metrics = ["assessments", "certificates"]
    if metric not in valid_metrics:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid metric. Valid options: {', '.join(valid_metrics)}"
        )
    
    return KPIService.get_historical_trends(db, metric, days)
