"""Plages horaires : validation du schéma et de l'API admin (éditeur de plages)."""

from __future__ import annotations

from datetime import datetime
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.api.schemas import ProfileUpdate, validate_plages_horaires
from app.db.models import Admin, Profile
from app.services.quota import is_within_time_window


class TestValidatePlagesHoraires:
    def test_none_means_no_restriction(self):
        assert validate_plages_horaires(None) is None

    def test_valid_schedule_is_sorted(self):
        out = validate_plages_horaires(
            {
                "lundi": [
                    {"debut": "17:00", "fin": "18:00"},
                    {"debut": "08:00", "fin": "08:30"},
                ],
                "dimanche": [],
            }
        )
        assert out == {
            "lundi": [
                {"debut": "08:00", "fin": "08:30"},
                {"debut": "17:00", "fin": "18:00"},
            ],
            "dimanche": [],
        }

    @pytest.mark.parametrize(
        "plages",
        [
            {"funday": [{"debut": "08:00", "fin": "09:00"}]},  # jour inconnu
            {"lundi": [{"debut": "8:00", "fin": "09:00"}]},  # format
            {"lundi": [{"debut": "24:00", "fin": "25:00"}]},  # heure hors bornes
            {"lundi": [{"debut": "10:00", "fin": "09:00"}]},  # fin avant début
            {"lundi": [{"debut": "10:00", "fin": "10:00"}]},  # plage vide
            {
                "lundi": [
                    {"debut": "10:00", "fin": "12:00"},
                    {"debut": "11:00", "fin": "13:00"},
                ]
            },  # chevauchement
            {"lundi": [{"debut": f"0{i}:00", "fin": f"0{i}:30"} for i in range(5)]},  # > 4
            {"lundi": "16:00-18:00"},  # pas une liste
            {"lundi": [{"debut": "10:00"}]},  # fin manquante
        ],
    )
    def test_invalid_schedules_rejected(self, plages):
        with pytest.raises(ValueError):
            validate_plages_horaires(plages)

    def test_legacy_day_aliases_are_normalised(self):
        out = validate_plages_horaires(
            {
                "mon": [{"debut": "08:00", "fin": "09:00"}],
                "Lundi": [{"debut": "17:00", "fin": "18:00"}],
                "sam": [{"debut": "10:00", "fin": "12:00"}],
                "sunday": [],
            }
        )
        assert out == {
            "lundi": [
                {"debut": "08:00", "fin": "09:00"},
                {"debut": "17:00", "fin": "18:00"},
            ],
            "samedi": [{"debut": "10:00", "fin": "12:00"}],
            "dimanche": [],
        }

    def test_legacy_alias_overlap_still_rejected(self):
        with pytest.raises(ValueError):
            validate_plages_horaires(
                {
                    "lun": [{"debut": "08:00", "fin": "10:00"}],
                    "monday": [{"debut": "09:00", "fin": "11:00"}],
                }
            )

    def test_profile_update_uses_validator(self):
        with pytest.raises(ValidationError):
            ProfileUpdate(plages_horaires={"lundi": [{"debut": "12:00", "fin": "11:00"}]})
        assert ProfileUpdate(plages_horaires=None).plages_horaires is None


class TestTimeWindowSemantics:
    def _profile(self, plages):
        return Profile(prenom="T", age=8, niveau="CE2", pin_hash="x", plages_horaires=plages)

    def test_inside_and_outside_window(self):
        plages = {"mercredi": [{"debut": "14:00", "fin": "18:00"}]}
        wed_15h = datetime(2026, 11, 18, 15, 0)  # mercredi
        wed_19h = datetime(2026, 11, 18, 19, 0)
        thu_15h = datetime(2026, 11, 19, 15, 0)  # jeudi : jour fermé
        with patch("app.services.quota.datetime") as dt:
            dt.now.return_value = wed_15h
            assert is_within_time_window(self._profile(plages))
            dt.now.return_value = wed_19h
            assert not is_within_time_window(self._profile(plages))
            dt.now.return_value = thu_15h
            assert not is_within_time_window(self._profile(plages))

    def test_no_schedule_always_allowed(self):
        assert is_within_time_window(self._profile(None))


async def _admin_headers(client: AsyncClient) -> dict[str, str]:
    r = await client.post(
        "/api/auth/admin/login",
        json={"email": "admin@test.com", "password": "test-password-123"},
    )
    assert r.status_code == 200
    csrf = client.cookies.get("lumio_csrf") or ""
    return {"X-CSRF-Token": csrf}


@pytest_asyncio.fixture
async def https_client(app):
    # Les cookies de session sont « Secure » : il faut une origine https.
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://testserver") as c:
        yield c


class TestScheduleApi:
    @pytest.mark.asyncio
    async def test_patch_valid_schedule_then_clear(
        self, https_client: AsyncClient, admin_user: Admin, child_profile: Profile
    ):
        client = https_client
        headers = await _admin_headers(client)
        plages = {
            "lundi": [{"debut": "16:30", "fin": "18:00"}],
            "samedi": [{"debut": "10:00", "fin": "12:00"}],
        }
        r = await client.patch(
            f"/api/admin/profiles/{child_profile.id}",
            json={"plages_horaires": plages},
            headers=headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["plages_horaires"] == plages

        r = await client.patch(
            f"/api/admin/profiles/{child_profile.id}",
            json={"plages_horaires": None},
            headers=headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["plages_horaires"] is None

    @pytest.mark.asyncio
    async def test_legacy_schedule_does_not_block_profile_save(
        self, https_client: AsyncClient, admin_user: Admin, child_profile: Profile, db_session
    ):
        # Profil existant avec des clés héritées de l'ancienne page admin.
        child_profile.plages_horaires = {"lun": [{"debut": "16:00", "fin": "18:00"}]}
        await db_session.commit()
        client = https_client
        headers = await _admin_headers(client)
        r = await client.patch(
            f"/api/admin/profiles/{child_profile.id}",
            json={"prenom": "Léa", "plages_horaires": child_profile.plages_horaires},
            headers=headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["plages_horaires"] == {"lundi": [{"debut": "16:00", "fin": "18:00"}]}

    @pytest.mark.asyncio
    async def test_patch_overlapping_schedule_rejected(
        self, https_client: AsyncClient, admin_user: Admin, child_profile: Profile
    ):
        client = https_client
        headers = await _admin_headers(client)
        r = await client.patch(
            f"/api/admin/profiles/{child_profile.id}",
            json={
                "plages_horaires": {
                    "lundi": [
                        {"debut": "16:00", "fin": "18:00"},
                        {"debut": "17:00", "fin": "19:00"},
                    ]
                }
            },
            headers=headers,
        )
        assert r.status_code == 422
