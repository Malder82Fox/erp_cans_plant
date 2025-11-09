"""Aggregate models for Alembic discovery."""
from erp.backend.models.user import RefreshToken, User
from erp.backend.models.warehouse import AuditLog, Category, Location, Part, Vendor
from erp.backend.models.maintenance import Equipment, MaintenanceHistory, PMPlan, PMTemplate, WorkOrder
from erp.backend.models.tooling import Batch, BatchItem, Tool, ToolDim, ToolDimChange, ToolOperation

__all__ = [
    "RefreshToken",
    "User",
    "AuditLog",
    "Category",
    "Location",
    "Vendor",
    "Part",
    "Equipment",
    "MaintenanceHistory",
    "PMPlan",
    "PMTemplate",
    "WorkOrder",
    "Batch",
    "BatchItem",
    "Tool",
    "ToolDim",
    "ToolDimChange",
    "ToolOperation",
]
