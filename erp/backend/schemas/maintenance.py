"""Maintenance schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from erp.backend.models.maintenance import WorkOrderStatus, WorkOrderType


class EquipmentBase(BaseModel):
    """Base attributes for equipment."""

    name: str
    line: Optional[str] = None
    area: Optional[str] = None
    status: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    """Equipment creation payload."""

    pass


class EquipmentRead(EquipmentBase):
    """Equipment response model."""

    id: int

    model_config = {"from_attributes": True}


class PMTemplateBase(BaseModel):
    """Preventive maintenance template base."""

    name: str
    description: Optional[str] = None
    frequency_days: int = Field(ge=1)


class PMTemplateCreate(PMTemplateBase):
    """Creation payload."""

    pass


class PMTemplateRead(PMTemplateBase):
    """Template read model."""

    id: int

    model_config = {"from_attributes": True}


class PMPlanBase(BaseModel):
    """Base plan fields."""

    equipment_id: int
    template_id: int
    next_due_date: date


class PMPlanCreate(PMPlanBase):
    """Plan creation payload."""

    pass


class PMPlanRead(PMPlanBase):
    """Plan read model."""

    id: int

    model_config = {"from_attributes": True}


class WorkOrderBase(BaseModel):
    """Base work order fields."""

    equipment_id: int
    type: WorkOrderType
    status: WorkOrderStatus = WorkOrderStatus.OPEN
    summary: Optional[str] = None
    downtime_min: Optional[Decimal] = Field(default=None, ge=0)
    due_date: Optional[date] = None
    plan_id: Optional[int] = None


class WorkOrderCreate(WorkOrderBase):
    """Work order creation payload."""

    pass


class WorkOrderUpdate(BaseModel):
    """Work order update payload."""

    status: Optional[WorkOrderStatus] = None
    summary: Optional[str] = None
    downtime_min: Optional[Decimal] = Field(default=None, ge=0)
    due_date: Optional[date] = None


class WorkOrderRead(WorkOrderBase):
    """Work order response model."""

    id: int
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MaintenanceHistoryRead(BaseModel):
    """History response model."""

    id: int
    work_order_id: int
    equipment_id: int
    summary: str
    downtime_min: Decimal
    recorded_at: datetime

    model_config = {"from_attributes": True}


class GenerateDueResponse(BaseModel):
    """Response summarizing generated work orders."""

    created_work_orders: int
