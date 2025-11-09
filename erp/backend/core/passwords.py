"""Password validation helpers."""
from __future__ import annotations

import re

from erp.backend.config import get_settings


class PasswordValidationError(ValueError):
    """Raised when password does not satisfy policy."""


_UPPER_RE = re.compile(r"[A-Z]")
_LOWER_RE = re.compile(r"[a-z]")
_DIGIT_RE = re.compile(r"[0-9]")
_SPECIAL_RE = re.compile(r"[^A-Za-z0-9]")


def validate_password(password: str) -> None:
    """Validate a password against configured policy.

    Args:
        password: Candidate password string.

    Raises:
        PasswordValidationError: If password violates configured policy.
    """

    settings = get_settings()
    if len(password) < settings.password_min_length:
        raise PasswordValidationError(
            f"Password must be at least {settings.password_min_length} characters long."
        )
    if settings.password_require_uppercase and not _UPPER_RE.search(password):
        raise PasswordValidationError("Password must include an uppercase letter.")
    if settings.password_require_lowercase and not _LOWER_RE.search(password):
        raise PasswordValidationError("Password must include a lowercase letter.")
    if settings.password_require_digit and not _DIGIT_RE.search(password):
        raise PasswordValidationError("Password must include a digit.")
    if settings.password_require_special and not _SPECIAL_RE.search(password):
        raise PasswordValidationError("Password must include a special character.")
