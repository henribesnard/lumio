"""Tests for quota and time-window enforcement."""

from __future__ import annotations

from datetime import date
from unittest.mock import patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Profile, UsageDaily
from app.services.quota import (
    check_quota_and_schedule,
    get_remaining_quota,
    is_within_time_window,
)


class TestQuota:
    @pytest.mark.asyncio
    async def test_full_quota_available(self, db_session: AsyncSession, child_profile: Profile):
        msg, tok = await get_remaining_quota(db_session, child_profile)
        assert msg == child_profile.quota_messages_jour
        assert tok == child_profile.quota_tokens_jour

    @pytest.mark.asyncio
    async def test_quota_decremented(self, db_session: AsyncSession, child_profile: Profile):
        usage = UsageDaily(
            profile_id=child_profile.id,
            date=date.today(),
            messages=10,
            tokens_in=5000,
            tokens_out=5000,
        )
        db_session.add(usage)
        await db_session.flush()

        msg, tok = await get_remaining_quota(db_session, child_profile)
        assert msg == child_profile.quota_messages_jour - 10
        assert tok == child_profile.quota_tokens_jour - 10000

    @pytest.mark.asyncio
    async def test_quota_exhausted(self, db_session: AsyncSession, child_profile: Profile):
        usage = UsageDaily(
            profile_id=child_profile.id,
            date=date.today(),
            messages=child_profile.quota_messages_jour,
            tokens_in=0,
            tokens_out=0,
        )
        db_session.add(usage)
        await db_session.flush()

        result = await check_quota_and_schedule(db_session, child_profile)
        assert result is not None
        notice_type, msg = result
        assert notice_type == "quota"
        assert "demain" in msg.lower()


class TestTimeWindows:
    def test_no_schedule_allows_all(self, child_profile: Profile):
        child_profile.plages_horaires = None
        assert is_within_time_window(child_profile)

    @patch("app.services.quota.datetime")
    def test_within_window(self, mock_dt, child_profile: Profile):
        from datetime import datetime

        mock_dt.now.return_value = datetime(2025, 1, 6, 15, 0)  # Monday 15:00
        mock_dt.min.time.return_value = datetime.min.time()
        child_profile.plages_horaires = {
            "lundi": [{"debut": "14:00", "fin": "18:00"}],
        }
        assert is_within_time_window(child_profile)

    @patch("app.services.quota.datetime")
    def test_outside_window(self, mock_dt, child_profile: Profile):
        from datetime import datetime

        mock_dt.now.return_value = datetime(2025, 1, 6, 22, 0)  # Monday 22:00
        mock_dt.min.time.return_value = datetime.min.time()
        child_profile.plages_horaires = {
            "lundi": [{"debut": "14:00", "fin": "18:00"}],
        }
        assert not is_within_time_window(child_profile)
