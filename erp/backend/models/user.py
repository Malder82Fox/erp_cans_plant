"""User and authentication models."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, JSON, String
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
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.USER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)

    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[List["UserAuditLog"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", foreign_keys="UserAuditLog.user_id"
    )
    acted_audit_logs: Mapped[List["UserAuditLog"]] = relationship(
        back_populates="actor", cascade="all, delete-orphan", foreign_keys="UserAuditLog.actor_id"
    )


class RefreshToken(Base):
    """Refresh token persistence."""

    __tablename__ = "refresh_tokens"

    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped[User] = relationship(back_populates="refresh_tokens")


class UserAuditLog(Base):
    """Audit trail for user management actions."""

    __tablename__ = "user_audit_logs"

    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    action: Mapped[str] = mapped_column(String(100))
    changes_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    actor: Mapped[Optional[User]] = relationship(
        "User", foreign_keys=[actor_id], back_populates="acted_audit_logs"
    )
    user: Mapped[User] = relationship("User", foreign_keys=[user_id], back_populates="audit_logs")
