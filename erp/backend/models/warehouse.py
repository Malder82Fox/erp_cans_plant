"""Warehouse module models."""
from __future__ import annotations

from decimal import Decimal
from typing import List, Optional

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from erp.backend.models.base import Base


class Category(Base):
    """Part category."""

    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parts: Mapped[List["Part"]] = relationship(back_populates="category")


class Location(Base):
    """Storage location."""

    __tablename__ = "locations"

    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parts: Mapped[List["Part"]] = relationship(back_populates="location")


class Vendor(Base):
    """Vendor information."""

    __tablename__ = "vendors"

    name: Mapped[str] = mapped_column(String(100), unique=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parts: Mapped[List["Part"]] = relationship(back_populates="vendor")


class Part(Base):
    """Spare part entity."""

    __tablename__ = "parts"

    part_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    location_id: Mapped[Optional[int]] = mapped_column(ForeignKey("locations.id"), nullable=True)
    vendor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vendors.id"), nullable=True)
    qty_on_hand: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    min_stock: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped[Optional[Category]] = relationship(back_populates="parts")
    location: Mapped[Optional[Location]] = relationship(back_populates="parts")
    vendor: Mapped[Optional[Vendor]] = relationship(back_populates="parts")


class AuditLog(Base):
    """Track entity changes."""

    __tablename__ = "audit_logs"

    entity_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[int] = mapped_column()
    action: Mapped[str] = mapped_column(String(50))
    user_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    changes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
