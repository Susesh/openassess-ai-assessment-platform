from typing import List, Optional

from pydantic import BaseModel, Field


class AnalyticsSummary(BaseModel):
    total_attempts: int = Field(..., example=12)
    average_score: float = Field(..., example=76.5)
    topics_attempted: int = Field(..., example=3)
    strongest_topic: Optional[str] = Field(None, example="Python")
    weakest_topic: Optional[str] = Field(None, example="SQL")
    pass_rate: float = Field(..., example=66.7)
    certificates_earned: int = Field(0, example=2)
    topics_mastered: int = Field(0, example=1)
    weak_areas: List[dict] = Field(default_factory=list)
    streak_days: int = Field(0, example=5)


class HeatmapItem(BaseModel):
    topic: str = Field(..., example="Python")
    attempts: int = Field(..., example=5)
    avg_score: float = Field(..., example=82.0)
    last_attempted: Optional[str] = Field(None, example="2026-05-23T10:30:00")
