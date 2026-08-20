from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class PortfolioBase(BaseModel):
    title: str = "My Knowledge Portfolio"
    summary: Optional[str] = None
    is_public: bool = False


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(PortfolioBase):
    pass


class PortfolioOut(PortfolioBase):
    id: int
    user_id: int
    skills_summary: Optional[str] = None
    public_slug: Optional[str] = None
    portfolio_data: Optional[Dict[str, Any]] = None
    pdf_url: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    view_count: int

    class Config:
        from_attributes = True


class PortfolioShareCreate(BaseModel):
    share_type: str
    recipient_email: Optional[str] = None
    expires_at: Optional[datetime] = None
    max_views: Optional[int] = None


class PortfolioShareOut(BaseModel):
    id: int
    portfolio_id: int
    share_type: str
    share_token: Optional[str] = None
    recipient_email: Optional[str] = None
    expires_at: Optional[datetime] = None
    max_views: Optional[int] = None
    view_count: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
