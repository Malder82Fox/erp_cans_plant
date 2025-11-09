"""Repositories for authentication domain."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from erp.backend.models.user import RefreshToken, User, UserRole


class UserRepository:
    """Repository to handle user persistence."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_username(self, username: str) -> Optional[User]:
        return self.session.query(User).filter(User.username == username).first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.session.get(User, user_id)

    def list_users(self) -> list[User]:
        return self.session.query(User).all()

    def create_user(self, username: str, full_name: str, password_hash: str, role: UserRole, email: str | None) -> User:
        user = User(username=username, full_name=full_name, hashed_password=password_hash, role=role, email=email)
        self.session.add(user)
        return user


class RefreshTokenRepository:
    """Repository for refresh token persistence."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, user_id: int, token: str) -> RefreshToken:
        refresh = RefreshToken(user_id=user_id, token=token)
        self.session.add(refresh)
        return refresh

    def get(self, token: str) -> Optional[RefreshToken]:
        return self.session.query(RefreshToken).filter(RefreshToken.token == token).first()

    def delete(self, token: RefreshToken) -> None:
        self.session.delete(token)

    def delete_for_user(self, user_id: int) -> None:
        self.session.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
