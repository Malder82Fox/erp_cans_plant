"""Warehouse module tests."""
from __future__ import annotations

import io
import json

from fastapi.testclient import TestClient


def _auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "root", "password": "rootpass123"},
    )
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_import_parts_add_only(client: TestClient) -> None:
    headers = _auth_headers(client)
    csv_content = "Part Code,Name,QTY,MIN,Price,CUR\nP-1,Part 1,10,5,100,USD\n"
    def make_files():
        return {
            "upload": ("parts.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv"),
        }
    mapping = {
        "part_code": "Part Code",
        "name": "Name",
        "qty_on_hand": "QTY",
        "min_stock": "MIN",
        "price": "Price",
        "currency": "CUR",
    }
    response = client.post(
        "/api/v1/warehouse/parts/import",
        params={"mapping": json.dumps(mapping)},
        files=make_files(),
        headers=headers,
    )
    assert response.status_code == 200
    result = response.json()
    assert result["created"] == 1

    list_response = client.get("/api/v1/warehouse/parts", headers=headers)
    assert list_response.status_code == 200
    payload = list_response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["part_code"] == "P-1"

    # second import should skip existing part
    response = client.post(
        "/api/v1/warehouse/parts/import",
        params={"mapping": json.dumps(mapping)},
        files=make_files(),
        headers=headers,
    )
    assert response.status_code == 200
    result = response.json()
    assert result["skipped"] == 1
