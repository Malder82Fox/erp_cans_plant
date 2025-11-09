"""Pytest fixtures for backend tests."""
from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from erp.backend.app import app
from erp.backend.core.security import hash_password
from erp.backend.models.base import Base
from erp.backend.models.user import User, UserRole
from erp.backend.core.database import get_db_session


@pytest.fixture(scope="session")
def test_engine():
    """Return a shared in-memory SQLite engine for tests."""

    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(scope="function")
def db_session(test_engine) -> Generator[Session, None, None]:
    """Provide a transactional session seeded with a root user."""

    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    root_user = User(
        username="root",
        email="root@example.com",
        password_hash=hash_password("rootpass123"),
        role=UserRole.ROOT,
        is_active=True,
        must_change_password=False,
    )
    session.add(root_user)
    session.commit()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def client(db_session: Session):
    """Provide a TestClient wired to transactional sessions."""

    session_factory = sessionmaker(bind=db_session.bind, autoflush=False, autocommit=False)

    def _override_session() -> Generator[Session, None, None]:
        session = session_factory()
        try:
            yield session
            session.commit()
        finally:
            session.close()

    app.dependency_overrides[get_db_session] = _override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
