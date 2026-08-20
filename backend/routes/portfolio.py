from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.models.user import User
from backend.models.portfolio import Portfolio, PortfolioShare
from backend.schemas.portfolio import PortfolioOut, PortfolioUpdate, PortfolioShareCreate, PortfolioShareOut
from backend.services.portfolio_service import PortfolioService
from backend.utils.auth_utils import get_current_user
import uuid

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/my", response_model=PortfolioOut)
def get_my_portfolio(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    portfolio = PortfolioService.get_or_create_portfolio(db, current_user.id)
    # Refresh data
    portfolio.portfolio_data = PortfolioService.aggregate_portfolio_data(db, current_user.id)
    if not portfolio.skills_summary:
        portfolio.skills_summary = portfolio.portfolio_data.get("skills_summary", "")
    db.commit()
    db.refresh(portfolio)
    return portfolio

@router.put("/my", response_model=PortfolioOut)
def update_my_portfolio(
    update_data: PortfolioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = PortfolioService.get_or_create_portfolio(db, current_user.id)
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(portfolio, key, value)
    db.commit()
    db.refresh(portfolio)
    return portfolio

@router.post("/generate-pdf")
def generate_portfolio_pdf(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    portfolio = PortfolioService.get_or_create_portfolio(db, current_user.id)
    # Ensure fresh data
    portfolio.portfolio_data = PortfolioService.aggregate_portfolio_data(db, current_user.id)
    db.commit()
    pdf_url = PortfolioService.generate_pdf(db, portfolio)
    return {"pdf_url": pdf_url}

@router.get("/{public_slug}", response_model=PortfolioOut)
def get_public_portfolio(public_slug: str, db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.public_slug == public_slug, Portfolio.is_public == True).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not public")
    
    portfolio.view_count += 1
    db.commit()
    db.refresh(portfolio)
    return portfolio

@router.post("/share", response_model=PortfolioShareOut)
def share_portfolio(
    share_data: PortfolioShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = PortfolioService.get_or_create_portfolio(db, current_user.id)
    share = PortfolioShare(
        portfolio_id=portfolio.id,
        share_type=share_data.share_type,
        share_token=str(uuid.uuid4()),
        recipient_email=share_data.recipient_email,
        expires_at=share_data.expires_at,
        max_views=share_data.max_views
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return share
