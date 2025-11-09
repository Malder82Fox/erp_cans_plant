"""Security utilities for hashing and JWT handling."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
from passlib.context import CryptContext

from erp.backend.config import get_settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a hash."""

    return pwd_context.verify(plain_password, hashed_password)


def _create_token(data: Dict[str, Any], expires_delta: timedelta) -> str:
    """Create a JWT token with provided expiration delta."""

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_access_token(subject: str) -> str:
    """Create an access token for the given subject."""

    return _create_token({"sub": subject, "type": "access"}, timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(subject: str) -> str:
    """Create a refresh token for the given subject."""

    return _create_token(
        {"sub": subject, "type": "refresh"}, timedelta(minutes=settings.refresh_token_expire_minutes)
    )


def decode_token(token: str) -> Dict[str, Any]:
    """Decode a JWT token and return payload."""

    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
