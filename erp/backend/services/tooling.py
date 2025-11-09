"""Tooling service layer."""
from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from erp.backend.models.tooling import (
    Batch,
    BatchItem,
    BatchStatus,
    OperationType,
    Tool,
    ToolDim,
    ToolDimChange,
    ToolOperation,
)
from erp.backend.repositories.tooling import (
    BatchItemRepository,
    BatchRepository,
    ToolDimChangeRepository,
    ToolDimRepository,
    ToolOperationRepository,
    ToolRepository,
)
from erp.backend.schemas.tooling import (
    BatchOperationPayload,
    BatchOperationResult,
    BatchReport,
    BatchUpdate,
    ToolCreate,
    ToolUpdate,
)


class ToolingService:
    """Service orchestrating tooling workflows."""

    def __init__(self, session: Session):
        self.session = session
        self.tools = ToolRepository(session)
        self.tool_dims = ToolDimRepository(session)
        self.batches = BatchRepository(session)
        self.batch_items = BatchItemRepository(session)
        self.operations = ToolOperationRepository(session)
        self.dim_changes = ToolDimChangeRepository(session)

    def list_tools(self):
        return self.tools.list()

    def create_tool(self, payload: ToolCreate) -> Tool:
        tool = Tool(**payload.model_dump())
        self.tools.add(tool)
        return tool

    def update_tool(self, tool_id: int, payload: ToolUpdate) -> Tool:
        tool = self.tools.get(tool_id)
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(tool, key, value)
        return tool

    def delete_tool(self, tool_id: int) -> None:
        tool = self.tools.get(tool_id)
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found")
        self.session.delete(tool)

    def list_batches(self):
        return self.batches.list()

    def create_batch(self, name: str, tool_ids: list[int], status: BatchStatus = BatchStatus.QUEUED) -> Batch:
        batch = Batch(name=name, status=status)
        self.batches.add(batch)
        for tool_id in tool_ids:
            tool = self.tools.get(tool_id)
            if not tool:
                raise HTTPException(status_code=404, detail=f"Tool {tool_id} not found")
            item = BatchItem(batch=batch, tool=tool, status=BatchStatus.QUEUED)
            self.batch_items.add(item)
        return batch

    def update_batch(self, batch_id: int, payload: BatchUpdate) -> Batch:
        batch = self.batches.get(batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(batch, key, value)
        return batch

    def process_operation(self, batch_id: int, payload: BatchOperationPayload) -> BatchOperationResult:
        batch = self.batches.get(batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        operation = ToolOperation(batch=batch, op_type=payload.op_type)
        self.operations.add(operation)
        processed = 0
        skipped = 0
        if payload.op_type == OperationType.GRINDING:
            if payload.apply_to_all:
                changes = payload.changes
                for item in batch.items:
                    if item.status == BatchStatus.PROCESSED:
                        skipped += 1
                        continue
                    self._apply_dim_changes(item.tool, operation, changes)
                    item.status = BatchStatus.PROCESSED
                    processed += 1
            else:
                for entry in payload.changes:
                    tool_id = entry.get("tool_id") if isinstance(entry, dict) else None
                    change_list = entry.get("changes", []) if isinstance(entry, dict) else []
                    item = next((i for i in batch.items if i.tool_id == tool_id), None)
                    if not item:
                        skipped += 1
                        continue
                    if item.status == BatchStatus.PROCESSED:
                        skipped += 1
                        continue
                    self._apply_dim_changes(item.tool, operation, change_list)
                    item.status = BatchStatus.PROCESSED
                    processed += 1
            if processed:
                batch.status = BatchStatus.PROCESSED
        else:
            for item in batch.items:
                if item.status == BatchStatus.PROCESSED:
                    skipped += 1
                    continue
                item.status = BatchStatus.PROCESSED
                processed += 1
            if processed:
                batch.status = BatchStatus.PROCESSED
        return BatchOperationResult(processed=processed, skipped=skipped)

    def _apply_dim_changes(self, tool: Tool, operation: ToolOperation, changes) -> None:
        for change in changes:
            dim_name = change["dim_name"] if isinstance(change, dict) else change.dim_name
            new_value = change["new_value"] if isinstance(change, dict) else change.new_value
            dim = self.tool_dims.get_by_name(tool.id, dim_name)
            old_value = Decimal(str(dim.value)) if dim else Decimal("0")
            if dim:
                dim.value = Decimal(str(new_value))
            else:
                dim = ToolDim(tool=tool, dim_name=dim_name, value=Decimal(str(new_value)))
                self.tool_dims.add(dim)
            change_entry = ToolDimChange(
                tool=tool,
                dim_name=dim_name,
                old_value=old_value,
                new_value=Decimal(str(new_value)),
                operation=operation,
            )
            self.dim_changes.add(change_entry)

    def get_tool_dimensions(self, tool_id: int):
        tool = self.tools.get(tool_id)
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found")
        history = self.dim_changes.list_for_tool(tool_id)
        return tool.dims, history

    def generate_batch_report(self, batch_id: int) -> BatchReport:
        batch = self.batches.get(batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        rows = ["<tr><th>Tool</th><th>Status</th></tr>"]
        for item in batch.items:
            rows.append(f"<tr><td>{item.tool.name}</td><td>{item.status.value}</td></tr>")
        html = f"<html><body><h1>Batch {batch.name}</h1><table>{''.join(rows)}</table></body></html>"
        return BatchReport(batch_id=batch.id, html=html)
