"""Maintenance module tests."""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

from .test_warehouse import _auth_headers


def test_work_order_lifecycle(client: TestClient) -> None:
    headers = _auth_headers(client)

    equipment_resp = client.post(
        "/api/v1/maintenance/equipment",
        json={"name": "Press #1", "line": "A", "area": "North", "status": "Running"},
        headers=headers,
    )
    assert equipment_resp.status_code == 200
    equipment_id = equipment_resp.json()["id"]

    template_resp = client.post(
        "/api/v1/maintenance/pm/templates",
        json={"name": "Monthly Check", "frequency_days": 30},
        headers=headers,
    )
    template_id = template_resp.json()["id"]

    plan_resp = client.post(
        "/api/v1/maintenance/pm/plans",
        json={
            "equipment_id": equipment_id,
            "template_id": template_id,
            "next_due_date": date.today().isoformat(),
        },
        headers=headers,
    )
    assert plan_resp.status_code == 200

    generate_resp = client.post("/api/v1/maintenance/pm/generate-due", headers=headers)
    assert generate_resp.status_code == 200
    assert generate_resp.json()["created_work_orders"] >= 1

    work_orders = client.get("/api/v1/maintenance/work-orders", headers=headers).json()
    work_order_id = work_orders[0]["id"]

    # Attempt to close without summary/downtime should fail
    bad_close = client.put(
        f"/api/v1/maintenance/work-orders/{work_order_id}",
        json={"status": "Done"},
        headers=headers,
    )
    assert bad_close.status_code == 400

    close_resp = client.put(
        f"/api/v1/maintenance/work-orders/{work_order_id}",
        json={"status": "Done", "summary": "Completed", "downtime_min": 10},
        headers=headers,
    )
    assert close_resp.status_code == 200
    assert close_resp.json()["status"] == "Done"

    history_resp = client.get("/api/v1/maintenance/history", headers=headers)
    assert history_resp.status_code == 200
    assert len(history_resp.json()) >= 1
