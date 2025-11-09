"""Tooling module tests."""
from __future__ import annotations

from fastapi.testclient import TestClient

from .test_warehouse import _auth_headers


def test_grinding_operation_records_history(client: TestClient) -> None:
    headers = _auth_headers(client)

    tool_resp = client.post(
        "/api/v1/tooling/tools",
        json={"name": "Tool A", "tool_type": "Cutter", "bm_no": "BM-1", "status": "available"},
        headers=headers,
    )
    assert tool_resp.status_code == 200
    tool_id = tool_resp.json()["id"]

    batch_resp = client.post(
        "/api/v1/tooling/batches",
        json={"name": "Batch 1", "tool_ids": [tool_id]},
        headers=headers,
    )
    assert batch_resp.status_code == 200
    batch_id = batch_resp.json()["id"]

    op_payload = {
        "op_type": "grinding",
        "apply_to_all": True,
        "changes": [
            {"dim_name": "DIM_A", "new_value": 1.25},
        ],
    }
    op_resp = client.post(
        f"/api/v1/tooling/batches/{batch_id}/operation",
        json=op_payload,
        headers=headers,
    )
    assert op_resp.status_code == 200
    result = op_resp.json()
    assert result["processed"] == 1

    dims_resp = client.get(f"/api/v1/tooling/tools/{tool_id}/dims", headers=headers)
    assert dims_resp.status_code == 200
    payload = dims_resp.json()
    assert payload["current"][0]["dim_name"] == "DIM_A"
    assert payload["history"][0]["dim_name"] == "DIM_A"
