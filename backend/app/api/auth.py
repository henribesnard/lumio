"""Authentication routes."""

from __future__ import annotations

import hashlib
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    AdminLoginRequest,
    AuthMeResponse,
    KidLoginRequest,
)
from app.auth.dependencies import get_real_ip
from app.auth.passwords import verify_password, verify_pin
from app.auth.sessions import (
    ADMIN_COOKIE,
    KID_COOKIE,
    create_session,
    destroy_session,
    get_device_token,
    get_session,
)
from app.config import get_settings
from app.db import get_db
from app.db.models import Admin, Profile, TrustedDevice
from app.services.audit import log_action
from app.services.safety import create_safety_event

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

# In-memory rate limiter for PIN attempts per IP
_pin_ip_attempts: dict[str, list[float]] = {}


def _check_ip_rate_limit(ip: str) -> bool:
    """Return True if IP is within rate limit."""
    now = datetime.utcnow().timestamp()
    window = settings.ip_pin_rate_window
    attempts = _pin_ip_attempts.get(ip, [])
    # Clean old entries
    attempts = [t for t in attempts if now - t < window]
    _pin_ip_attempts[ip] = attempts
    return len(attempts) < settings.ip_pin_rate_limit


def _record_ip_attempt(ip: str) -> None:
    now = datetime.utcnow().timestamp()
    attempts = _pin_ip_attempts.get(ip, [])
    attempts.append(now)
    _pin_ip_attempts[ip] = attempts


@router.post("/admin/login")
async def admin_login(
    body: AdminLoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthMeResponse:
    result = await db.execute(select(Admin).where(Admin.email == body.email))
    admin = result.scalar_one_or_none()

    if not admin:
        raise HTTPException(
            status_code=401,
            detail={
                "error": {"code": "invalid_credentials", "message": "Identifiants incorrects."}
            },
        )

    # Check lockout
    if admin.locked_until and admin.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "code": "account_locked",
                    "message": "Compte temporairement verrouillé. Réessayez plus tard.",
                }
            },
        )

    if not verify_password(admin.password_hash, body.password):
        admin.failed_login_count += 1
        if admin.failed_login_count >= settings.admin_max_attempts:
            from datetime import timedelta

            admin.locked_until = datetime.utcnow() + timedelta(
                seconds=settings.admin_lockout_seconds
            )
        await db.commit()
        raise HTTPException(
            status_code=401,
            detail={
                "error": {"code": "invalid_credentials", "message": "Identifiants incorrects."}
            },
        )

    # Check TOTP if enabled
    if admin.totp_secret and body.totp_code:
        import pyotp

        totp = pyotp.TOTP(admin.totp_secret)
        if not totp.verify(body.totp_code):
            raise HTTPException(
                status_code=401,
                detail={"error": {"code": "invalid_totp", "message": "Code TOTP invalide."}},
            )
    elif admin.totp_secret and not body.totp_code:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "totp_required", "message": "Code TOTP requis."}},
        )

    # Success
    admin.failed_login_count = 0
    admin.locked_until = None
    admin.last_login_at = datetime.utcnow()

    await create_session(
        db,
        response,
        cookie_name=ADMIN_COOKIE,
        data={"admin_id": str(admin.id), "role": "admin"},
        max_age=settings.admin_session_max_age,
    )

    await log_action(
        db,
        admin_id=admin.id,
        action="login",
        ip_address=get_real_ip(request),
    )

    return AuthMeResponse(role="admin", admin_id=admin.id)


@router.post("/kid/login")
async def kid_login(
    body: KidLoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthMeResponse:
    ip = get_real_ip(request)

    # IP rate limit
    if not _check_ip_rate_limit(ip):
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "code": "rate_limited",
                    "message": "Trop de tentatives. Attends un peu avant de réessayer.",
                }
            },
        )

    # Verify trusted device
    device_token = get_device_token(request)
    if not device_token:
        raise HTTPException(
            status_code=403,
            detail={
                "error": {
                    "code": "untrusted_device",
                    "message": "Cet appareil n'est pas reconnu.",
                }
            },
        )
    token_hash = hashlib.sha256(device_token.encode()).hexdigest()
    dev_result = await db.execute(
        select(TrustedDevice).where(
            TrustedDevice.token_hash == token_hash,
            TrustedDevice.revoked_at.is_(None),
            TrustedDevice.expires_at > datetime.utcnow(),
        )
    )
    if not dev_result.scalar_one_or_none():
        raise HTTPException(
            status_code=403,
            detail={
                "error": {
                    "code": "untrusted_device",
                    "message": "Cet appareil n'est pas reconnu.",
                }
            },
        )

    # Find profile
    result = await db.execute(select(Profile).where(Profile.id == body.profile_id))
    profile = result.scalar_one_or_none()

    if not profile or not profile.actif:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "profile_not_found", "message": "Profil introuvable."}},
        )

    # Check lockout
    if profile.locked_until and profile.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "code": "profile_locked",
                    "message": "Ton profil est bloqué pour le moment. Demande à un parent.",
                }
            },
        )

    _record_ip_attempt(ip)

    if not verify_pin(profile.pin_hash, body.pin):
        profile.failed_pin_count += 1
        if profile.failed_pin_count >= settings.pin_max_attempts:
            from datetime import timedelta

            profile.locked_until = datetime.utcnow() + timedelta(
                seconds=settings.pin_lockout_seconds
            )
            await create_safety_event(
                db,
                event_type="pin_lockout",
                severity="warning",
                profile_id=profile.id,
                extrait=f"5 tentatives échouées depuis {ip}",
            )
        await db.commit()
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "invalid_pin", "message": "Code PIN incorrect."}},
        )

    # Success
    profile.failed_pin_count = 0
    profile.locked_until = None

    await create_session(
        db,
        response,
        cookie_name=KID_COOKIE,
        data={"profile_id": str(profile.id), "role": "kid"},
        max_age=settings.kid_session_inactivity,
    )

    return AuthMeResponse(role="kid", profile_id=profile.id, prenom=profile.prenom)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Try both session types
    await destroy_session(db, request, response, cookie_name=ADMIN_COOKIE)
    await destroy_session(db, request, response, cookie_name=KID_COOKIE)
    return {"status": "ok"}


@router.get("/me")
async def auth_me(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthMeResponse | None:
    # Check admin session first
    admin_data = await get_session(
        db, request, cookie_name=ADMIN_COOKIE, max_age=settings.admin_session_max_age
    )
    if admin_data and "admin_id" in admin_data:
        return AuthMeResponse(role="admin", admin_id=admin_data["admin_id"])

    # Check kid session
    kid_data = await get_session(
        db, request, cookie_name=KID_COOKIE, max_age=settings.kid_session_inactivity
    )
    if kid_data and "profile_id" in kid_data:
        result = await db.execute(select(Profile).where(Profile.id == kid_data["profile_id"]))
        profile = result.scalar_one_or_none()
        if profile:
            return AuthMeResponse(role="kid", profile_id=profile.id, prenom=profile.prenom)

    raise HTTPException(
        status_code=401,
        detail={"error": {"code": "not_authenticated", "message": "Non connecté."}},
    )
