"""Authentication schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from erp.backend.models.user import UserRole


class TokenPair(BaseModel):
    """Access and refresh tokens."""

    access_token: str
    refresh_token: str
    token_type: str = Field(default="bearer")


class LoginRequest(BaseModel):
    """Login request body."""

    username: str
    password: str


class RefreshRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str


class UserCreate(BaseModel):
    """Payload for creating a user."""

    username: str
    full_name: str
    email: EmailStr | None = None
    password: str = Field(min_length=8)
    role: UserRole = UserRole.USER


class UserRead(BaseModel):
    """User representation for responses."""

    id: int
    username: str
    full_name: str
    email: str | None = None
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}
