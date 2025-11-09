"""Tooling domain models."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from erp.backend.models.base import Base


class BatchStatus(str, Enum):
    """Batch processing status."""

    QUEUED = "Queued"
    PROCESSED = "Processed"
    SKIPPED = "Skipped"


class OperationType(str, Enum):
    """Type of tooling operations."""

    INSPECTION = "inspection"
    CLEANING = "cleaning"
    GRINDING = "grinding"


class Tool(Base):
    """Cutting tool entity."""

    __tablename__ = "tools"

    name: Mapped[str] = mapped_column(String(100))
    tool_type: Mapped[str] = mapped_column(String(100))
    bm_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="available")

    dims: Mapped[List["ToolDim"]] = relationship(back_populates="tool", cascade="all, delete-orphan")
    dim_changes: Mapped[List["ToolDimChange"]] = relationship(back_populates="tool", cascade="all, delete-orphan")
    batch_items: Mapped[List["BatchItem"]] = relationship(back_populates="tool")


class ToolDim(Base):
    """Current tool dimension."""

    __tablename__ = "tool_dims"

    __table_args__ = (UniqueConstraint("tool_id", "dim_name", name="uq_tool_dim"),)

    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id"))
    dim_name: Mapped[str] = mapped_column(String(100))
    value: Mapped[Decimal] = mapped_column(Numeric(10, 3))

    tool: Mapped[Tool] = relationship(back_populates="dims")


class ToolDimChange(Base):
    """History of dimension changes."""

    __tablename__ = "tool_dim_changes"

    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id"))
    dim_name: Mapped[str] = mapped_column(String(100))
    old_value: Mapped[Decimal] = mapped_column(Numeric(10, 3))
    new_value: Mapped[Decimal] = mapped_column(Numeric(10, 3))
    operation_id: Mapped[int] = mapped_column(ForeignKey("tool_operations.id"))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    tool: Mapped[Tool] = relationship(back_populates="dim_changes")
    operation: Mapped["ToolOperation"] = relationship(back_populates="dim_changes")


class Batch(Base):
    """Batch of tools for operations."""

    __tablename__ = "batches"

    name: Mapped[str] = mapped_column(String(100), unique=True)
    status: Mapped[BatchStatus] = mapped_column(SAEnum(BatchStatus), default=BatchStatus.QUEUED)

    items: Mapped[List["BatchItem"]] = relationship(back_populates="batch", cascade="all, delete-orphan")
    operations: Mapped[List["ToolOperation"]] = relationship(back_populates="batch", cascade="all, delete-orphan")


class BatchItem(Base):
    """Tool item within a batch."""

    __tablename__ = "batch_items"

    __table_args__ = (UniqueConstraint("batch_id", "tool_id", name="uq_batch_tool"),)

    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"))
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id"))
    status: Mapped[BatchStatus] = mapped_column(SAEnum(BatchStatus), default=BatchStatus.QUEUED)

    batch: Mapped[Batch] = relationship(back_populates="items")
    tool: Mapped[Tool] = relationship(back_populates="batch_items")


class ToolOperation(Base):
    """Operation performed on a batch."""

    __tablename__ = "tool_operations"

    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"))
    op_type: Mapped[OperationType] = mapped_column(SAEnum(OperationType))
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    batch: Mapped[Batch] = relationship(back_populates="operations")
    dim_changes: Mapped[List[ToolDimChange]] = relationship(back_populates="operation")
