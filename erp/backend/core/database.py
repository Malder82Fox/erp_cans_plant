"""Database session and engine configuration."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import MetaData, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from erp.backend.config import get_settings
from erp.backend.models.base import Base


settings = get_settings()
engine = create_engine(settings.database_url, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=Session)


def create_database_schema(
    target_engine: Engine | None = None,
    metadata: MetaData | None = None,
) -> int:
    """Create database tables for the provided SQLAlchemy metadata.

    Args:
        target_engine: Optional engine override. Defaults to the configured engine.
        metadata: Optional SQLAlchemy metadata. Defaults to the project's base metadata.

    Returns:
        The number of tables tracked by the provided metadata.
    """

    metadata_obj = metadata or Base.metadata
    engine_obj = target_engine or engine
    metadata_obj.create_all(bind=engine_obj)
    return len(metadata_obj.tables)


def render_database_url(target_engine: Engine | None = None, *, hide_password: bool = True) -> str:
    """Return the database URL string for logging without leaking secrets."""

    engine_obj = target_engine or engine
    return engine_obj.url.render_as_string(hide_password=hide_password)


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
