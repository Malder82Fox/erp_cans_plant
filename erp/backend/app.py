"""FastAPI application entry point."""
from __future__ import annotations

from fastapi import FastAPI

from erp.backend.api.v1.auth.router import router as auth_router
from erp.backend.api.v1.maintenance.router import router as maintenance_router
from erp.backend.api.v1.tooling.router import router as tooling_router
from erp.backend.api.v1.users.router import router as users_router
from erp.backend.api.v1.warehouse.router import router as warehouse_router
from erp.backend.core.database import init_database

app = FastAPI(title="ERP Platform", version="1.0.0")


@app.on_event("startup")
def on_startup() -> None:
    """Application startup hook."""

    init_database()


@app.get("/health", tags=["Health"])
def healthcheck() -> dict[str, str]:
    """Return service health information."""

    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(warehouse_router)
app.include_router(maintenance_router)
app.include_router(tooling_router)
app.include_router(users_router)
