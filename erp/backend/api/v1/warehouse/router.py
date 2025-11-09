"""Warehouse routes."""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from erp.backend.core.auth import require_roles
from erp.backend.core.database import get_db_session
from erp.backend.core.pagination import build_page, paginate
from erp.backend.models.user import User, UserRole
from erp.backend.schemas.warehouse import AuditLogRead, ImportResult, PartCreate, PartRead, PartUpdate
from erp.backend.services.warehouse import WarehouseService

router = APIRouter(prefix="/api/v1/warehouse", tags=["Warehouse"])


def get_service(session: Session = Depends(get_db_session)) -> WarehouseService:
    return WarehouseService(session)


@router.get("/parts", response_model=dict)
def list_parts(
    q: Optional[str] = Query(default=None),
    category_id: Optional[int] = Query(default=None),
    location_id: Optional[int] = Query(default=None),
    vendor_id: Optional[int] = Query(default=None),
    low_stock: bool = Query(default=False),
    sort_field: str = Query(default="name"),
    sort_dir: str = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: WarehouseService = Depends(get_service),
) -> dict:
    query = service.list_parts(q, category_id, location_id, vendor_id, low_stock, sort_field, sort_dir)
    items, total = paginate(query, page, page_size)
    page_model = build_page([PartRead.model_validate(item) for item in items], total, page, page_size)
    return page_model.model_dump()


@router.get("/parts/{part_id}", response_model=PartRead)
def get_part(part_id: int, service: WarehouseService = Depends(get_service)) -> PartRead:
    part = service.get_part(part_id)
    return PartRead.model_validate(part)


@router.post("/parts", response_model=PartRead)
def create_part(
    payload: PartCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
    service: WarehouseService = Depends(get_service),
) -> PartRead:
    part = service.create_part(payload, user_id=current_user.id)
    return PartRead.model_validate(part)


@router.put("/parts/{part_id}", response_model=PartRead)
def update_part(
    part_id: int,
    payload: PartUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
    service: WarehouseService = Depends(get_service),
) -> PartRead:
    part = service.update_part(part_id, payload, user_id=current_user.id)
    return PartRead.model_validate(part)


@router.delete("/parts/{part_id}")
def delete_part(
    part_id: int,
    current_user: User = Depends(require_roles(UserRole.ROOT,)),
    service: WarehouseService = Depends(get_service),
) -> None:
    service.delete_part(part_id, user_id=current_user.id)


@router.post("/parts/import", response_model=ImportResult)
def import_parts(
    mapping: str = Query(..., description="JSON mapping of columns"),
    upload: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
    service: WarehouseService = Depends(get_service),
) -> ImportResult:
    mapping_dict = json.loads(mapping)
    return service.import_parts(upload, mapping_dict)


@router.get("/parts/export")
def export_parts(
    q: Optional[str] = Query(default=None),
    category_id: Optional[int] = Query(default=None),
    location_id: Optional[int] = Query(default=None),
    vendor_id: Optional[int] = Query(default=None),
    low_stock: bool = Query(default=False),
    sort_field: str = Query(default="name"),
    sort_dir: str = Query(default="asc"),
    service: WarehouseService = Depends(get_service),
) -> StreamingResponse:
    parts = service.list_parts(q, category_id, location_id, vendor_id, low_stock, sort_field, sort_dir).all()
    csv_content = service.export_parts(parts)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=parts.csv"},
    )


@router.get("/parts/{part_id}/audit", response_model=list[AuditLogRead])
def audit_logs(part_id: int, service: WarehouseService = Depends(get_service)) -> list[AuditLogRead]:
    logs = service.list_audit_logs(part_id)
    return [AuditLogRead.model_validate(log) for log in logs]
