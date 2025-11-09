"""Warehouse repositories."""
from __future__ import annotations

from typing import Iterable, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from erp.backend.models.warehouse import AuditLog, Part


class PartRepository:
    """Repository for parts with search and filtering utilities."""

    def __init__(self, session: Session):
        self.session = session

    def query(self):
        return self.session.query(Part).filter(Part.is_deleted.is_(False))

    def get_by_id(self, part_id: int) -> Optional[Part]:
        return self.session.get(Part, part_id)

    def get_by_code(self, part_code: str) -> Optional[Part]:
        return self.session.query(Part).filter(Part.part_code == part_code).first()

    def search(
        self,
        q: Optional[str],
        category_id: Optional[int],
        location_id: Optional[int],
        vendor_id: Optional[int],
        low_stock: bool,
        sort_field: str,
        sort_dir: str,
    ):
        query = self.query()
        if q:
            pattern = f"%{q}%"
            query = query.filter(or_(Part.name.ilike(pattern), Part.part_code.ilike(pattern)))
        if category_id:
            query = query.filter(Part.category_id == category_id)
        if location_id:
            query = query.filter(Part.location_id == location_id)
        if vendor_id:
            query = query.filter(Part.vendor_id == vendor_id)
        if low_stock:
            query = query.filter(Part.qty_on_hand <= Part.min_stock)
        if sort_field in {"name", "part_code", "qty_on_hand", "price"}:
            column = getattr(Part, sort_field)
            if sort_dir == "desc":
                column = column.desc()
            query = query.order_by(column)
        else:
            query = query.order_by(Part.name)
        return query

    def create(self, part: Part) -> Part:
        self.session.add(part)
        return part

    def soft_delete(self, part: Part) -> None:
        part.is_deleted = True


class AuditLogRepository:
    """Repository for audit log entries."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, entity_type: str, entity_id: int, action: str, user_id: Optional[int], changes: str | None) -> AuditLog:
        entry = AuditLog(entity_type=entity_type, entity_id=entity_id, action=action, user_id=user_id, changes=changes)
        self.session.add(entry)
        return entry

    def list_for_entity(self, entity_type: str, entity_id: int) -> Iterable[AuditLog]:
        return (
            self.session.query(AuditLog)
            .filter(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
            .order_by(AuditLog.created_at.desc())
            .all()
        )
