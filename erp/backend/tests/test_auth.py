"""Authentication tests."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_login_and_refresh(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "root", "password": "rootpass123"},
        headers={"content-type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens

    refresh_response = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh_response.status_code == 200
    refreshed = refresh_response.json()
    assert refreshed["access_token"] != tokens["access_token"]
