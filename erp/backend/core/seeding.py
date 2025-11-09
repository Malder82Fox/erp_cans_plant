"""Database seeding utilities."""
from __future__ import annotations

from sqlalchemy.orm import Session

from erp.backend.config import get_settings
from erp.backend.core.security import hash_password
from erp.backend.models.user import User, UserRole, UserAuditLog


def seed_users_if_empty(session: Session) -> None:
    """Seed default users if the users table is empty."""

    if session.query(User).count() > 0:
        return

    settings = get_settings()
    root_password = settings.seed_root_password
    admin_password = settings.seed_admin_password
    user_password = settings.seed_user_password
    if not all([root_password, admin_password, user_password]):
        return

    seed_data = [
        {
            "username": "root",
            "email": "root@example.com",
            "role": UserRole.ROOT,
            "password": root_password,
        },
        {
            "username": "admin",
            "email": "admin@example.com",
            "role": UserRole.ADMIN,
            "password": admin_password,
        },
        {
            "username": "user",
            "email": "user@example.com",
            "role": UserRole.USER,
            "password": user_password,
        },
    ]

    for entry in seed_data:
        user = User(
            username=entry["username"],
            email=entry["email"],
            role=entry["role"],
            password_hash=hash_password(entry["password"]),
            must_change_password=False,
            is_active=True,
        )
        session.add(user)
        session.flush()
        audit = UserAuditLog(
            actor_id=None,
            user_id=user.id,
            action="seed_create",
            changes_json={"role": entry["role"]},
        )
        session.add(audit)
    session.commit()
