"""Tooling routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from erp.backend.core.auth import require_any, require_role
from erp.backend.core.database import get_db_session
from erp.backend.models.user import User, UserRole
from erp.backend.schemas.tooling import (
    BatchOperationPayload,
    BatchOperationResult,
    BatchRead,
    BatchCreate,
    BatchUpdate,
    BatchReport,
    ToolCreate,
    ToolRead,
    ToolUpdate,
)
from erp.backend.services.tooling import ToolingService

router = APIRouter(prefix="/api/v1/tooling", tags=["Tooling"])


def get_service(session: Session = Depends(get_db_session)) -> ToolingService:
    return ToolingService(session)


@router.get("/tools", response_model=list[ToolRead])
def list_tools(
    service: ToolingService = Depends(get_service),
    _current_user: User = Depends(require_any(UserRole.USER, UserRole.ADMIN, UserRole.ROOT)),
) -> list[ToolRead]:
    tools = service.list_tools()
    return [ToolRead.model_validate(tool) for tool in tools]


@router.post("/tools", response_model=ToolRead)
def create_tool(
    payload: ToolCreate,
    service: ToolingService = Depends(get_service),
    current_user: User = Depends(require_any(UserRole.ADMIN, UserRole.ROOT)),
) -> ToolRead:
    tool = service.create_tool(payload)
    return ToolRead.model_validate(tool)


@router.put("/tools/{tool_id}", response_model=ToolRead)
def update_tool(
    tool_id: int,
    payload: ToolUpdate,
    service: ToolingService = Depends(get_service),
    current_user: User = Depends(require_any(UserRole.ADMIN, UserRole.ROOT)),
) -> ToolRead:
    tool = service.update_tool(tool_id, payload)
    return ToolRead.model_validate(tool)


@router.delete("/tools/{tool_id}")
def delete_tool(
    tool_id: int,
    service: ToolingService = Depends(get_service),
    current_user: User = Depends(require_role(UserRole.ROOT)),
) -> None:
    service.delete_tool(tool_id)


@router.get("/tools/{tool_id}/dims")
def get_dims(
    tool_id: int,
    service: ToolingService = Depends(get_service),
    _current_user: User = Depends(require_any(UserRole.USER, UserRole.ADMIN, UserRole.ROOT)),
) -> dict:
    dims, history = service.get_tool_dimensions(tool_id)
    return {
        "current": [
            {"id": dim.id, "dim_name": dim.dim_name, "value": str(dim.value)}
            for dim in dims
        ],
        "history": [
            {
                "id": record.id,
                "dim_name": record.dim_name,
                "old_value": str(record.old_value),
                "new_value": str(record.new_value),
                "changed_at": record.changed_at.isoformat(),
            }
            for record in history
        ],
    }


@router.get("/batches", response_model=list[BatchRead])
def list_batches(
    service: ToolingService = Depends(get_service),
    _current_user: User = Depends(require_any(UserRole.USER, UserRole.ADMIN, UserRole.ROOT)),
) -> list[BatchRead]:
    batches = service.list_batches()
    return [BatchRead.model_validate(batch) for batch in batches]


@router.post("/batches", response_model=BatchRead)
def create_batch(
    payload: BatchCreate,
    service: ToolingService = Depends(get_service),
    current_user: User = Depends(require_any(UserRole.ADMIN, UserRole.ROOT)),
) -> BatchRead:
    batch = service.create_batch(payload.name, payload.tool_ids, payload.status)
    return BatchRead.model_validate(batch)


@router.put("/batches/{batch_id}", response_model=BatchRead)
def update_batch(
    batch_id: int,
    payload: BatchUpdate,
    service: ToolingService = Depends(get_service),
    current_user: User = Depends(require_any(UserRole.ADMIN, UserRole.ROOT)),
) -> BatchRead:
    batch = service.update_batch(batch_id, payload)
    return BatchRead.model_validate(batch)


@router.post("/batches/{batch_id}/operation", response_model=BatchOperationResult)
def run_operation(
    batch_id: int,
    payload: BatchOperationPayload,
    service: ToolingService = Depends(get_service),
    current_user: User = Depends(require_any(UserRole.ADMIN, UserRole.ROOT)),
) -> BatchOperationResult:
    return service.process_operation(batch_id, payload)


@router.get("/reports/batch/{batch_id}", response_model=BatchReport)
def batch_report(
    batch_id: int,
    service: ToolingService = Depends(get_service),
    _current_user: User = Depends(require_any(UserRole.USER, UserRole.ADMIN, UserRole.ROOT)),
) -> BatchReport:
    return service.generate_batch_report(batch_id)
