"""Repositories for user and authentication persistence."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Optional

from sqlalchemy import Select, and_, delete, func, or_, select
from sqlalchemy.orm import Session

from erp.backend.models.user import RefreshToken, User, UserAuditLog, UserRole


class UserRepository:
    """Repository providing data access for users."""

    def __init__(self, session: Session):
        self._session = session

    def get_by_username(self, username: str) -> Optional[User]:
        stmt: Select[tuple[User]] = select(User).where(func.lower(User.username) == func.lower(username))
        return self._session.execute(stmt).scalars().first()

    def get_by_email(self, email: str) -> Optional[User]:
        stmt: Select[tuple[User]] = select(User).where(func.lower(User.email) == func.lower(email))
        return self._session.execute(stmt).scalars().first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self._session.get(User, user_id)

    def _build_filter(
        self,
        *,
        role: UserRole | None = None,
        is_active: bool | None = None,
        q: str | None = None,
    ) -> Select[tuple[User]]:
        stmt: Select[tuple[User]] = select(User)
        conditions = []
        if role is not None:
            conditions.append(User.role == role)
        if is_active is not None:
            conditions.append(User.is_active.is_(is_active))
        if q:
            like_pattern = f"%{q.lower()}%"
            conditions.append(
                or_(
                    func.lower(User.username).like(like_pattern),
                    func.lower(User.email).like(like_pattern),
                )
            )
        if conditions:
            stmt = stmt.where(and_(*conditions))
        return stmt.order_by(User.username.asc())

    def list_users(
        self,
        *,
        role: UserRole | None = None,
        is_active: bool | None = None,
        q: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[User], int]:
        stmt = self._build_filter(role=role, is_active=is_active, q=q)
        total_stmt = stmt.with_only_columns(func.count()).order_by(None)
        total = self._session.execute(total_stmt).scalar_one()
        result = self._session.execute(stmt.offset(offset).limit(limit)).scalars().all()
        return result, int(total)

    def create_user(
        self,
        *,
        username: str,
        email: str | None,
        password_hash: str,
        role: UserRole,
        must_change_password: bool,
        is_active: bool = True,
    ) -> User:
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            role=role,
            is_active=is_active,
            must_change_password=must_change_password,
        )
        self._session.add(user)
        self._session.flush()
        return user

    def update_user(self, user: User, **changes: object) -> User:
        for field, value in changes.items():
            setattr(user, field, value)
        self._session.add(user)
        return user

    def delete(self, user: User, *, soft: bool) -> None:
        if soft:
            user.is_active = False
            user.must_change_password = False
            self._session.add(user)
        else:
            self._session.delete(user)


class RefreshTokenRepository:
    """Repository for managing refresh tokens."""

    def __init__(self, session: Session):
        self._session = session

    def create(self, *, user_id: int, token: str) -> RefreshToken:
        refresh = RefreshToken(user_id=user_id, token=token)
        self._session.add(refresh)
        self._session.flush()
        return refresh

    def get(self, token: str) -> Optional[RefreshToken]:
        stmt: Select[tuple[RefreshToken]] = select(RefreshToken).where(RefreshToken.token == token)
        return self._session.execute(stmt).scalars().first()

    def delete(self, token: RefreshToken) -> None:
        self._session.delete(token)
        self._session.flush()

    def delete_for_user(self, user_id: int) -> None:
        stmt = delete(RefreshToken).where(RefreshToken.user_id == user_id)
        self._session.execute(stmt)
        self._session.flush()

    def delete_all(self) -> None:
        self._session.execute(delete(RefreshToken))
        self._session.flush()


class UserAuditLogRepository:
    """Repository to persist user audit log entries."""

    def __init__(self, session: Session):
        self._session = session

    def record(
        self,
        *,
        actor_id: int | None,
        user_id: int,
        action: str,
        changes: dict | None,
    ) -> UserAuditLog:
        entry = UserAuditLog(actor_id=actor_id, user_id=user_id, action=action, changes_json=changes)
        self._session.add(entry)
        return entry

    def list_for_user(self, user_id: int) -> Iterable[UserAuditLog]:
        stmt: Select[tuple[UserAuditLog]] = select(UserAuditLog).where(UserAuditLog.user_id == user_id).order_by(
            UserAuditLog.created_at.desc()
        )
        return self._session.execute(stmt).scalars().all()
