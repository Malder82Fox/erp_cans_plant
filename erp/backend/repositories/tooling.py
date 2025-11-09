"""Tooling repositories."""
from __future__ import annotations

from typing import Iterable, Optional

from sqlalchemy.orm import Session

from erp.backend.models.tooling import Batch, BatchItem, Tool, ToolDim, ToolDimChange, ToolOperation


class ToolRepository:
    """Repository for tools."""

    def __init__(self, session: Session):
        self.session = session

    def list(self) -> Iterable[Tool]:
        return self.session.query(Tool).all()

    def get(self, tool_id: int) -> Optional[Tool]:
        return self.session.get(Tool, tool_id)

    def add(self, tool: Tool) -> Tool:
        self.session.add(tool)
        self.session.flush()
        return tool


class ToolDimRepository:
    """Repository for tool dimensions."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_name(self, tool_id: int, dim_name: str) -> Optional[ToolDim]:
        return (
            self.session.query(ToolDim)
            .filter(ToolDim.tool_id == tool_id, ToolDim.dim_name == dim_name)
            .first()
        )

    def add(self, dim: ToolDim) -> ToolDim:
        self.session.add(dim)
        self.session.flush()
        return dim


class BatchRepository:
    """Repository for batches."""

    def __init__(self, session: Session):
        self.session = session

    def list(self) -> Iterable[Batch]:
        return self.session.query(Batch).all()

    def get(self, batch_id: int) -> Optional[Batch]:
        return self.session.get(Batch, batch_id)

    def add(self, batch: Batch) -> Batch:
        self.session.add(batch)
        self.session.flush()
        return batch


class BatchItemRepository:
    """Repository for batch items."""

    def __init__(self, session: Session):
        self.session = session

    def add(self, item: BatchItem) -> BatchItem:
        self.session.add(item)
        self.session.flush()
        return item


class ToolOperationRepository:
    """Repository for tool operations."""

    def __init__(self, session: Session):
        self.session = session

    def add(self, operation: ToolOperation) -> ToolOperation:
        self.session.add(operation)
        self.session.flush()
        return operation


class ToolDimChangeRepository:
    """Repository for dimension history."""

    def __init__(self, session: Session):
        self.session = session

    def add(self, change: ToolDimChange) -> ToolDimChange:
        self.session.add(change)
        self.session.flush()
        return change

    def list_for_tool(self, tool_id: int) -> Iterable[ToolDimChange]:
        return (
            self.session.query(ToolDimChange)
            .filter(ToolDimChange.tool_id == tool_id)
            .order_by(ToolDimChange.changed_at.desc())
            .all()
        )
