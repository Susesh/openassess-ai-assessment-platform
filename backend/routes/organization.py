from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models.user import User
from backend.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationOut,
    OrganizationWithApiKey,
    VerificationRequest,
    VerificationResponse,
    CandidateSearchRequest,
    CandidateProfile,
    VerificationLogOut,
)
from backend.services.organization_service import organization_service
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.post(
    "/register",
    response_model=OrganizationWithApiKey,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new organization"
)
def register_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """Register a new organization (employer/university) for verification access."""
    try:
        organization = organization_service.create_organization(
            db=db,
            name=data.name,
            organization_type=data.organization_type,
            email=data.email,
            phone=data.phone,
            website=data.website,
            address=data.address,
            verification_document_url=data.verification_document_url,
            notes=data.notes
        )
        return organization
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/my-organization",
    response_model=OrganizationOut,
    summary="Get current organization details"
)
def get_my_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of the authenticated user's organization (if applicable)."""
    # This would require linking users to organizations
    # For now, return 404 as this feature needs user-organization relationship
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User-organization linking not implemented"
    )


@router.post(
    "/{organization_id}/verify",
    response_model=OrganizationOut,
    summary="Verify an organization (admin only)"
)
def verify_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify an organization (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can verify organizations"
        )
    
    try:
        organization = organization_service.verify_organization(
            db=db,
            organization_id=organization_id
        )
        return organization
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/verify-certification",
    response_model=VerificationResponse,
    summary="Verify certification (public API for organizations)"
)
def verify_certification_public(
    data: VerificationRequest,
    x_forwarded_for: Optional[str] = Header(None),
    user_agent: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Public API for organizations to verify certifications."""
    try:
        result = organization_service.verify_certification(
            db=db,
            api_key=data.api_key,
            verification_type=data.verification_type,
            identifier=data.identifier
        )
        return VerificationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/search-candidate",
    response_model=CandidateProfile,
    summary="Search for a candidate (organization API)"
)
def search_candidate(
    data: CandidateSearchRequest,
    db: Session = Depends(get_db)
):
    """Search for a candidate by email or name (organization API)."""
    try:
        result = organization_service.search_candidate(
            db=db,
            api_key=data.api_key,
            email=data.email,
            full_name=data.full_name
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )
        
        return CandidateProfile(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/{organization_id}/logs",
    response_model=List[VerificationLogOut],
    summary="Get organization verification logs (admin only)"
)
def get_organization_logs(
    organization_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get verification logs for an organization (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view verification logs"
        )
    
    try:
        logs = organization_service.get_organization_logs(
            db=db,
            organization_id=organization_id,
            limit=limit
        )
        return logs
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/",
    response_model=List[OrganizationOut],
    summary="List all organizations (admin only)"
)
def list_organizations(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all organizations (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view organizations"
        )
    
    from backend.models.organization import Organization
    
    organizations = db.query(Organization).order_by(
        Organization.created_at.desc()
    ).limit(limit).all()
    
    return organizations
