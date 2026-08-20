from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from fastapi.responses import JSONResponse

from backend.database import get_db
from backend.models.certificate import Certificate
from backend.models.user import User
from backend.schemas.certificate import CertificateOut
from backend.schemas.openapi import PROTECTED_ERRORS, UNAUTHORIZED
from backend.services.certificate_service import serialize_certificate
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/certificates")


@router.get(
    "/",
    response_model=List[CertificateOut],
    summary="Compatibility list route for trailing slash requests",
    responses={**UNAUTHORIZED},
)
def get_certificates_trailing_slash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_certificates(db=db, current_user=current_user)


@router.get(
    "",
    response_model=List[CertificateOut],
    summary="List my participation certificates",
    responses={**UNAUTHORIZED},
)
def get_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        certificates = (
            db.query(Certificate)
            .options(joinedload(Certificate.topic), joinedload(Certificate.user))
            .filter(Certificate.user_id == current_user.id)
            .order_by(Certificate.issued_at.desc())
            .all()
        )
        return [serialize_certificate(certificate, include_qr=True) for certificate in certificates]
    except Exception as e:
        print(f"Error in get_certificates: {e}")
        import traceback
        traceback.print_exc()
        return []


@router.get(
    "/verify/{code}",
    summary="Verify a participation certificate code",
    responses={**UNAUTHORIZED},
)
def verify_certificate_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    certificate = (
        db.query(Certificate)
        .options(joinedload(Certificate.topic), joinedload(Certificate.user))
        .filter(Certificate.certificate_id == code)
        .first()
    )
    if not certificate:
        return {"valid": False}
    return {
        "valid": True,
        "student_name": certificate.user.full_name if certificate.user else "Student",
        "topic_name": certificate.topic.name if certificate.topic else "Unknown",
        "score": certificate.score,
        "issued_at": certificate.issued_at.isoformat() if certificate.issued_at else None,
        "cert_code": certificate.certificate_id,
    }


@router.get(
    "/{certificate_id}",
    response_model=CertificateOut,
    summary="Get one participation certificate",
    responses={**UNAUTHORIZED, **PROTECTED_ERRORS},
)
def get_certificate(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    certificate = (
        db.query(Certificate)
        .options(joinedload(Certificate.topic), joinedload(Certificate.user))
        .filter(
            Certificate.certificate_id == certificate_id,
            Certificate.user_id == current_user.id,
        )
        .first()
    )
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )
    return serialize_certificate(certificate, include_qr=True)
