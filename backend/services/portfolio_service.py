import json
import uuid
from datetime import datetime
from typing import Dict, Any, List

from sqlalchemy.orm import Session
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

from backend.models.portfolio import Portfolio, PortfolioShare, PortfolioView
from backend.models.attempt import Attempt
from backend.models.certificate import Certificate
from backend.models.topic import Topic
from backend.models.user import User

class PortfolioService:
    @staticmethod
    def get_or_create_portfolio(db: Session, user_id: int) -> Portfolio:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if not portfolio:
            portfolio = Portfolio(
                user_id=user_id,
                title="My Knowledge Portfolio",
                public_slug=str(uuid.uuid4())[:8],
            )
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)
        return portfolio

    @staticmethod
    def aggregate_portfolio_data(db: Session, user_id: int) -> Dict[str, Any]:
        """Gathers passed topics, certificates, and skills."""
        user = db.query(User).filter(User.id == user_id).first()
        
        # Get passed attempts
        passed_attempts = db.query(Attempt).filter(
            Attempt.user_id == user_id,
            Attempt.is_passed == True
        ).all()
        
        passed_topics = []
        topic_ids = set()
        for att in passed_attempts:
            if att.topic_id not in topic_ids:
                topic = db.query(Topic).filter(Topic.id == att.topic_id).first()
                if topic:
                    passed_topics.append({
                        "id": topic.id,
                        "name": topic.name,
                        "subject": topic.subject,
                        "score": att.score
                    })
                topic_ids.add(att.topic_id)
                
        # Get certificates
        certificates = db.query(Certificate).filter(Certificate.user_id == user_id).all()
        cert_data = []
        for cert in certificates:
            cert_data.append({
                "id": cert.id,
                "certificate_id": cert.certificate_id,
                "type": cert.certificate_type,
                "issued_at": cert.issued_at.isoformat() if cert.issued_at else None
            })
            
        skills_summary = "Proficient in: " + ", ".join([t["name"] for t in passed_topics]) if passed_topics else "Beginner Learner"
        
        return {
            "user": {
                "name": user.full_name,
                "email": user.email
            },
            "passed_topics": passed_topics,
            "certificates": cert_data,
            "skills_summary": skills_summary
        }

    @staticmethod
    def generate_pdf(db: Session, portfolio: Portfolio) -> str:
        """Generates a PDF for the portfolio and returns the path."""
        data = portfolio.portfolio_data or PortfolioService.aggregate_portfolio_data(db, portfolio.user_id)
        
        # Ensure certificates directory exists
        os.makedirs("certificates", exist_ok=True)
        
        pdf_filename = f"portfolio_{portfolio.user_id}_{int(datetime.utcnow().timestamp())}.pdf"
        pdf_path = os.path.join("certificates", pdf_filename)
        
        c = canvas.Canvas(pdf_path, pagesize=letter)
        c.drawString(100, 750, f"Knowledge Portfolio: {data['user']['name']}")
        c.drawString(100, 730, f"Email: {data['user']['email']}")
        c.drawString(100, 700, "Skills Summary:")
        c.drawString(120, 680, data.get("skills_summary", ""))
        
        c.drawString(100, 650, "Passed Topics:")
        y = 630
        for topic in data.get("passed_topics", []):
            c.drawString(120, y, f"- {topic['name']} ({topic.get('subject', 'N/A')})")
            y -= 20
            
        c.drawString(100, y - 20, "Certificates:")
        y -= 40
        for cert in data.get("certificates", []):
            c.drawString(120, y, f"- {cert['type']} ({cert['certificate_id']})")
            y -= 20
            
        c.save()
        
        # Update portfolio
        portfolio.pdf_url = f"/static/certificates/{pdf_filename}"
        portfolio.pdf_generated_at = datetime.utcnow()
        db.commit()
        
        return portfolio.pdf_url
