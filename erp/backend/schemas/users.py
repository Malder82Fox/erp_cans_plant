"""User management schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from erp.backend.models.user import UserRole


class UserRead(BaseModel):
    """Representation of a user for API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str | None = None
    role: UserRole
    is_active: bool
    must_change_password: bool
    created_at: datetime
    updated_at: datetime


class UserCreateRequest(BaseModel):
    """Payload for creating a user."""

    username: str = Field(min_length=2, max_length=50)
    email: str | None = None
    role: UserRole = Field(default=UserRole.USER)
    password: str
    must_change_password: bool = Field(default=True)


class UserUpdateRequest(BaseModel):
    """Payload for updating user attributes."""

    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = None
    must_change_password: bool | None = None

    def ensure_any(self) -> None:
        """Ensure at least one field is provided."""

        if all(value is None for value in self.model_dump().values()):
            msg = "At least one field must be provided"
            raise ValueError(msg)


class UserResetPasswordRequest(BaseModel):
    """Request to reset a user's password."""

    temporary_password: str
    must_change_password: bool = Field(default=True)


class UserListResponse(BaseModel):
    """Paginated user list response."""

    items: list[UserRead]
    total: int
    page: int
    page_size: int
