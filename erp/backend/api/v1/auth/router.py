"""Authentication routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from erp.backend.core.auth import get_current_user
from erp.backend.core.database import get_db_session
from erp.backend.models.user import User
from erp.backend.schemas.auth import ChangePasswordRequest, LoginRequest, RefreshRequest, TokenPair
from erp.backend.services.auth import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


def get_auth_service(session: Session = Depends(get_db_session)) -> AuthService:
    """Dependency providing an AuthService instance."""

    return AuthService(session)


@router.post("/login", response_model=TokenPair)
def login(
    payload: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    """Authenticate a user with username and password."""

    client_ip = request.client.host if request.client else None
    return service.login(payload, client_ip=client_ip)


@router.post("/refresh", response_model=TokenPair)
def refresh_token(request: RefreshRequest, service: AuthService = Depends(get_auth_service)) -> TokenPair:
    """Refresh authentication tokens."""

    return service.refresh(request.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> Response:
    """Invalidate refresh tokens for the current user."""

    service.logout(current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> Response:
    """Change password for the current user."""

    service.change_password(current_user, payload)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


