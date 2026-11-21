"""Visual aids: message.visual, profile.supports_visuels.

Revision ID: 003
Revises: 002
Create Date: 2026-11-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

from alembic import op

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("message", sa.Column("visual", JSON, nullable=True))
    op.add_column(
        "profile",
        sa.Column("supports_visuels", sa.Boolean, nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("profile", "supports_visuels")
    op.drop_column("message", "visual")
