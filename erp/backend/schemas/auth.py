"""Authentication schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class TokenPair(BaseModel):
    """Access and refresh tokens."""

    access_token: str
    refresh_token: str
    token_type: str = Field(default="bearer")
    password_change_required: bool = Field(default=False)


class LoginRequest(BaseModel):
    """Login request body."""

    username: str
    password: str


class RefreshRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Request body for password change."""

    old_password: str
    new_password: str
