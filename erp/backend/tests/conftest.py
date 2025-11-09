"""Pytest fixtures for backend tests."""
from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from erp.backend.app import app
from erp.backend.core.security import hash_password
from erp.backend.models.base import Base
from erp.backend.models.user import User, UserRole
from erp.backend.core.database import get_db_session


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(scope="function")
def db_session(test_engine) -> Generator[Session, None, None]:
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    # seed users
    root_user = User(
        username="root",
        full_name="Root User",
        email="root@example.com",
        hashed_password=hash_password("rootpass123"),
        role=UserRole.ROOT,
    )
    session.add(root_user)
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)
        Base.metadata.create_all(bind=test_engine)


@pytest.fixture()
def client(db_session: Session):
    def _override_session() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            db_session.rollback()

    app.dependency_overrides[get_db_session] = _override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
