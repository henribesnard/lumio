"""FastAPI dependencies for authentication and authorization."""

from __future__ import annotations

import hashlib
from datetime import datetime

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.sessions import (
    ADMIN_COOKIE,
    KID_COOKIE,
    get_device_token,
    get_session,
)
from app.config import get_settings
from app.db import get_db
from app.db.models import Admin, Profile, TrustedDevice

settings = get_settings()


def get_real_ip(request: Request) -> str:
    """Get real client IP, trusting X-Real-IP only from local proxy."""
    client_host = request.client.host if request.client else "127.0.0.1"
    if client_host in ("127.0.0.1", "::1"):
        return request.headers.get("x-real-ip", client_host)
    return client_host


async def require_admin(request: Request, db: AsyncSession = Depends(get_db)) -> Admin:
    """Require a valid admin session."""
    data = await get_session(
        db, request, cookie_name=ADMIN_COOKIE, max_age=settings.admin_session_max_age
    )
    if not data or "admin_id" not in data:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "not_authenticated", "message": "Connexion requise."}},
        )
    result = await db.execute(select(Admin).where(Admin.id == data["admin_id"]))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "not_authenticated", "message": "Connexion requise."}},
        )
    return admin


async def require_kid(request: Request, db: AsyncSession = Depends(get_db)) -> Profile:
    """Require a valid kid session."""
    data = await get_session(
        db, request, cookie_name=KID_COOKIE, max_age=settings.kid_session_inactivity
    )
    if not data or "profile_id" not in data:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "not_authenticated", "message": "Tu dois te connecter."}},
        )
    result = await db.execute(select(Profile).where(Profile.id == data["profile_id"]))
    profile = result.scalar_one_or_none()
    if not profile or not profile.actif:
        raise HTTPException(
            status_code=401,
            detail={
                "error": {"code": "profile_inactive", "message": "Ce profil n'est plus actif."}
            },
        )
    return profile


async def require_trusted_device(
    request: Request, db: AsyncSession = Depends(get_db)
) -> TrustedDevice:
    """Require a valid trusted device cookie."""
    token = get_device_token(request)
    if not token:
        raise HTTPException(
            status_code=403,
            detail={
                "error": {
                    "code": "untrusted_device",
                    "message": "Cet appareil n'est pas reconnu comme appareil familial.",
                }
            },
        )
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    result = await db.execute(
        select(TrustedDevice).where(
            TrustedDevice.token_hash == token_hash,
            TrustedDevice.revoked_at.is_(None),
            TrustedDevice.expires_at > datetime.utcnow(),
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(
            status_code=403,
            detail={
                "error": {
                    "code": "untrusted_device",
                    "message": "Cet appareil n'est pas reconnu comme appareil familial.",
                }
            },
        )
    device.last_seen_at = datetime.utcnow()
    return device
