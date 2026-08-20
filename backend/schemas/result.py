from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ResultSummaryOut(BaseModel):
    attempt_id: int
    topic_id: int
    topic_name: str
    score: int
    total: int
    percentage: float
    passed: bool
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
