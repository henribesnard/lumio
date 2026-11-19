"""Initial schema.

Revision ID: 001
Revises:
Create Date: 2025-01-01
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSON, UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Admin
    op.create_table(
        "admin",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("totp_secret", sa.String(64), nullable=True),
        sa.Column("last_login_at", sa.DateTime, nullable=True),
        sa.Column("failed_login_count", sa.Integer, default=0, nullable=False),
        sa.Column("locked_until", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # Trusted device
    op.create_table(
        "trusted_device",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("token_hash", sa.Text, nullable=False, unique=True),
        sa.Column("last_seen_at", sa.DateTime, nullable=True),
        sa.Column("expires_at", sa.DateTime, nullable=False),
        sa.Column("revoked_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # Profile
    op.create_table(
        "profile",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("prenom", sa.String(50), nullable=False),
        sa.Column("age", sa.Integer, nullable=False),
        sa.Column("niveau", sa.String(10), nullable=False),
        sa.Column("avatar", sa.String(30), default="avatar-01", nullable=False),
        sa.Column("pin_hash", sa.Text, nullable=False),
        sa.Column("consignes_admin", sa.Text, nullable=True),
        sa.Column("sujets_interdits", JSON, nullable=True),
        sa.Column("modele", sa.String(50), nullable=True),
        sa.Column("quota_messages_jour", sa.Integer, default=50, nullable=False),
        sa.Column("quota_tokens_jour", sa.Integer, default=50000, nullable=False),
        sa.Column("plages_horaires", JSON, nullable=True),
        sa.Column("actif", sa.Boolean, default=True, nullable=False),
        sa.Column("failed_pin_count", sa.Integer, default=0, nullable=False),
        sa.Column("locked_until", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # Learner notes
    op.create_table(
        "learner_notes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "profile_id",
            UUID(as_uuid=True),
            sa.ForeignKey("profile.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("matiere", sa.String(50), nullable=False),
        sa.Column("notes", sa.Text, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # Conversation
    op.create_table(
        "conversation",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "profile_id",
            UUID(as_uuid=True),
            sa.ForeignKey("profile.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("titre", sa.String(200), default="Nouvelle conversation", nullable=False),
        sa.Column("archived", sa.Boolean, default=False, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # Message
    op.create_table(
        "message",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            UUID(as_uuid=True),
            sa.ForeignKey("conversation.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("contenu", sa.Text, nullable=False),
        sa.Column("tokens_in", sa.Integer, default=0, nullable=False),
        sa.Column("tokens_out", sa.Integer, default=0, nullable=False),
        sa.Column("modele", sa.String(50), nullable=True),
        sa.Column("moderation", JSON, nullable=True),
        sa.Column("guard_verdict", JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # Safety event
    op.create_table(
        "safety_event",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "profile_id",
            UUID(as_uuid=True),
            sa.ForeignKey("profile.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "conversation_id",
            UUID(as_uuid=True),
            sa.ForeignKey("conversation.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "message_id",
            UUID(as_uuid=True),
            sa.ForeignKey("message.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("type", sa.String(40), nullable=False),
        sa.Column("severity", sa.String(10), nullable=False),
        sa.Column("extrait", sa.Text, nullable=True),
        sa.Column("acknowledged_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # Usage daily
    op.create_table(
        "usage_daily",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "profile_id",
            UUID(as_uuid=True),
            sa.ForeignKey("profile.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("messages", sa.Integer, default=0, nullable=False),
        sa.Column("tokens_in", sa.Integer, default=0, nullable=False),
        sa.Column("tokens_out", sa.Integer, default=0, nullable=False),
    )
    op.create_index("ix_usage_daily_profile_date", "usage_daily", ["profile_id", "date"])

    # Audit log
    op.create_table(
        "audit_log",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("admin_id", UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_id", UUID(as_uuid=True), nullable=True),
        sa.Column("details", JSON, nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    # Session record
    op.create_table(
        "session_record",
        sa.Column("id", sa.String(128), primary_key=True),
        sa.Column("data", JSON, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("expires_at", sa.DateTime, nullable=False),
        sa.Column("last_activity", sa.DateTime, nullable=False),
    )
    op.create_index("ix_session_record_expires", "session_record", ["expires_at"])


def downgrade() -> None:
    op.drop_table("session_record")
    op.drop_table("audit_log")
    op.drop_index("ix_usage_daily_profile_date")
    op.drop_table("usage_daily")
    op.drop_table("safety_event")
    op.drop_table("message")
    op.drop_table("conversation")
    op.drop_table("learner_notes")
    op.drop_table("profile")
    op.drop_table("trusted_device")
    op.drop_table("admin")
