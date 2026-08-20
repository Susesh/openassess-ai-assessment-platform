from datetime import datetime
from sqlalchemy import Column, DateTime, String, Boolean, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from backend.database import Base


class Portfolio(Base):
    """User knowledge portfolios for resume-ready skill documentation."""
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Portfolio metadata
    title = Column(String, default="My Knowledge Portfolio")
    summary = Column(Text, nullable=True)
    skills_summary = Column(Text, nullable=True)  # Auto-generated skills summary
    
    # Public sharing
    is_public = Column(Boolean, default=False)
    public_slug = Column(String, unique=True, nullable=True, index=True)  # URL-friendly identifier
    share_token = Column(String, unique=True, nullable=True)  # For private sharing
    
    # Portfolio content (cached)
    portfolio_data = Column(JSON, nullable=True)  # Cached portfolio content
    
    # PDF generation
    pdf_url = Column(String, nullable=True)
    pdf_generated_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_viewed_at = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="portfolio")
    shares = relationship("PortfolioShare", back_populates="portfolio", cascade="all, delete-orphan")
    views = relationship("PortfolioView", back_populates="portfolio", cascade="all, delete-orphan")


class PortfolioShare(Base):
    """Track portfolio shares and access."""
    __tablename__ = "portfolio_shares"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    
    # Share details
    share_type = Column(String, nullable=False)  # 'public', 'private_link', 'email'
    share_token = Column(String, unique=True, nullable=True)
    recipient_email = Column(String, nullable=True)
    
    # Access control
    expires_at = Column(DateTime, nullable=True)
    max_views = Column(Integer, nullable=True)
    view_count = Column(Integer, default=0)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    last_accessed_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="shares")


class PortfolioView(Base):
    """Track portfolio views for analytics."""
    __tablename__ = "portfolio_views"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    
    # Viewer information
    viewer_ip = Column(String, nullable=True)
    viewer_user_agent = Column(String, nullable=True)
    referrer = Column(String, nullable=True)
    
    # Share context
    share_id = Column(Integer, ForeignKey("portfolio_shares.id"), nullable=True)
    
    # Timestamp
    viewed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    portfolio = relationship("Portfolio")
