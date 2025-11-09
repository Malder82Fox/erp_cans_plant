"""Maintenance repositories."""
from __future__ import annotations

from datetime import date
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from erp.backend.models.maintenance import (
    Equipment,
    MaintenanceHistory,
    PMPlan,
    PMTemplate,
    WorkOrder,
    WorkOrderStatus,
)


class EquipmentRepository:
    """Repository for equipment entities."""

    def __init__(self, session: Session):
        self.session = session

    def list(self) -> Iterable[Equipment]:
        return self.session.query(Equipment).all()

    def get(self, equipment_id: int) -> Optional[Equipment]:
        return self.session.get(Equipment, equipment_id)

    def add(self, equipment: Equipment) -> Equipment:
        self.session.add(equipment)
        return equipment


class PMTemplateRepository:
    """Repository for PM templates."""

    def __init__(self, session: Session):
        self.session = session

    def list(self) -> Iterable[PMTemplate]:
        return self.session.query(PMTemplate).all()

    def get(self, template_id: int) -> Optional[PMTemplate]:
        return self.session.get(PMTemplate, template_id)

    def add(self, template: PMTemplate) -> PMTemplate:
        self.session.add(template)
        return template


class PMPlanRepository:
    """Repository for PM plans."""

    def __init__(self, session: Session):
        self.session = session

    def list(self) -> Iterable[PMPlan]:
        return self.session.query(PMPlan).all()

    def get(self, plan_id: int) -> Optional[PMPlan]:
        return self.session.get(PMPlan, plan_id)

    def add(self, plan: PMPlan) -> PMPlan:
        self.session.add(plan)
        return plan

    def due_plans(self, reference_date: date) -> Iterable[PMPlan]:
        return self.session.query(PMPlan).filter(PMPlan.next_due_date <= reference_date).all()


class WorkOrderRepository:
    """Repository for work orders."""

    def __init__(self, session: Session):
        self.session = session

    def list(self) -> Iterable[WorkOrder]:
        return self.session.query(WorkOrder).all()

    def get(self, work_order_id: int) -> Optional[WorkOrder]:
        return self.session.get(WorkOrder, work_order_id)

    def add(self, work_order: WorkOrder) -> WorkOrder:
        self.session.add(work_order)
        return work_order

    def list_open(self) -> Iterable[WorkOrder]:
        return (
            self.session.query(WorkOrder)
            .filter(WorkOrder.status.in_([WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS]))
            .all()
        )


class MaintenanceHistoryRepository:
    """Repository for maintenance history."""

    def __init__(self, session: Session):
        self.session = session

    def add(self, history: MaintenanceHistory) -> MaintenanceHistory:
        self.session.add(history)
        return history

    def list(self) -> Iterable[MaintenanceHistory]:
        return self.session.query(MaintenanceHistory).order_by(MaintenanceHistory.recorded_at.desc()).all()
