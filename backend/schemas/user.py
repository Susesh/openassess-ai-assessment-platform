from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


VALID_ROLES = {"student", "tutor", "employer", "university", "admin"}


class UserCreate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=120, example="Jane Doe")
    first_name: Optional[str] = Field(None, min_length=1, max_length=60, example="Jane")
    last_name: Optional[str] = Field(None, min_length=1, max_length=60, example="Doe")
    email: EmailStr = Field(..., example="jane@example.com")
    password: str = Field(..., min_length=8, max_length=72, example="securepass123")
    role: str = Field(default="student", example="student")

    def get_full_name(self) -> str:
        """Combine first_name and last_name if provided, otherwise use full_name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.full_name or ""

    def validate_role(self) -> str:
        if self.role not in VALID_ROLES:
            return "student"
        return self.role


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=120)
    current_password: Optional[str] = Field(None, min_length=8, max_length=72)
    new_password: Optional[str] = Field(None, min_length=8, max_length=72)


class TokenResponse(BaseModel):
    access_token: str = Field(..., example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    token_type: str = Field(default="bearer", example="bearer")
    role: str = Field(default="student", example="student")
