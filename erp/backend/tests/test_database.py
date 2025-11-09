"""Tests for database schema utilities."""
from __future__ import annotations

from pathlib import Path

from sqlalchemy import Column, Integer, MetaData, Table, create_engine, inspect

from erp.backend.core.database import create_database_schema, render_database_url


def test_create_database_schema(tmp_path: Path) -> None:
    """create_database_schema should create all tables for the provided metadata."""

    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", future=True)
    metadata = MetaData()
    Table("example", metadata, Column("id", Integer, primary_key=True))

    table_count = create_database_schema(target_engine=engine, metadata=metadata)

    assert table_count == 1
    inspector = inspect(engine)
    assert inspector.has_table("example")
    assert render_database_url(target_engine=engine).startswith("sqlite:")
