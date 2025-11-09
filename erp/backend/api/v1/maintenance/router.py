"""Maintenance routes."""
from __future__ import annotations

import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from erp.backend.core.auth import get_current_user, require_roles
from erp.backend.core.database import get_db_session
from erp.backend.models.user import User, UserRole
from erp.backend.schemas.maintenance import (
    EquipmentCreate,
    EquipmentRead,
    GenerateDueResponse,
    MaintenanceHistoryRead,
    PMPlanCreate,
    PMPlanRead,
    PMTemplateCreate,
    PMTemplateRead,
    WorkOrderCreate,
    WorkOrderRead,
    WorkOrderUpdate,
)
from erp.backend.services.maintenance import MaintenanceService

router = APIRouter(prefix="/api/v1/maintenance", tags=["Maintenance"])


def get_service(session: Session = Depends(get_db_session)) -> MaintenanceService:
    return MaintenanceService(session)


@router.get("/equipment", response_model=list[EquipmentRead])
def list_equipment(
    service: MaintenanceService = Depends(get_service),
    current_user: User = Depends(get_current_user),
) -> list[EquipmentRead]:
    equipment = service.list_equipment()
    return [EquipmentRead.model_validate(eq) for eq in equipment]


@router.post("/equipment", response_model=EquipmentRead)
def create_equipment(
    payload: EquipmentCreate,
    service: MaintenanceService = Depends(get_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
) -> EquipmentRead:
    equipment = service.create_equipment(payload)
    return EquipmentRead.model_validate(equipment)


@router.get("/pm/templates", response_model=list[PMTemplateRead])
def list_templates(service: MaintenanceService = Depends(get_service), current_user: User = Depends(get_current_user)) -> list[PMTemplateRead]:
    templates = service.list_pm_templates()
    return [PMTemplateRead.model_validate(t) for t in templates]


@router.post("/pm/templates", response_model=PMTemplateRead)
def create_template(
    payload: PMTemplateCreate,
    service: MaintenanceService = Depends(get_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
) -> PMTemplateRead:
    template = service.create_pm_template(payload)
    return PMTemplateRead.model_validate(template)


@router.get("/pm/plans", response_model=list[PMPlanRead])
def list_plans(service: MaintenanceService = Depends(get_service), current_user: User = Depends(get_current_user)) -> list[PMPlanRead]:
    plans = service.list_pm_plans()
    return [PMPlanRead.model_validate(plan) for plan in plans]


@router.post("/pm/plans", response_model=PMPlanRead)
def create_plan(
    payload: PMPlanCreate,
    service: MaintenanceService = Depends(get_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
) -> PMPlanRead:
    plan = service.create_pm_plan(payload)
    return PMPlanRead.model_validate(plan)


@router.post("/pm/generate-due", response_model=GenerateDueResponse)
def generate_due(
    service: MaintenanceService = Depends(get_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
) -> GenerateDueResponse:
    return service.generate_due_work_orders()


@router.get("/work-orders", response_model=list[WorkOrderRead])
def list_work_orders(service: MaintenanceService = Depends(get_service), current_user: User = Depends(get_current_user)) -> list[WorkOrderRead]:
    work_orders = service.list_work_orders()
    return [WorkOrderRead.model_validate(wo) for wo in work_orders]


@router.post("/work-orders", response_model=WorkOrderRead)
def create_work_order(
    payload: WorkOrderCreate,
    service: MaintenanceService = Depends(get_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
) -> WorkOrderRead:
    work_order = service.create_work_order(payload)
    return WorkOrderRead.model_validate(work_order)


@router.put("/work-orders/{work_order_id}", response_model=WorkOrderRead)
def update_work_order(
    work_order_id: int,
    payload: WorkOrderUpdate,
    service: MaintenanceService = Depends(get_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ROOT)),
) -> WorkOrderRead:
    work_order = service.update_work_order(work_order_id, payload)
    return WorkOrderRead.model_validate(work_order)


@router.get("/history", response_model=list[MaintenanceHistoryRead])
def history(
    export: bool = Query(default=False),
    service: MaintenanceService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    records = service.list_history()
    if export:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["work_order_id", "equipment_id", "summary", "downtime_min", "recorded_at"])
        for record in records:
            writer.writerow([
                record.work_order_id,
                record.equipment_id,
                record.summary,
                str(record.downtime_min),
                record.recorded_at.isoformat(),
            ])
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=maintenance_history.csv"},
        )
    return [MaintenanceHistoryRead.model_validate(record) for record in records]
