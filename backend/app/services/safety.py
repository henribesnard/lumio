"""Safety event management."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SafetyEvent


async def create_safety_event(
    db: AsyncSession,
    *,
    event_type: str,
    severity: str,
    profile_id: uuid.UUID | None = None,
    conversation_id: uuid.UUID | None = None,
    message_id: uuid.UUID | None = None,
    extrait: str | None = None,
) -> SafetyEvent:
    event = SafetyEvent(
        profile_id=profile_id,
        conversation_id=conversation_id,
        message_id=message_id,
        type=event_type,
        severity=severity,
        extrait=extrait[:500] if extrait else None,
    )
    db.add(event)
    await db.flush()
    return event
