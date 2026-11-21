"""Message pedagogical type (kind, hint_level).

Revision ID: 002
Revises: 001
Create Date: 2026-11-20
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("message", sa.Column("kind", sa.String(20), nullable=True))
    op.add_column("message", sa.Column("hint_level", sa.Integer, nullable=True))


def downgrade() -> None:
    op.drop_column("message", "hint_level")
    op.drop_column("message", "kind")
