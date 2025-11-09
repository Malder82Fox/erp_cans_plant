"""Authentication dependencies."""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from erp.backend.core.database import get_db_session
from erp.backend.core.security import decode_token
from erp.backend.models.user import User, UserRole


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(db: Session = Depends(get_db_session), token: str = Depends(oauth2_scheme)) -> User:
    """Retrieve the currently authenticated user from JWT token."""

    try:
        payload = decode_token(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is deactivated")

    return user


class RoleChecker:
    """Dependency callable ensuring the user has one of the required roles."""

    def __init__(self, allowed_roles: tuple[UserRole, ...]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        if current_user.must_change_password:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Password change required before accessing this resource",
            )
        return current_user


def require_roles(*roles: UserRole) -> RoleChecker:
    """Return a dependency that checks whether current user has one of the roles."""

    return RoleChecker(allowed_roles=roles)


def require_role(role: UserRole) -> RoleChecker:
    """Return dependency ensuring user has the specified role."""

    return RoleChecker(allowed_roles=(role,))


def require_any(*roles: UserRole) -> RoleChecker:
    """Return dependency ensuring user has any of the provided roles."""

    return RoleChecker(allowed_roles=roles)
