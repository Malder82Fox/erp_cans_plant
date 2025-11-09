"""Warehouse schemas."""
from __future__ import annotations

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CategoryRead(BaseModel):
    """Category response model."""

    id: int
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class LocationRead(BaseModel):
    """Location response model."""

    id: int
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class VendorRead(BaseModel):
    """Vendor response model."""

    id: int
    name: str
    contact_email: str | None = None

    model_config = {"from_attributes": True}


class PartBase(BaseModel):
    """Shared fields for part creation/update."""

    part_code: str = Field(pattern=r"^[A-Za-z0-9._-]{1,64}$")
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    location_id: Optional[int] = None
    vendor_id: Optional[int] = None
    qty_on_hand: Decimal = Field(default=Decimal("0"), ge=0)
    min_stock: Decimal = Field(default=Decimal("0"), ge=0)
    price: Decimal = Field(default=Decimal("0"), ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)


class PartCreate(PartBase):
    """Part creation payload."""

    pass


class PartUpdate(BaseModel):
    """Partial update payload for parts."""

    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    location_id: Optional[int] = None
    vendor_id: Optional[int] = None
    qty_on_hand: Optional[Decimal] = Field(default=None, ge=0)
    min_stock: Optional[Decimal] = Field(default=None, ge=0)
    price: Optional[Decimal] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)


class PartRead(PartBase):
    """Part response model."""

    id: int
    is_deleted: bool

    model_config = {"from_attributes": True}


class ImportResult(BaseModel):
    """Result summary for import operation."""

    created: int
    skipped: int
    errors: int


class AuditLogRead(BaseModel):
    """Audit log entry."""

    id: int
    entity_type: str
    entity_id: int
    action: str
    user_id: int | None = None
    changes: str | None = None

    model_config = {"from_attributes": True}
