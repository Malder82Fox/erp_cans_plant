"""Tests for the management CLI entry point."""
from __future__ import annotations

import scripts.manage as manage


def test_init_db_command(monkeypatch, capsys) -> None:
    """The init-db command should print the number of tables and DSN."""

    def fake_create_schema() -> int:
        return 5

    def fake_render_database_url(
        target_engine: object | None = None, *, hide_password: bool = True
    ) -> str:
        assert hide_password is True
        return "sqlite:///memory"

    monkeypatch.setattr(manage, "create_database_schema", fake_create_schema)
    monkeypatch.setattr(manage, "render_database_url", fake_render_database_url)

    manage.main(["init-db"])

    out = capsys.readouterr().out.strip()
    assert out == "Created 5 tables in sqlite:///memory."
