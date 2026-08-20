from datetime import datetime
from uuid import uuid4
import base64
import os
import secrets
import uuid
from io import BytesIO
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
import qrcode

from backend.models.certificate import Certificate
from backend.models.topic import Topic
from backend.models.user import User
from backend.models.attempt import Attempt
from backend.schemas.certificate import CertificateOut


CERTIFICATE_SAVE_DIR = "certificates"
os.makedirs(CERTIFICATE_SAVE_DIR, exist_ok=True)


def build_certificate_code(issued_at: datetime | None = None) -> str:
    issued = issued_at or datetime.utcnow()
    return f"OA-{issued.year}-{uuid4().hex[:6].upper()}"


def generate_certificate_number(db: Session) -> str:
    """Generate unique certificate number in format AG-CERT-2026-000001."""
    year = datetime.utcnow().year
    last_cert = db.query(Certificate).order_by(Certificate.id.desc()).first()
    
    if last_cert:
        # Extract sequence number and increment
        try:
            last_number = int(last_cert.certificate_id.split("-")[-1])
            new_number = last_number + 1
        except:
            new_number = 1
    else:
        new_number = 1
    
    return f"AG-CERT-{year}-{new_number:06d}"


def generate_verification_token() -> str:
    """Generate a unique verification token."""
    return str(uuid.uuid4())


def create_verification_qr_code(certificate_id: str) -> str:
    """
    Create QR code for certificate verification.
    
    Returns:
        Path to QR code image
    """
    # Create QR code with verification URL
    verification_url = f"https://www.antigravity.com/verify-certificate/{certificate_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code image
    qr_path = os.path.join(CERTIFICATE_SAVE_DIR, f"qr_{certificate_id}.png")
    qr_img.save(qr_path)
    
    return qr_path


def generate_certificate_pdf(
    user: User,
    topic: Topic,
    attempt: Attempt,
    certificate_number: str,
    verification_token: str
) -> Tuple[str, str]:
    """
    Generate a professional PDF certificate.
    
    Returns:
        Tuple of (pdf_path, pdf_filename)
    """
    # Create QR code
    qr_path = create_verification_qr_code(certificate_number)
    
    # Generate PDF file name
    pdf_filename = f"certificate_{certificate_number}.pdf"
    pdf_path = os.path.join(CERTIFICATE_SAVE_DIR, pdf_filename)
    
    # Create PDF
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4
    
    # Set background color
    c.setFillColor(HexColor("#FFFFFF"))
    c.rect(0, 0, width, height, fill=1)
    
    # Draw border
    c.setLineWidth(3)
    c.setStrokeColor(HexColor("#2C3E50"))
    c.rect(0.5*inch, 0.5*inch, width-inch, height-inch)
    
    # Draw decorative top bar
    c.setFillColor(HexColor("#3498DB"))
    c.rect(0.5*inch, height-1.5*inch, width-inch, 1*inch, fill=1)
    
    # Title
    c.setFont("Helvetica-Bold", 48)
    c.setFillColor(HexColor("#FFFFFF"))
    c.drawString(1.5*inch, height-1*inch, "CERTIFICATE")
    
    # Subtitle
    c.setFont("Helvetica", 14)
    c.setFillColor(HexColor("#FFFFFF"))
    c.drawString(1.5*inch, height-1.3*inch, "of Completion")
    
    # Reset color for body
    c.setFillColor(HexColor("#2C3E50"))
    
    # Platform name
    c.setFont("Helvetica-Bold", 16)
    c.drawString(1.5*inch, height-2.2*inch, "Anti Gravity Platform")
    
    # Certificate number
    c.setFont("Helvetica", 10)
    c.drawString(1.5*inch, height-2.5*inch, f"Certificate No: {certificate_number}")
    
    # Main content
    y_position = height - 3.2*inch
    
    c.setFont("Helvetica", 11)
    c.drawString(1.5*inch, y_position, "This is to certify that")
    
    y_position -= 0.5*inch
    c.setFont("Helvetica-Bold", 24)
    c.drawString(1.5*inch, y_position, user.full_name)
    
    y_position -= 0.6*inch
    c.setFont("Helvetica", 11)
    c.drawString(1.5*inch, y_position, "has successfully completed the assessment:")
    
    y_position -= 0.5*inch
    c.setFont("Helvetica-Bold", 16)
    c.drawString(1.5*inch, y_position, topic.name)
    
    # Quiz details
    y_position -= 0.7*inch
    c.setFont("Helvetica", 11)
    
    details = [
        f"Subject: {topic.subject or 'General'}",
        f"Score: {attempt.score}/{attempt.total_questions}",
        f"Percentage: {attempt.percentage}%",
        f"Completion Date: {attempt.completed_at.strftime('%d %B %Y') if attempt.completed_at else 'N/A'}",
    ]
    
    for detail in details:
        c.drawString(1.5*inch, y_position, detail)
        y_position -= 0.3*inch
    
    # QR Code
    y_position -= 0.3*inch
    c.drawString(5*inch, y_position, "Scan to Verify:")
    y_position -= 0.3*inch
    c.drawImage(qr_path, 5*inch, y_position-1*inch, width=1*inch, height=1*inch)
    
    # Footer
    y_position = 1.2*inch
    c.setFont("Helvetica-Italic", 9)
    c.drawString(1.5*inch, y_position, f"Verification Token: {verification_token[:16]}...")
    
    c.setFont("Helvetica", 9)
    c.drawString(1.5*inch, y_position-0.3*inch, "This certificate is digitally verified and cannot be forged.")
    c.drawString(1.5*inch, y_position-0.6*inch, "Visit https://www.antigravity.com/verify-certificate to confirm authenticity.")
    
    # Signature line
    c.setFont("Helvetica", 10)
    c.drawString(2*inch, 0.8*inch, "_________________")
    c.drawString(2*inch, 0.5*inch, "Authorized Signature")
    
    c.drawString(5*inch, 0.8*inch, "_________________")
    c.drawString(5*inch, 0.5*inch, "Date")
    
    c.save()
    
    return pdf_path, pdf_filename


def _build_qr_data_url(certificate_id: str) -> str | None:
    """Return a base64 data URL for a certificate verification QR image."""
    try:
        qr_path = os.path.join(CERTIFICATE_SAVE_DIR, f"qr_{certificate_id}.png")
        if not os.path.exists(qr_path):
            qr_path = create_verification_qr_code(certificate_id)

        with open(qr_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("ascii")
        return f"data:image/png;base64,{encoded}"
    except Exception:
        # Non-blocking: certificate data should still be returned if QR generation fails.
        return None


def serialize_certificate(
    certificate: Certificate,
    total: int = 10,
    include_qr: bool = False,
) -> CertificateOut:
    qr_code_data_url = _build_qr_data_url(certificate.certificate_id) if include_qr else None
    actual_total = total
    if certificate.attempt and getattr(certificate.attempt, "total_questions", None):
        actual_total = certificate.attempt.total_questions

    cert_code = certificate.certificate_id or certificate.verification_token or build_certificate_code(certificate.issued_at)
    return CertificateOut(
        id=certificate.id,
        certificate_id=certificate.certificate_id,
        cert_code=cert_code,
        user_id=certificate.user_id,
        topic_id=certificate.topic_id,
        topic_name=certificate.topic.name if certificate.topic else "Unknown",
        student_name=certificate.user.full_name if certificate.user else "Student",
        certificate_type=certificate.certificate_type,
        score=certificate.score,
        total=actual_total,
        percentage=certificate.percentage,
        issued_at=certificate.issued_at,
        pdf_url=certificate.pdf_url,
        qr_code_data_url=qr_code_data_url,
    )


def create_participation_certificate(
    db: Session,
    user: User,
    topic: Topic,
    score: int,
    total: int,
    attempt: Attempt | None = None,
) -> Certificate:
    """Create a participation certificate (generated for every completed assessment)."""
    percentage = round((score / total) * 100, 1) if total else 0.0
    issued_at = datetime.utcnow()
    certificate = Certificate(
        certificate_id=build_certificate_code(issued_at),
        user_id=user.id,
        topic_id=topic.id,
        attempt_id=attempt.id if attempt else None,
        certificate_type="participation",
        score=score,
        percentage=percentage,
        issued_at=issued_at,
        pdf_url=None,
    )
    db.add(certificate)
    db.flush()
    return certificate


def create_achievement_certificate(
    db: Session,
    user: User,
    topic: Topic,
    score: int,
    total: int,
    attempt: Attempt | None = None,
) -> Certificate | None:
    """Create an achievement certificate only if score >= 70%."""
    percentage = round((score / total) * 100, 1) if total else 0.0
    
    # Only create achievement certificate if score >= 70%
    if percentage < 70:
        return None
    
    issued_at = datetime.utcnow()
    certificate = Certificate(
        certificate_id=build_certificate_code(issued_at),
        user_id=user.id,
        topic_id=topic.id,
        attempt_id=attempt.id if attempt else None,
        certificate_type="achievement",
        score=score,
        percentage=percentage,
        issued_at=issued_at,
        pdf_url=None,
    )
    db.add(certificate)
    db.flush()
    return certificate


def create_certificates_for_assessment(
    db: Session,
    user: User,
    topic: Topic,
    score: int,
    total: int,
    attempt: Attempt | None = None,
) -> tuple[Certificate, Certificate | None]:
    """
    Create certificates after assessment completion.
    Always creates participation certificate.
    Creates achievement certificate only if score >= 70%.
    Returns: (participation_cert, achievement_cert or None)
    """
    participation_cert = create_participation_certificate(db, user, topic, score, total, attempt=attempt)
    achievement_cert = create_achievement_certificate(db, user, topic, score, total, attempt=attempt)
    return participation_cert, achievement_cert
