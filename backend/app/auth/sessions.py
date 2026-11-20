"""Server-side session management with signed cookies."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from fastapi import Request, Response
from itsdangerous import BadSignature, URLSafeTimedSerializer
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import SessionRecord

settings = get_settings()
_signer = URLSafeTimedSerializer(settings.session_secret)

ADMIN_COOKIE = "lumio_admin"
KID_COOKIE = "lumio_kid"
DEVICE_COOKIE = "lumio_device"
CSRF_COOKIE = "lumio_csrf"

_COOKIE_DEFAULTS = {
    "httponly": True,
    "secure": True,
    "samesite": "strict",
    "path": "/",
}


def _generate_session_id() -> str:
    return secrets.token_urlsafe(48)


def _sign(value: str) -> str:
    return _signer.dumps(value)


def _unsign(signed: str, max_age: int | None = None) -> str | None:
    try:
        return _signer.loads(signed, max_age=max_age)
    except BadSignature:
        return None


# ---------------------------------------------------------------------------
# CSRF
# ---------------------------------------------------------------------------
def set_csrf_cookie(response: Response) -> str:
    token = secrets.token_urlsafe(32)
    response.set_cookie(
        CSRF_COOKIE,
        token,
        max_age=settings.admin_session_max_age,
        secure=True,
        samesite="strict",
        httponly=False,  # JS needs to read this
        path="/",
    )
    return token


def verify_origin(request: Request) -> bool:
    """Reject requests whose Origin header doesn't match PUBLIC_URL."""
    origin = request.headers.get("origin")
    if not origin:
        return True  # no Origin header (e.g. same-origin, non-browser)
    allowed = settings.public_url.rstrip("/")
    return origin.rstrip("/") == allowed


def verify_csrf_token(request: Request) -> bool:
    """Verify CSRF double-submit cookie vs header."""
    cookie_token = request.cookies.get(CSRF_COOKIE)
    header_token = request.headers.get("x-csrf-token")
    if not cookie_token or not header_token:
        return False
    return secrets.compare_digest(cookie_token, header_token)


# ---------------------------------------------------------------------------
# Session CRUD
# ---------------------------------------------------------------------------
async def create_session(
    db: AsyncSession,
    response: Response,
    *,
    cookie_name: str,
    data: dict,
    max_age: int,
) -> str:
    session_id = _generate_session_id()
    now = datetime.utcnow()
    record = SessionRecord(
        id=session_id,
        data=data,
        created_at=now,
        expires_at=now + timedelta(seconds=max_age),
        last_activity=now,
    )
    db.add(record)
    await db.flush()

    signed = _sign(session_id)
    response.set_cookie(cookie_name, signed, max_age=max_age, **_COOKIE_DEFAULTS)
    set_csrf_cookie(response)
    return session_id


async def get_session(
    db: AsyncSession, request: Request, *, cookie_name: str, max_age: int
) -> dict | None:
    signed = request.cookies.get(cookie_name)
    if not signed:
        return None
    session_id = _unsign(signed, max_age=max_age)
    if not session_id:
        return None

    result = await db.execute(select(SessionRecord).where(SessionRecord.id == session_id))
    record = result.scalar_one_or_none()
    if not record:
        return None

    now = datetime.utcnow()
    if record.expires_at < now:
        await db.execute(delete(SessionRecord).where(SessionRecord.id == session_id))
        return None

    # Inactivity check for kid sessions
    if cookie_name == KID_COOKIE:
        inactivity = (now - record.last_activity).total_seconds()
        if inactivity > settings.kid_session_inactivity:
            await db.execute(delete(SessionRecord).where(SessionRecord.id == session_id))
            return None

    # Update last activity
    record.last_activity = now
    return record.data


async def destroy_session(
    db: AsyncSession, request: Request, response: Response, *, cookie_name: str
) -> None:
    signed = request.cookies.get(cookie_name)
    if signed:
        session_id = _unsign(signed)
        if session_id:
            await db.execute(delete(SessionRecord).where(SessionRecord.id == session_id))
    response.delete_cookie(cookie_name, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")


# ---------------------------------------------------------------------------
# Device token
# ---------------------------------------------------------------------------
def generate_device_token() -> str:
    return secrets.token_urlsafe(32)


def set_device_cookie(response: Response, token: str) -> None:
    signed = _sign(token)
    response.set_cookie(
        DEVICE_COOKIE,
        signed,
        max_age=settings.device_cookie_max_age,
        **_COOKIE_DEFAULTS,
    )


def get_device_token(request: Request) -> str | None:
    signed = request.cookies.get(DEVICE_COOKIE)
    if not signed:
        return None
    return _unsign(signed, max_age=settings.device_cookie_max_age)


# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
async def cleanup_expired_sessions(db: AsyncSession) -> int:
    result = await db.execute(
        delete(SessionRecord).where(SessionRecord.expires_at < datetime.utcnow())
    )
    return result.rowcount or 0
