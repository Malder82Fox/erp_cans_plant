"""Security utilities for hashing and JWT handling."""
from __future__ import annotations
"""Security helpers for password hashing and JWT handling."""

from datetime import datetime, timedelta, timezone
from uuid import uuid4
from functools import lru_cache
from typing import Any, Dict

import bcrypt
import jwt
from passlib.context import CryptContext

from erp.backend.config import get_settings


@lru_cache()
def _get_pwd_context() -> CryptContext:
    """Return password hashing context for argon2-based hashing."""

    settings = get_settings()
    scheme = settings.password_hash_scheme.lower()
    if scheme == "argon2id":
        scheme = "argon2"
    if scheme not in {"argon2"}:
        raise ValueError("Password context available only for argon2 schemes")
    return CryptContext(schemes=[scheme], deprecated="auto")


settings = get_settings()


def hash_password(password: str) -> str:
    """Hash a plaintext password using configured scheme."""

    scheme = settings.password_hash_scheme.lower()
    if scheme == "argon2id":
        scheme = "argon2"
    if scheme == "bcrypt":
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    if scheme == "argon2":
        return _get_pwd_context().hash(password)
    raise ValueError("Unsupported password hash scheme")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored hash."""

    scheme = settings.password_hash_scheme.lower()
    normalized_hash = hashed_password.encode("utf-8")
    if normalized_hash.startswith(b"$2"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), normalized_hash)
        except ValueError:
            return False
    if scheme == "argon2id":
        scheme = "argon2"
    if scheme == "argon2":
        context = _get_pwd_context()
        return context.verify(plain_password, hashed_password)
    raise ValueError("Unsupported password hash scheme")


def _create_token(data: Dict[str, Any], expires_delta: timedelta) -> str:
    """Create a JWT token with provided expiration delta."""

    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    to_encode.update({"exp": expire, "iat": now, "jti": str(uuid4())})
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
