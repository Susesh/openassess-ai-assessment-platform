from datetime import datetime
from pydantic import BaseModel, Field


class CertificationGenerate(BaseModel):
    topic_id: int = Field(..., example=1)


class CertificationOut(BaseModel):
    id: int
    topic_id: int
    topic_name: str
    score: float
    issued_at: datetime
    certificate_code: str

    model_config = {"from_attributes": True}
