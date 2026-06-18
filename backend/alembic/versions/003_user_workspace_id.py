"""add user workspace_id for single-workspace access

Revision ID: 003
Revises: 002
Create Date: 2026-06-18
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_workspace_id",
        "users",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index("ix_users_workspace_id", "users", ["workspace_id"])

    op.execute(
        """
        UPDATE users u
        SET workspace_id = sub.workspace_id
        FROM (
            SELECT DISTINCT ON (wm.user_id)
                wm.user_id,
                wm.workspace_id
            FROM workspace_members wm
            ORDER BY wm.user_id,
                CASE wm.role
                    WHEN 'owner' THEN 0
                    WHEN 'admin' THEN 1
                    ELSE 2
                END,
                wm.joined_at ASC
        ) AS sub
        WHERE u.id = sub.user_id
        """
    )

    op.execute(
        """
        DELETE FROM workspace_members wm
        USING users u
        WHERE wm.user_id = u.id
          AND u.workspace_id IS NOT NULL
          AND wm.workspace_id <> u.workspace_id
        """
    )

    op.create_unique_constraint(
        "uq_workspace_members_user_id",
        "workspace_members",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_workspace_members_user_id", "workspace_members", type_="unique")
    op.drop_index("ix_users_workspace_id", table_name="users")
    op.drop_constraint("fk_users_workspace_id", "users", type_="foreignkey")
    op.drop_column("users", "workspace_id")
