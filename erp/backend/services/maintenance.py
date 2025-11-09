"""Maintenance service layer."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from erp.backend.models.maintenance import (
    Equipment,
    MaintenanceHistory,
    PMPlan,
    PMTemplate,
    WorkOrder,
    WorkOrderStatus,
    WorkOrderType,
)
from erp.backend.repositories.maintenance import (
    EquipmentRepository,
    MaintenanceHistoryRepository,
    PMPlanRepository,
    PMTemplateRepository,
    WorkOrderRepository,
)
from erp.backend.schemas.maintenance import (
    EquipmentCreate,
    GenerateDueResponse,
    PMPlanCreate,
    PMTemplateCreate,
    WorkOrderCreate,
    WorkOrderUpdate,
)


class MaintenanceService:
    """Service orchestrating maintenance operations."""

    def __init__(self, session: Session):
        self.session = session
        self.equipment_repo = EquipmentRepository(session)
        self.template_repo = PMTemplateRepository(session)
        self.plan_repo = PMPlanRepository(session)
        self.work_order_repo = WorkOrderRepository(session)
        self.history_repo = MaintenanceHistoryRepository(session)

    # Equipment
    def list_equipment(self):
        return self.equipment_repo.list()

    def create_equipment(self, payload: EquipmentCreate):
        equipment = Equipment(**payload.model_dump())
        self.equipment_repo.add(equipment)
        return equipment

    # PM Templates
    def list_pm_templates(self):
        return self.template_repo.list()

    def create_pm_template(self, payload: PMTemplateCreate) -> PMTemplate:
        template = PMTemplate(**payload.model_dump())
        self.template_repo.add(template)
        return template

    # PM Plans
    def list_pm_plans(self):
        return self.plan_repo.list()

    def create_pm_plan(self, payload: PMPlanCreate) -> PMPlan:
        plan = PMPlan(**payload.model_dump())
        self.plan_repo.add(plan)
        return plan

    # Work Orders
    def list_work_orders(self):
        return self.work_order_repo.list()

    def create_work_order(self, payload: WorkOrderCreate) -> WorkOrder:
        work_order = WorkOrder(**payload.model_dump())
        self._validate_work_order_status_transition(work_order.status)
        self.work_order_repo.add(work_order)
        return work_order

    def update_work_order(self, work_order_id: int, payload: WorkOrderUpdate) -> WorkOrder:
        work_order = self.work_order_repo.get(work_order_id)
        if not work_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")
        data = payload.model_dump(exclude_unset=True)
        new_status = data.get("status")
        if new_status:
            self._validate_transition(work_order.status, new_status)
            work_order.status = new_status
            if new_status == WorkOrderStatus.DONE:
                summary = data.get("summary") or work_order.summary
                downtime = data.get("downtime_min") or work_order.downtime_min
                if summary is None or downtime is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Summary and downtime are required to close work order",
                    )
                if downtime < 0:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Downtime must be non-negative")
                work_order.summary = summary
                work_order.downtime_min = Decimal(str(downtime))
                work_order.completed_at = datetime.utcnow()
                history = MaintenanceHistory(
                    work_order_id=work_order.id,
                    equipment_id=work_order.equipment_id,
                    summary=work_order.summary,
                    downtime_min=work_order.downtime_min,
                )
                self.history_repo.add(history)
        for key, value in data.items():
            if key != "status":
                setattr(work_order, key, value)
        return work_order

    def generate_due_work_orders(self, reference_date: date | None = None) -> GenerateDueResponse:
        if reference_date is None:
            reference_date = date.today()
        plans = self.plan_repo.due_plans(reference_date)
        created = 0
        for plan in plans:
            work_order = WorkOrder(
                equipment_id=plan.equipment_id,
                type=WorkOrderType.PM,
                status=WorkOrderStatus.OPEN,
                plan_id=plan.id,
                due_date=plan.next_due_date,
            )
            self.work_order_repo.add(work_order)
            created += 1
            plan.next_due_date = plan.next_due_date + timedelta(days=plan.template.frequency_days)
        return GenerateDueResponse(created_work_orders=created)

    def list_history(self):
        return self.history_repo.list()

    def _validate_transition(self, current: WorkOrderStatus, new: WorkOrderStatus) -> None:
        valid_transitions = {
            WorkOrderStatus.OPEN: {WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELED},
            WorkOrderStatus.IN_PROGRESS: {WorkOrderStatus.DONE, WorkOrderStatus.CANCELED},
            WorkOrderStatus.DONE: set(),
            WorkOrderStatus.CANCELED: set(),
        }
        allowed = valid_transitions[current]
        if new not in allowed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status transition")

    @staticmethod
    def _validate_work_order_status_transition(status: WorkOrderStatus) -> None:
        if status not in {WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid initial status")
