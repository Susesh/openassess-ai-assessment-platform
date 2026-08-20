from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str = Field(..., example="OpenAssess backend is running!")


class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    version: str = Field(..., example="1.0.0")
    db_status: str = Field(..., example="connected")


class ErrorResponse(BaseModel):
    detail: str = Field(..., example="Resource not found")
