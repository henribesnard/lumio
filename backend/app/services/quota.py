"""Quota and time-window enforcement."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import select

from app.db.models import Profile, UsageDaily

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


async def get_today_usage(db: AsyncSession, profile_id: str) -> UsageDaily | None:
    result = await db.execute(
        select(UsageDaily).where(
            UsageDaily.profile_id == profile_id,
            UsageDaily.date == date.today(),
        )
    )
    return result.scalar_one_or_none()


async def get_remaining_quota(db: AsyncSession, profile: Profile) -> tuple[int, int]:
    """Return (messages_remaining, tokens_remaining)."""
    usage = await get_today_usage(db, profile.id)
    if not usage:
        return profile.quota_messages_jour, profile.quota_tokens_jour
    msg_remaining = max(0, profile.quota_messages_jour - usage.messages)
    tok_remaining = max(0, profile.quota_tokens_jour - (usage.tokens_in + usage.tokens_out))
    return msg_remaining, tok_remaining


async def increment_usage(
    db: AsyncSession, profile_id: str, tokens_in: int = 0, tokens_out: int = 0
) -> None:
    usage = await get_today_usage(db, profile_id)
    if not usage:
        usage = UsageDaily(
            profile_id=profile_id,
            date=date.today(),
            messages=1,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
        )
        db.add(usage)
    else:
        usage.messages += 1
        usage.tokens_in += tokens_in
        usage.tokens_out += tokens_out


def is_within_time_window(profile: Profile) -> bool:
    """Check if current time is within allowed time windows."""
    if not profile.plages_horaires:
        return True

    now = datetime.now()
    day_name = now.strftime("%A").lower()
    # Map French day names
    day_map = {
        "monday": "lundi",
        "tuesday": "mardi",
        "wednesday": "mercredi",
        "thursday": "jeudi",
        "friday": "vendredi",
        "saturday": "samedi",
        "sunday": "dimanche",
    }
    fr_day = day_map.get(day_name, day_name)

    windows = profile.plages_horaires.get(fr_day, [])
    if not windows:
        # No window defined for today = not allowed
        # Unless no days are defined at all (checked above with not profile.plages_horaires)
        return False

    current_time = now.strftime("%H:%M")
    for window in windows:
        start = window.get("debut", "00:00")
        end = window.get("fin", "23:59")
        if start <= current_time <= end:
            return True
    return False


async def check_quota_and_schedule(db: AsyncSession, profile: Profile) -> str | None:
    """Return a friendly error message if quota exceeded or outside schedule, else None."""
    if not is_within_time_window(profile):
        return (
            "Ce n'est pas le moment de discuter avec Lumio. Reviens pendant les heures autorisées !"
        )

    msg_remaining, tok_remaining = await get_remaining_quota(db, profile)
    if msg_remaining <= 0:
        return "Tu as utilisé tous tes messages pour aujourd'hui. On se retrouve demain !"
    if tok_remaining <= 0:
        return "Tu as beaucoup discuté aujourd'hui ! On se retrouve demain pour continuer."

    return None
