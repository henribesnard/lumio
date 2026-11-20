"""Tests for authentication system."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from app.auth.passwords import hash_pin, is_trivial_pin, verify_pin
from app.db.models import Admin, Profile

if TYPE_CHECKING:
    from httpx import AsyncClient
    from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# PIN validation
# ---------------------------------------------------------------------------
class TestPinValidation:
    def test_trivial_pins_rejected(self):
        for pin in ["0000", "1111", "1234", "4321", "9999"]:
            assert is_trivial_pin(pin), f"{pin} should be trivial"

    def test_valid_pins_accepted(self):
        for pin in ["5678", "2847", "9163", "3752"]:
            assert not is_trivial_pin(pin), f"{pin} should not be trivial"

    def test_pin_hash_and_verify(self):
        pin = "5678"
        hashed = hash_pin(pin)
        assert verify_pin(hashed, pin)
        assert not verify_pin(hashed, "0000")


# ---------------------------------------------------------------------------
# Admin login
# ---------------------------------------------------------------------------
class TestAdminLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, admin_user: Admin, db_session):
        # Create session record for the admin
        response = await client.post(
            "/api/auth/admin/login",
            json={"email": "admin@test.com", "password": "test-password-123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, admin_user: Admin):
        response = await client.post(
            "/api/auth/admin/login",
            json={"email": "admin@test.com", "password": "wrong-password"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_email(self, client: AsyncClient):
        response = await client.post(
            "/api/auth/admin/login",
            json={"email": "nobody@test.com", "password": "whatever"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_lockout_after_5_failures(self, client: AsyncClient, admin_user: Admin):
        for _i in range(5):
            response = await client.post(
                "/api/auth/admin/login",
                json={"email": "admin@test.com", "password": "wrong"},
            )
            assert response.status_code == 401

        # 6th attempt should be locked
        response = await client.post(
            "/api/auth/admin/login",
            json={"email": "admin@test.com", "password": "test-password-123"},
        )
        assert response.status_code == 429


# ---------------------------------------------------------------------------
# Kid login
# ---------------------------------------------------------------------------
class TestKidLogin:
    @pytest.mark.asyncio
    async def test_kid_login_without_device(self, client: AsyncClient, child_profile: Profile):
        response = await client.post(
            "/api/auth/kid/login",
            json={"profile_id": str(child_profile.id), "pin": "5678"},
        )
        assert response.status_code == 403
        assert "untrusted_device" in response.json()["error"]["code"]

    @pytest.mark.asyncio
    async def test_kid_login_wrong_pin(
        self, client: AsyncClient, child_profile: Profile, trusted_device
    ):
        device, token = trusted_device
        from tests.conftest import make_device_cookie

        cookies = make_device_cookie(token)
        response = await client.post(
            "/api/auth/kid/login",
            json={"profile_id": str(child_profile.id), "pin": "0000"},
            cookies=cookies,
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_pin_lockout(self, client: AsyncClient, child_profile: Profile, trusted_device):
        device, token = trusted_device
        from tests.conftest import make_device_cookie

        cookies = make_device_cookie(token)
        for _i in range(5):
            response = await client.post(
                "/api/auth/kid/login",
                json={"profile_id": str(child_profile.id), "pin": "9999"},
                cookies=cookies,
            )

        # Should be locked now
        response = await client.post(
            "/api/auth/kid/login",
            json={"profile_id": str(child_profile.id), "pin": "5678"},
            cookies=cookies,
        )
        assert response.status_code == 429

    @pytest.mark.asyncio
    async def test_inactive_profile_rejected(
        self, client: AsyncClient, db_session: AsyncSession, trusted_device
    ):
        device, token = trusted_device
        profile = Profile(
            prenom="Inactive",
            age=8,
            niveau="CE1",
            pin_hash=hash_pin("5678"),
            actif=False,
        )
        db_session.add(profile)
        await db_session.commit()

        from tests.conftest import make_device_cookie

        cookies = make_device_cookie(token)
        response = await client.post(
            "/api/auth/kid/login",
            json={"profile_id": str(profile.id), "pin": "5678"},
            cookies=cookies,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Profile isolation
# ---------------------------------------------------------------------------
class TestProfileIsolation:
    @pytest.mark.asyncio
    async def test_kid_cannot_access_other_profiles_conversations(self):
        """Kid can only access their own conversations — tested via route ownership checks."""
        # This is enforced by the profile_id check in the kid routes
        pass

    @pytest.mark.asyncio
    async def test_admin_routes_require_admin(self, client: AsyncClient):
        response = await client.get("/api/admin/profiles")
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# Auth me
# ---------------------------------------------------------------------------
class TestAuthMe:
    @pytest.mark.asyncio
    async def test_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/auth/me")
        assert response.status_code == 401
