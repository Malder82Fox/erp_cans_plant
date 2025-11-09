"""User management service."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from erp.backend.config import get_settings
from erp.backend.core.passwords import PasswordValidationError, validate_password
from erp.backend.core.security import hash_password
from erp.backend.models.user import User, UserRole
from erp.backend.repositories.user import RefreshTokenRepository, UserAuditLogRepository, UserRepository
from erp.backend.schemas.users import UserCreateRequest, UserResetPasswordRequest, UserUpdateRequest


class UserService:
    """Service orchestrating user management workflows."""

    def __init__(self, session: Session):
        self._settings = get_settings()
        self.users = UserRepository(session)
        self.refresh_tokens = RefreshTokenRepository(session)
        self.audit_logs = UserAuditLogRepository(session)

    def ensure_root(self, actor: User) -> None:
        if actor.role != UserRole.ROOT:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Root role required")

    def list_users(
        self,
        *,
        actor: User,
        role: UserRole | None,
        is_active: bool | None,
        q: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[User], int]:
        self.ensure_root(actor)
        offset = (page - 1) * page_size
        users, total = self.users.list_users(role=role, is_active=is_active, q=q, offset=offset, limit=page_size)
        return users, total

    def create_user(self, *, actor: User, payload: UserCreateRequest) -> User:
        self.ensure_root(actor)
        existing = self.users.get_by_username(payload.username)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
        if payload.email:
            if "@" not in payload.email:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
            if self.users.get_by_email(payload.email):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
        try:
            validate_password(payload.password)
        except PasswordValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        password_hash = hash_password(payload.password)
        user = self.users.create_user(
            username=payload.username,
            email=payload.email,
            password_hash=password_hash,
            role=payload.role,
            must_change_password=payload.must_change_password,
        )
        self.audit_logs.record(
            actor_id=actor.id,
            user_id=user.id,
            action="create",
            changes={
                "role": payload.role,
                "is_active": True,
                "must_change_password": payload.must_change_password,
            },
        )
        return user

    def update_user(self, *, actor: User, user_id: int, payload: UserUpdateRequest) -> User:
        self.ensure_root(actor)
        payload.ensure_any()
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        changes: dict[str, object] = {}
        if payload.role is not None:
            changes["role"] = payload.role
        if payload.is_active is not None:
            changes["is_active"] = payload.is_active
        if payload.password is not None:
            try:
                validate_password(payload.password)
            except PasswordValidationError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
            changes["password_hash"] = hash_password(payload.password)
            changes.setdefault("must_change_password", True)
        if payload.must_change_password is not None:
            changes["must_change_password"] = payload.must_change_password
        if not changes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes provided")
        updated_user = self.users.update_user(user, **changes)
        if "password_hash" in changes:
            self.refresh_tokens.delete_for_user(user.id)
        if "is_active" in changes and not bool(changes["is_active"]):
            self.refresh_tokens.delete_for_user(user.id)
        self.audit_logs.record(
            actor_id=actor.id,
            user_id=user.id,
            action="update",
            changes={key: value for key, value in changes.items() if key != "password_hash"},
        )
        return updated_user

    def reset_password(self, *, actor: User, user_id: int, payload: UserResetPasswordRequest) -> User:
        self.ensure_root(actor)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        try:
            validate_password(payload.temporary_password)
        except PasswordValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        new_hash = hash_password(payload.temporary_password)
        updated_user = self.users.update_user(
            user,
            password_hash=new_hash,
            must_change_password=payload.must_change_password,
            is_active=True,
        )
        self.refresh_tokens.delete_for_user(user.id)
        self.audit_logs.record(
            actor_id=actor.id,
            user_id=user.id,
            action="reset_password",
            changes={"must_change_password": payload.must_change_password},
        )
        return updated_user

    def delete_user(self, *, actor: User, user_id: int) -> None:
        self.ensure_root(actor)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        soft = self._settings.user_soft_delete_enabled
        self.users.delete(user, soft=soft)
        self.refresh_tokens.delete_for_user(user.id)
        self.audit_logs.record(
            actor_id=actor.id,
            user_id=user.id,
            action="delete" if not soft else "deactivate",
            changes={"soft_delete": soft},
        )
