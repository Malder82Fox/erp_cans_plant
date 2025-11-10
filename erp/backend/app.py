"""FastAPI application entry point."""
from __future__ import annotations

import logging

from fastapi import FastAPI

from erp.backend.api.v1.auth.router import router as auth_router
from erp.backend.api.v1.maintenance.router import router as maintenance_router
from erp.backend.api.v1.tooling.router import router as tooling_router
from erp.backend.api.v1.users.router import router as users_router
from erp.backend.api.v1.warehouse.router import router as warehouse_router
from erp.backend.config import get_settings
from erp.backend.core.database import create_database_schema, render_database_url

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(title="ERP Platform", version="1.0.0")


@app.on_event("startup")
def on_startup() -> None:
    """Application startup hook."""

    if settings.auto_create_db_schema:
        logger.info("AUTO_CREATE_DB_SCHEMA enabled; ensuring tables exist...")
        table_count = create_database_schema()
        logger.info(
            "Ensured %s tables exist in %s", table_count, render_database_url()
        )


@app.get("/health", tags=["Health"])
def healthcheck() -> dict[str, str]:
    """Return service health information."""

    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(warehouse_router)
app.include_router(maintenance_router)
app.include_router(tooling_router)
app.include_router(users_router)
