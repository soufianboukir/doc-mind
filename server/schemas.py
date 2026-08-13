from pydantic import BaseModel, ConfigDict, EmailStr, Field
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    display_name: str | None = Field(
        default=None,
        max_length=100,
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    display_name: str | None
    avatar_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    user: UserOut
