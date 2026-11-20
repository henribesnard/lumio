"""Retention purge — delete conversations older than CONVERSATION_RETENTION_DAYS."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import delete

from app.config import get_settings
from app.db.models import Conversation
from app.db.session import async_session

logger = logging.getLogger(__name__)


async def purge_old_conversations() -> int:
    """Delete conversations whose updated_at is older than the retention window.

    Messages and safety events are cascade-deleted by the FK constraint.
    Returns the number of deleted conversations.
    """
    settings = get_settings()
    cutoff = datetime.utcnow() - timedelta(days=settings.conversation_retention_days)

    async with async_session() as db:
        result = await db.execute(delete(Conversation).where(Conversation.updated_at < cutoff))
        await db.commit()
        count = result.rowcount or 0

    if count:
        logger.info("retention: purged %d conversations older than %s", count, cutoff.date())
    return count


async def retention_loop() -> None:
    """Run the purge once a day in the background."""
    while True:
        try:
            await purge_old_conversations()
        except Exception:
            logger.exception("retention: purge failed")
        await asyncio.sleep(86400)  # 24 h
