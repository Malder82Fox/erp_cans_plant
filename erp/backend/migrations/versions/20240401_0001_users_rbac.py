"""Add user RBAC fields and audit logs."""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20240401_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column(
        "users",
        sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_unique_constraint("uq_users_username", "users", ["username"])

    if op.get_bind().dialect.name != "sqlite":
        op.execute("UPDATE users SET password_hash = hashed_password")
    else:
        # SQLite lacks alter column rename; copy via temporary table operations if column exists.
        with op.get_context().autocommit_block():
            op.execute("UPDATE users SET password_hash = hashed_password")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("full_name")
        batch_op.drop_column("hashed_password")

    op.create_table(
        "user_audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("changes_json", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("user_audit_logs")
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("hashed_password", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("full_name", sa.String(length=100), nullable=True))
        batch_op.drop_column("must_change_password")
        batch_op.drop_column("is_active")
        batch_op.drop_column("password_hash")
        batch_op.drop_column("email")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_constraint("uq_users_username", "users", type_="unique")
