"""User and authentication models."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from sqlalchemy import Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from erp.backend.models.base import Base


class UserRole(str, Enum):
    """Enumerates available roles."""

    USER = "user"
    ADMIN = "admin"
    ROOT = "root"


class User(Base):
    """User entity."""

    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.USER)

    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    """Refresh token persistence."""

    __tablename__ = "refresh_tokens"

    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped[User] = relationship(back_populates="refresh_tokens")
