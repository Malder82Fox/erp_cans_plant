"""Authentication service layer."""
from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import DefaultDict, Deque

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from erp.backend.config import get_settings
from erp.backend.core.passwords import PasswordValidationError, validate_password
from erp.backend.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from erp.backend.models.user import User
from erp.backend.repositories.user import RefreshTokenRepository, UserAuditLogRepository, UserRepository
from erp.backend.schemas.auth import ChangePasswordRequest, LoginRequest, TokenPair


class LoginRateLimiter:
    """In-memory rate limiter for login attempts."""

    def __init__(self, limit: int, window: timedelta):
        self._limit = limit
        self._window = window
        self._attempts: DefaultDict[str, Deque[datetime]] = defaultdict(deque)

    def hit(self, key: str | None) -> None:
        """Record an attempt and enforce rate limit."""

        if key is None:
            return
        now = datetime.utcnow()
        attempts = self._attempts[key]
        threshold = now - self._window
        while attempts and attempts[0] < threshold:
            attempts.popleft()
        if len(attempts) >= self._limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts")
        attempts.append(now)


class AuthService:
    """Service orchestrating authentication workflows."""

    def __init__(self, session: Session):
        settings = get_settings()
        self.users = UserRepository(session)
        self.refresh_tokens = RefreshTokenRepository(session)
        self.audit_logs = UserAuditLogRepository(session)
        self.session = session
        self.rate_limiter = LoginRateLimiter(
            limit=settings.login_rate_limit_per_minute,
            window=timedelta(minutes=settings.login_rate_limit_window_minutes),
        )

    def login(self, payload: LoginRequest, *, client_ip: str | None) -> TokenPair:
        self.rate_limiter.hit(client_ip)
        user = self.users.get_by_username(payload.username)
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is deactivated")

        access_token = create_access_token(subject=user.username)
        refresh_token = create_refresh_token(subject=user.username)
        self.refresh_tokens.create(user_id=user.id, token=refresh_token)

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            password_change_required=user.must_change_password,
        )

    def refresh(self, refresh_token: str) -> TokenPair:
        token_entry = self.refresh_tokens.get(refresh_token)
        if not token_entry or not token_entry.user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        access_token = create_access_token(subject=token_entry.user.username)
        new_refresh = create_refresh_token(subject=token_entry.user.username)
        self.refresh_tokens.delete(token_entry)
        self.refresh_tokens.create(user_id=token_entry.user_id, token=new_refresh)
        return TokenPair(
            access_token=access_token,
            refresh_token=new_refresh,
            password_change_required=token_entry.user.must_change_password,
        )

    def logout(self, user: User) -> None:
        self.refresh_tokens.delete_for_user(user.id)

    def change_password(self, user: User, payload: ChangePasswordRequest) -> None:
        if not verify_password(payload.old_password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect")
        try:
            validate_password(payload.new_password)
        except PasswordValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        new_hash = hash_password(payload.new_password)
        self.users.update_user(
            user,
            password_hash=new_hash,
            must_change_password=False,
        )
        self.refresh_tokens.delete_for_user(user.id)
        self.audit_logs.record(
            actor_id=user.id,
            user_id=user.id,
            action="change_password",
            changes={"must_change_password": False},
        )
