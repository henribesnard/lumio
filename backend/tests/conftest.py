"""Shared test fixtures."""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import Settings, get_settings
from app.db.base import Base
from app.db.models import Admin, Profile, TrustedDevice
from app.auth.passwords import hash_password, hash_pin
from app.auth.sessions import _sign


# ---------------------------------------------------------------------------
# Test settings
# ---------------------------------------------------------------------------
def get_test_settings() -> Settings:
    return Settings(
        database_url="sqlite+aiosqlite:///",
        database_url_sync="sqlite:///",
        session_secret="test-secret-at-least-32-chars-long",
        public_url="http://testserver",
        mistral_api_key="test-key",
    )


# ---------------------------------------------------------------------------
# DB fixtures
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session


# ---------------------------------------------------------------------------
# App fixture
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def app(db_engine):
    from app.main import app as fastapi_app
    from app.db.session import get_db

    test_session = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with test_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    fastapi_app.dependency_overrides[get_db] = override_get_db

    with patch("app.config.get_settings", return_value=get_test_settings()):
        yield fastapi_app

    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


# ---------------------------------------------------------------------------
# Data fixtures
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> Admin:
    admin = Admin(
        email="admin@test.com",
        password_hash=hash_password("test-password-123"),
    )
    db_session.add(admin)
    await db_session.commit()
    return admin


@pytest_asyncio.fixture
async def child_profile(db_session: AsyncSession) -> Profile:
    profile = Profile(
        prenom="Léa",
        age=7,
        niveau="CP",
        avatar="avatar-01",
        pin_hash=hash_pin("5678"),
        quota_messages_jour=50,
        quota_tokens_jour=50000,
    )
    db_session.add(profile)
    await db_session.commit()
    return profile


@pytest_asyncio.fixture
async def second_profile(db_session: AsyncSession) -> Profile:
    profile = Profile(
        prenom="Noah",
        age=10,
        niveau="CM2",
        avatar="avatar-02",
        pin_hash=hash_pin("4567"),
    )
    db_session.add(profile)
    await db_session.commit()
    return profile


@pytest_asyncio.fixture
async def trusted_device(db_session: AsyncSession) -> tuple[TrustedDevice, str]:
    token = "test-device-token-abc123"
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    device = TrustedDevice(
        label="Test Device",
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=90),
    )
    db_session.add(device)
    await db_session.commit()
    return device, token


def make_admin_cookies(admin: Admin) -> dict:
    """Create signed admin session cookies for testing."""
    from app.auth.sessions import _sign, ADMIN_COOKIE, CSRF_COOKIE
    import secrets

    session_id = "test-admin-session"
    csrf_token = secrets.token_urlsafe(32)
    return {
        ADMIN_COOKIE: _sign(session_id),
        CSRF_COOKIE: csrf_token,
    }, csrf_token, session_id


def make_device_cookie(token: str) -> dict:
    from app.auth.sessions import DEVICE_COOKIE, _sign
    return {DEVICE_COOKIE: _sign(token)}
