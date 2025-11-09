"""Authentication and user management tests."""
from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from erp.backend.core.security import hash_password
from erp.backend.models.user import User, UserRole


def login(client: TestClient, username: str, password: str) -> dict[str, Any]:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return response.json()


def test_login_refresh_logout_flow(client: TestClient) -> None:
    tokens = login(client, "root", "rootpass123")
    assert tokens["password_change_required"] is False

    refresh_response = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh_response.status_code == 200
    refreshed = refresh_response.json()
    assert refreshed["access_token"] != tokens["access_token"]

    logout_response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert logout_response.status_code == 204

    invalid_refresh = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert invalid_refresh.status_code == 401


def test_must_change_password_flow(client: TestClient, db_session: Session) -> None:
    user = User(
        username="temp_user",
        email="temp@example.com",
        password_hash=hash_password("TempPass!2025"),
        role=UserRole.USER,
        must_change_password=True,
    )
    db_session.add(user)
    db_session.commit()

    tokens = login(client, "temp_user", "TempPass!2025")
    assert tokens["password_change_required"] is True

    business_response = client.get(
        "/api/v1/warehouse/parts",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert business_response.status_code == 403

    change_response = client.post(
        "/api/v1/auth/change-password",
        json={"old_password": "TempPass!2025", "new_password": "StrongPass!2025"},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert change_response.status_code == 204

    tokens_after_change = login(client, "temp_user", "StrongPass!2025")
    assert tokens_after_change["password_change_required"] is False

    business_allowed = client.get(
        "/api/v1/warehouse/parts",
        headers={"Authorization": f"Bearer {tokens_after_change['access_token']}"},
    )
    assert business_allowed.status_code == 200


def test_user_creation_and_listing_requires_root(client: TestClient, db_session: Session) -> None:
    tokens = login(client, "root", "rootpass123")
    create_response = client.post(
        "/api/v1/users",
        json={
            "username": "qa",
            "email": "qa@example.com",
            "role": "admin",
            "password": "Temp!2025Qa",
            "must_change_password": True,
        },
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert create_response.status_code == 201
    created_user = create_response.json()
    assert created_user["must_change_password"] is True

    qa_tokens = login(client, "qa", "Temp!2025Qa")
    assert qa_tokens["password_change_required"] is True

    # Admin (non-root) cannot list users
    list_response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {qa_tokens['access_token']}"},
    )
    assert list_response.status_code == 403

    # Root can list users with filters
    list_root = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
        params={"role": "admin", "is_active": True, "q": "qa"},
    )
    assert list_root.status_code == 200
    payload = list_root.json()
    assert payload["total"] >= 1
    assert any(item["username"] == "qa" for item in payload["items"])


def test_reset_password_invalidates_refresh(client: TestClient) -> None:
    tokens = login(client, "root", "rootpass123")
    create_response = client.post(
        "/api/v1/users",
        json={
            "username": "reset_user",
            "email": "reset@example.com",
            "role": "user",
            "password": "Initial!2025",
            "must_change_password": False,
        },
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert create_response.status_code == 201
    user_tokens = login(client, "reset_user", "Initial!2025")

    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": user_tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 200

    reset_response = client.post(
        "/api/v1/users/{}/reset-password".format(create_response.json()["id"]),
        json={"temporary_password": "TempAgain!2025", "must_change_password": True},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert reset_response.status_code == 200

    invalid_refresh = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": user_tokens["refresh_token"]},
    )
    assert invalid_refresh.status_code == 401

    new_tokens = login(client, "reset_user", "TempAgain!2025")
    assert new_tokens["password_change_required"] is True


def test_role_change_and_activation_flow(client: TestClient) -> None:
    tokens = login(client, "root", "rootpass123")
    create_response = client.post(
        "/api/v1/users",
        json={
            "username": "status_user",
            "email": "status@example.com",
            "role": "user",
            "password": "Status!2025",
            "must_change_password": False,
        },
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    user_id = create_response.json()["id"]

    update_role = client.put(
        f"/api/v1/users/{user_id}",
        json={"role": "admin"},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert update_role.status_code == 200
    assert update_role.json()["role"] == "admin"

    deactivate = client.put(
        f"/api/v1/users/{user_id}",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert deactivate.status_code == 200
    inactive_login = client.post(
        "/api/v1/auth/login",
        json={"username": "status_user", "password": "Status!2025"},
    )
    assert inactive_login.status_code == 403

    activate = client.put(
        f"/api/v1/users/{user_id}",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert activate.status_code == 200

    active_login = client.post(
        "/api/v1/auth/login",
        json={"username": "status_user", "password": "Status!2025"},
    )
    assert active_login.status_code == 200


def test_soft_delete_blocks_access(client: TestClient) -> None:
    tokens = login(client, "root", "rootpass123")
    create_response = client.post(
        "/api/v1/users",
        json={
            "username": "delete_user",
            "email": "delete@example.com",
            "role": "user",
            "password": "Delete!2025",
            "must_change_password": False,
        },
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    user_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert delete_response.status_code == 204

    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "delete_user", "password": "Delete!2025"},
    )
    assert login_response.status_code == 403
