"""Tooling schemas."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

from erp.backend.models.tooling import BatchStatus, OperationType


class ToolBase(BaseModel):
    """Base tool fields."""

    name: str
    tool_type: str
    bm_no: Optional[str] = None
    status: str = Field(default="available")


class ToolCreate(ToolBase):
    """Tool creation payload."""

    pass


class ToolUpdate(BaseModel):
    """Tool update payload."""

    name: Optional[str] = None
    tool_type: Optional[str] = None
    bm_no: Optional[str] = None
    status: Optional[str] = None


class ToolDimRead(BaseModel):
    """Tool dimension read model."""

    id: int
    dim_name: str
    value: Decimal

    model_config = {"from_attributes": True}


class ToolDimChangeRead(BaseModel):
    """Dimension change history entry."""

    id: int
    dim_name: str
    old_value: Decimal
    new_value: Decimal
    operation_id: int
    changed_at: datetime

    model_config = {"from_attributes": True}


class ToolRead(ToolBase):
    """Tool response model."""

    id: int

    model_config = {"from_attributes": True}


class BatchBase(BaseModel):
    """Batch base fields."""

    name: str
    status: BatchStatus = BatchStatus.QUEUED


class BatchCreate(BatchBase):
    """Batch creation payload."""

    tool_ids: List[int] = Field(default_factory=list)


class BatchUpdate(BaseModel):
    """Batch update payload."""

    name: Optional[str] = None
    status: Optional[BatchStatus] = None


class BatchItemRead(BaseModel):
    """Batch item representation."""

    id: int
    tool_id: int
    status: BatchStatus

    model_config = {"from_attributes": True}


class BatchRead(BatchBase):
    """Batch read model."""

    id: int
    items: List[BatchItemRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class OperationChange(BaseModel):
    """Dimension change for a tool during operation."""

    dim_name: str
    new_value: Decimal


class ToolOperationPayload(BaseModel):
    """Payload for batch operation."""

    op_type: OperationType
    apply_to_all: bool = False
    changes: List[dict] | List[OperationChange]


class BatchOperationResult(BaseModel):
    """Result of executing a batch operation."""

    processed: int
    skipped: int


class BatchReport(BaseModel):
    """Batch report data."""

    batch_id: int
    html: str
