"""User management routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from erp.backend.core.auth import get_current_user, require_role
from erp.backend.core.database import get_db_session
from erp.backend.models.user import User, UserRole
from erp.backend.schemas.users import (
    UserCreateRequest,
    UserRead,
    UserResetPasswordRequest,
    UserUpdateRequest,
    UserListResponse,
)
from erp.backend.services.users import UserService

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


def get_user_service(session: Session = Depends(get_db_session)) -> UserService:
    """Dependency providing the user service."""

    return UserService(session)


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    """Return authenticated user profile."""

    return current_user


@router.get("", response_model=UserListResponse)
def list_users(
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ROOT)),
    service: UserService = Depends(get_user_service),
) -> UserListResponse:
    """List users with optional filtering (root only)."""

    users, total = service.list_users(
        actor=current_user,
        role=role,
        is_active=is_active,
        q=q,
        page=page,
        page_size=page_size,
    )
    items = [UserRead.model_validate(user) for user in users]
    return UserListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    current_user: User = Depends(require_role(UserRole.ROOT)),
    service: UserService = Depends(get_user_service),
) -> UserRead:
    """Create a new user (root only)."""

    user = service.create_user(actor=current_user, payload=payload)
    return UserRead.model_validate(user)


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    current_user: User = Depends(require_role(UserRole.ROOT)),
    service: UserService = Depends(get_user_service),
) -> UserRead:
    """Update user role, activation state, or password (root only)."""

    try:
        updated_user = service.update_user(actor=current_user, user_id=user_id, payload=payload)
    except ValueError as exc:  # from ensure_any
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return UserRead.model_validate(updated_user)


@router.post("/{user_id}/reset-password", response_model=UserRead)
def reset_password(
    user_id: int,
    payload: UserResetPasswordRequest,
    current_user: User = Depends(require_role(UserRole.ROOT)),
    service: UserService = Depends(get_user_service),
) -> UserRead:
    """Reset user password with a temporary one (root only)."""

    user = service.reset_password(actor=current_user, user_id=user_id, payload=payload)
    return UserRead.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.ROOT)),
    service: UserService = Depends(get_user_service),
) -> Response:
    """Soft delete or hard delete a user depending on configuration."""

    service.delete_user(actor=current_user, user_id=user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
