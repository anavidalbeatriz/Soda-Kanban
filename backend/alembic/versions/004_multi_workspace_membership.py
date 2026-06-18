"""allow users to belong to multiple workspaces

Revision ID: 004
Revises: 003
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("uq_workspace_members_user_id", "workspace_members", type_="unique")


def downgrade() -> None:
    op.create_unique_constraint(
        "uq_workspace_members_user_id",
        "workspace_members",
        ["user_id"],
    )
