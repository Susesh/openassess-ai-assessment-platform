from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models.user import User
from backend.schemas.subtopic_certification import (
    SubtopicCertificationCreate,
    SubtopicCertificationOut,
    SubtopicCertificationDetail,
    VerificationRequest,
    VerificationResponse,
)
from backend.services.subtopic_certification_service import subtopic_certification_service
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/subtopic-certifications", tags=["Subtopic Certifications"])


@router.post(
    "/check",
    response_model=SubtopicCertificationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Check and issue subtopic certification"
)
def check_certification(
    data: SubtopicCertificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if user qualifies for subtopic certification and issue if eligible."""
    try:
        certification = subtopic_certification_service.check_and_issue_certification(
            db=db,
            user_id=current_user.id,
            subtopic_id=data.subtopic_id,
            topic_id=data.topic_id
        )
        
        if not certification:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not meet certification threshold yet"
            )
        
        return certification
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/my-certifications",
    response_model=List[SubtopicCertificationDetail],
    summary="Get user subtopic certifications"
)
def get_my_subtopic_certifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all subtopic certifications for the authenticated user."""
    certifications = subtopic_certification_service.get_user_subtopic_certifications(
        db=db,
        user_id=current_user.id
    )
    
    # Enrich with topic and subtopic names
    result = []
    for cert in certifications:
        from backend.models.topic import Topic, Subtopic
        topic = db.query(Topic).filter(Topic.id == cert.topic_id).first()
        subtopic = db.query(Subtopic).filter(Subtopic.id == cert.subtopic_id).first()
        
        cert_dict = SubtopicCertificationDetail.model_validate(cert)
        cert_dict.topic_name = topic.name if topic else None
        cert_dict.subtopic_name = subtopic.name if subtopic else None
        result.append(cert_dict)
    
    return result


@router.get(
    "/{certification_id}",
    response_model=SubtopicCertificationDetail,
    summary="Get subtopic certification by ID"
)
def get_subtopic_certification(
    certification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a specific subtopic certification."""
    from backend.models.subtopic_certification import SubtopicCertification
    
    certification = db.query(SubtopicCertification).filter(
        SubtopicCertification.id == certification_id,
        SubtopicCertification.user_id == current_user.id
    ).first()
    
    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found"
        )
    
    # Enrich with topic and subtopic names
    from backend.models.topic import Topic, Subtopic
    topic = db.query(Topic).filter(Topic.id == certification.topic_id).first()
    subtopic = db.query(Subtopic).filter(Subtopic.id == certification.subtopic_id).first()
    
    cert_dict = SubtopicCertificationDetail.model_validate(certification)
    cert_dict.topic_name = topic.name if topic else None
    cert_dict.subtopic_name = subtopic.name if subtopic else None
    
    return cert_dict


@router.post(
    "/verify",
    response_model=VerificationResponse,
    summary="Verify subtopic certificate (public endpoint)"
)
def verify_certificate(
    data: VerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify a subtopic certificate using its verification token (public endpoint)."""
    certification = subtopic_certification_service.verify_certificate(
        db=db,
        verification_token=data.verification_token
    )
    
    if not certification:
        return VerificationResponse(
            is_valid=False,
            certification=None
        )
    
    # Get related data
    from backend.models.topic import Topic, Subtopic
    from backend.models.user import User
    
    user = db.query(User).filter(User.id == certification.user_id).first()
    topic = db.query(Topic).filter(Topic.id == certification.topic_id).first()
    subtopic = db.query(Subtopic).filter(Subtopic.id == certification.subtopic_id).first()
    
    cert_detail = SubtopicCertificationDetail.model_validate(certification)
    cert_detail.topic_name = topic.name if topic else None
    cert_detail.subtopic_name = subtopic.name if subtopic else None
    
    return VerificationResponse(
        is_valid=True,
        certification=cert_detail,
        user_name=user.full_name if user else None,
        topic_name=topic.name if topic else None,
        subtopic_name=subtopic.name if subtopic else None,
        certified_at=certification.certified_at,
        average_score=certification.average_score,
        revocation_reason=certification.revocation_reason
    )


@router.delete(
    "/{certification_id}",
    summary="Revoke subtopic certification (admin only)"
)
def revoke_certification(
    certification_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revoke a subtopic certification (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can revoke certifications"
        )
    
    try:
        certification = subtopic_certification_service.revoke_certificate(
            db=db,
            certification_id=certification_id,
            reason=reason
        )
        return {"message": "Certification revoked successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/update-after-attempt/{attempt_id}",
    summary="Update certifications after attempt (internal)"
)
def update_certifications_after_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check and update certifications after an attempt is submitted."""
    try:
        subtopic_certification_service.update_certificate_after_attempt(
            db=db,
            attempt_id=attempt_id
        )
        return {"message": "Certifications updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
