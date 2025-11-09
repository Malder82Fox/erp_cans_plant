"""Authentication routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from erp.backend.core.auth import get_current_user
from erp.backend.core.database import get_db_session
from erp.backend.models.user import User
from erp.backend.schemas.auth import LoginRequest, RefreshRequest, TokenPair, UserCreate, UserRead
from erp.backend.services.auth import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


def get_auth_service(session: Session = Depends(get_db_session)) -> AuthService:
    """Dependency providing an AuthService instance."""

    return AuthService(session)


@router.post("/login", response_model=TokenPair)
def login(form_data: OAuth2PasswordRequestForm = Depends(), service: AuthService = Depends(get_auth_service)) -> TokenPair:
    """Authenticate a user with username and password."""

    payload = LoginRequest(username=form_data.username, password=form_data.password)
    return service.login(payload)


@router.post("/refresh", response_model=TokenPair)
def refresh_token(request: RefreshRequest, service: AuthService = Depends(get_auth_service)) -> TokenPair:
    """Refresh authentication tokens."""

    return service.refresh(request.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: User = Depends(get_current_user), service: AuthService = Depends(get_auth_service)) -> None:
    """Invalidate refresh tokens for the current user."""

    service.logout(current_user)


@router.get("/users/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    """Return authenticated user profile."""

    return current_user


@router.get("/users", response_model=list[UserRead])
def list_users(
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> list[User]:
    """List users (admin/root only)."""

    return service.list_users(current_user)


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> User:
    """Create a new user (root only)."""

    return service.create_user(payload, creator=current_user)
