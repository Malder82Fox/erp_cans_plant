"""Authentication service layer."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from erp.backend.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from erp.backend.models.user import User, UserRole
from erp.backend.repositories.auth import RefreshTokenRepository, UserRepository
from erp.backend.schemas.auth import LoginRequest, TokenPair, UserCreate


class AuthService:
    """Service orchestrating authentication workflows."""

    def __init__(self, session: Session):
        self.users = UserRepository(session)
        self.refresh_tokens = RefreshTokenRepository(session)
        self.session = session

    def login(self, payload: LoginRequest) -> TokenPair:
        user = self.users.get_by_username(payload.username)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        access_token = create_access_token(subject=user.username)
        refresh_token = create_refresh_token(subject=user.username)
        self.refresh_tokens.create(user_id=user.id, token=refresh_token)
        return TokenPair(access_token=access_token, refresh_token=refresh_token)

    def refresh(self, refresh_token: str) -> TokenPair:
        token_entry = self.refresh_tokens.get(refresh_token)
        if not token_entry:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        access_token = create_access_token(subject=token_entry.user.username)
        new_refresh = create_refresh_token(subject=token_entry.user.username)
        self.refresh_tokens.delete(token_entry)
        self.refresh_tokens.create(user_id=token_entry.user_id, token=new_refresh)
        return TokenPair(access_token=access_token, refresh_token=new_refresh)

    def logout(self, user: User) -> None:
        self.refresh_tokens.delete_for_user(user.id)

    def create_user(self, payload: UserCreate, creator: User) -> User:
        if creator.role != UserRole.ROOT:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only root can create users")
        if self.users.get_by_username(payload.username):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

        password_hash = hash_password(payload.password)
        user = self.users.create_user(
            username=payload.username,
            full_name=payload.full_name,
            password_hash=password_hash,
            role=payload.role,
            email=payload.email,
        )
        return user

    def list_users(self, requester: User) -> list[User]:
        if requester.role not in (UserRole.ADMIN, UserRole.ROOT):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return self.users.list_users()
