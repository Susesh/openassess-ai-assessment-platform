from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CertificateOut(BaseModel):
    id: int
    certificate_id: str
    cert_code: Optional[str] = Field(None, example="OA-2026-ABC123")
    user_id: int
    topic_id: int
    topic_name: str
    student_name: str
    certificate_type: str = Field(..., example="participation")  # 'participation' or 'achievement'
    score: int
    total: int = Field(..., example=10)
    percentage: float
    issued_at: datetime
    pdf_url: Optional[str] = None
    qr_code_data_url: Optional[str] = None

    model_config = {"from_attributes": True}
