"""Alembic environment configuration."""
from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from erp.backend.config import get_settings
from erp.backend.core.database import engine
from erp.backend.models import base as base_model

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = base_model.Base.metadata


def run_migrations_offline() -> None:
    settings = get_settings()
    url = settings.database_url
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section) or {},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
