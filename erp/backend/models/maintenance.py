"""Maintenance domain models."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import Date, DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from erp.backend.models.base import Base


class WorkOrderStatus(str, Enum):
    """Status of a work order."""

    OPEN = "Open"
    IN_PROGRESS = "InProgress"
    DONE = "Done"
    CANCELED = "Canceled"


class WorkOrderType(str, Enum):
    """Work order type."""

    PM = "PM"
    CM = "CM"


class Equipment(Base):
    """Equipment entity."""

    __tablename__ = "equipment"

    name: Mapped[str] = mapped_column(String(100), unique=True)
    line: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    area: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    work_orders: Mapped[List["WorkOrder"]] = relationship(back_populates="equipment")


class PMTemplate(Base):
    """Preventive maintenance template."""

    __tablename__ = "pm_templates"

    name: Mapped[str] = mapped_column(String(150), unique=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    frequency_days: Mapped[int] = mapped_column(Integer, default=30)
    plans: Mapped[List["PMPlan"]] = relationship(back_populates="template")


class PMPlan(Base):
    """Preventive maintenance plan linking equipment to template."""

    __tablename__ = "pm_plans"

    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment.id"))
    template_id: Mapped[int] = mapped_column(ForeignKey("pm_templates.id"))
    next_due_date: Mapped[date] = mapped_column(Date)

    equipment: Mapped[Equipment] = relationship()
    template: Mapped[PMTemplate] = relationship(back_populates="plans")


class WorkOrder(Base):
    """Maintenance work order."""

    __tablename__ = "work_orders"

    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment.id"))
    type: Mapped[WorkOrderType] = mapped_column(SAEnum(WorkOrderType))
    status: Mapped[WorkOrderStatus] = mapped_column(SAEnum(WorkOrderStatus), default=WorkOrderStatus.OPEN)
    summary: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    downtime_min: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    plan_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pm_plans.id"), nullable=True)

    equipment: Mapped[Equipment] = relationship(back_populates="work_orders")
    plan: Mapped[Optional[PMPlan]] = relationship()
    history_records: Mapped[List["MaintenanceHistory"]] = relationship(back_populates="work_order")


class MaintenanceHistory(Base):
    """Historical records of completed work orders."""

    __tablename__ = "maintenance_history"

    work_order_id: Mapped[int] = mapped_column(ForeignKey("work_orders.id", ondelete="CASCADE"))
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment.id"))
    summary: Mapped[str] = mapped_column(String(255))
    downtime_min: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    work_order: Mapped[WorkOrder] = relationship(back_populates="history_records")
