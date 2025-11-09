"""Database session and engine configuration."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from erp.backend.config import get_settings
from erp.backend.models.base import Base
from erp.backend.core.seeding import seed_users_if_empty


settings = get_settings()
engine = create_engine(settings.database_url, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=Session)


def init_database() -> None:
    """Create database tables in environments without migrations."""

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_users_if_empty(session)


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:  # noqa: BLE001
        session.rollback()
        raise
    finally:
        session.close()


def get_db_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""

    with session_scope() as session:
        yield session
