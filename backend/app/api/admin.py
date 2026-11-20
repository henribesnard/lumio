"""Admin API routes."""

from __future__ import annotations

import hashlib
import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    ConversationResponse,
    DeviceCreate,
    DeviceResponse,
    LearnerNotesResponse,
    LearnerNotesUpdate,
    MessageResponse,
    PinUpdate,
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    SafetyEventResponse,
    StatsResponse,
)
from app.auth.dependencies import get_real_ip, require_admin
from app.auth.passwords import hash_pin, is_trivial_pin
from app.auth.sessions import generate_device_token
from app.config import get_settings
from app.db import get_db
from app.db.models import (
    Admin,
    Conversation,
    LearnerNotes,
    Message,
    Profile,
    SafetyEvent,
    TrustedDevice,
    UsageDaily,
)
from app.services.audit import log_action

router = APIRouter(prefix="/api/admin", tags=["admin"])
settings = get_settings()


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------
@router.get("/profiles", response_model=list[ProfileResponse])
async def list_profiles(
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Profile]:
    result = await db.execute(select(Profile).order_by(Profile.prenom))
    return list(result.scalars().all())


@router.post("/profiles", response_model=ProfileResponse, status_code=201)
async def create_profile(
    body: ProfileCreate,
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    if is_trivial_pin(body.pin):
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "trivial_pin",
                    "message": "Ce code PIN est trop simple. Choisis un code moins évident.",
                }
            },
        )

    profile = Profile(
        prenom=body.prenom,
        age=body.age,
        niveau=body.niveau,
        avatar=body.avatar,
        pin_hash=hash_pin(body.pin),
        consignes_admin=body.consignes_admin,
        sujets_interdits=body.sujets_interdits,
        modele=body.modele,
        supports_visuels=body.supports_visuels,
        quota_messages_jour=body.quota_messages_jour,
        quota_tokens_jour=body.quota_tokens_jour,
        plages_horaires=body.plages_horaires,
    )
    db.add(profile)
    await db.flush()

    await log_action(
        db,
        admin_id=admin.id,
        action="create_profile",
        target_type="profile",
        target_id=profile.id,
        details={"prenom": body.prenom},
        ip_address=get_real_ip(request),
    )
    return profile


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: uuid.UUID,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Profil introuvable."}},
        )
    return profile


@router.patch("/profiles/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: uuid.UUID,
    body: ProfileUpdate,
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Profil introuvable."}},
        )

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    profile.updated_at = datetime.utcnow()

    await log_action(
        db,
        admin_id=admin.id,
        action="update_profile",
        target_type="profile",
        target_id=profile.id,
        details=update_data,
        ip_address=get_real_ip(request),
    )
    return profile


@router.delete("/profiles/{profile_id}", status_code=204)
async def delete_profile(
    profile_id: uuid.UUID,
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Profil introuvable."}},
        )

    await log_action(
        db,
        admin_id=admin.id,
        action="delete_profile",
        target_type="profile",
        target_id=profile.id,
        details={"prenom": profile.prenom},
        ip_address=get_real_ip(request),
    )
    await db.delete(profile)


@router.put("/profiles/{profile_id}/pin", status_code=204)
async def update_pin(
    profile_id: uuid.UUID,
    body: PinUpdate,
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    if is_trivial_pin(body.pin):
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "trivial_pin", "message": "Ce code PIN est trop simple."}},
        )

    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Profil introuvable."}},
        )

    profile.pin_hash = hash_pin(body.pin)
    profile.failed_pin_count = 0
    profile.locked_until = None

    await log_action(
        db,
        admin_id=admin.id,
        action="update_pin",
        target_type="profile",
        target_id=profile.id,
        ip_address=get_real_ip(request),
    )


@router.post("/profiles/{profile_id}/unlock", status_code=204)
async def unlock_profile(
    profile_id: uuid.UUID,
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Profil introuvable."}},
        )

    profile.failed_pin_count = 0
    profile.locked_until = None

    await log_action(
        db,
        admin_id=admin.id,
        action="unlock_profile",
        target_type="profile",
        target_id=profile.id,
        ip_address=get_real_ip(request),
    )


@router.get("/profiles/{profile_id}/prompt-preview")
async def prompt_preview(
    profile_id: uuid.UUID,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.agent.prompts.builder import build_system_prompt

    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Profil introuvable."}},
        )

    # Get learner notes
    notes_result = await db.execute(
        select(LearnerNotes).where(LearnerNotes.profile_id == profile.id)
    )
    notes = list(notes_result.scalars().all())

    prompt = build_system_prompt(profile, notes)
    return {"prompt": prompt}


# ---------------------------------------------------------------------------
# Learner Notes
# ---------------------------------------------------------------------------
@router.get("/profiles/{profile_id}/learner-notes", response_model=list[LearnerNotesResponse])
async def get_learner_notes(
    profile_id: uuid.UUID,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[LearnerNotes]:
    result = await db.execute(select(LearnerNotes).where(LearnerNotes.profile_id == profile_id))
    return list(result.scalars().all())


@router.put("/profiles/{profile_id}/learner-notes", response_model=list[LearnerNotesResponse])
async def update_learner_notes(
    profile_id: uuid.UUID,
    body: list[LearnerNotesUpdate],
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[LearnerNotes]:
    # Verify profile exists
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Profil introuvable."}},
        )

    # Delete existing notes and replace
    await db.execute(delete(LearnerNotes).where(LearnerNotes.profile_id == profile_id))
    new_notes = []
    for item in body:
        note = LearnerNotes(
            profile_id=profile_id,
            matiere=item.matiere,
            notes=item.notes,
        )
        db.add(note)
        new_notes.append(note)
    await db.flush()

    await log_action(
        db,
        admin_id=admin.id,
        action="update_learner_notes",
        target_type="profile",
        target_id=profile_id,
        ip_address=get_real_ip(request),
    )
    return new_notes


# ---------------------------------------------------------------------------
# Profile export (RGPD)
# ---------------------------------------------------------------------------
@router.get("/profiles/{profile_id}/export")
async def export_profile(
    profile_id: uuid.UUID,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Profil introuvable."}},
        )

    # Conversations + messages
    conv_result = await db.execute(
        select(Conversation).where(Conversation.profile_id == profile_id)
    )
    conversations = []
    for conv in conv_result.scalars().all():
        msg_result = await db.execute(
            select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
        )
        messages = [
            {"role": m.role, "contenu": m.contenu, "created_at": m.created_at.isoformat()}
            for m in msg_result.scalars().all()
        ]
        conversations.append(
            {
                "titre": conv.titre,
                "created_at": conv.created_at.isoformat(),
                "messages": messages,
            }
        )

    # Learner notes
    notes_result = await db.execute(
        select(LearnerNotes).where(LearnerNotes.profile_id == profile_id)
    )
    notes = [{"matiere": n.matiere, "notes": n.notes} for n in notes_result.scalars().all()]

    return {
        "prenom": profile.prenom,
        "age": profile.age,
        "niveau": profile.niveau,
        "conversations": conversations,
        "learner_notes": notes,
        "exported_at": datetime.utcnow().isoformat(),
    }


# ---------------------------------------------------------------------------
# Conversations (admin view)
# ---------------------------------------------------------------------------
@router.get("/profiles/{profile_id}/conversations", response_model=list[ConversationResponse])
async def list_profile_conversations(
    profile_id: uuid.UUID,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.profile_id == profile_id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_conversation_messages_admin(
    conversation_id: uuid.UUID,
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Message]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = list(result.scalars().all())

    # Log the access
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_result.scalar_one_or_none()
    if conv:
        await log_action(
            db,
            admin_id=admin.id,
            action="read_conversation",
            target_type="conversation",
            target_id=conversation_id,
            details={"profile_id": str(conv.profile_id)},
            ip_address=get_real_ip(request),
        )

    return messages


# ---------------------------------------------------------------------------
# Safety Events
# ---------------------------------------------------------------------------
@router.get("/safety-events", response_model=list[SafetyEventResponse])
async def list_safety_events(
    status: str | None = None,
    profile_id: uuid.UUID | None = None,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[SafetyEvent]:
    query = select(SafetyEvent).order_by(SafetyEvent.created_at.desc())
    if status == "pending":
        query = query.where(SafetyEvent.acknowledged_at.is_(None))
    elif status == "acknowledged":
        query = query.where(SafetyEvent.acknowledged_at.is_not(None))
    if profile_id:
        query = query.where(SafetyEvent.profile_id == profile_id)

    result = await db.execute(query.limit(100))
    return list(result.scalars().all())


@router.post("/safety-events/{event_id}/ack", status_code=204)
async def acknowledge_safety_event(
    event_id: uuid.UUID,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(SafetyEvent).where(SafetyEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Événement introuvable."}},
        )
    event.acknowledged_at = datetime.utcnow()


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    days: int = 7,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> StatsResponse:
    since = date.today() - timedelta(days=days)

    # Usage totals
    usage_result = await db.execute(
        select(
            func.coalesce(func.sum(UsageDaily.messages), 0),
            func.coalesce(func.sum(UsageDaily.tokens_in), 0),
            func.coalesce(func.sum(UsageDaily.tokens_out), 0),
        ).where(UsageDaily.date >= since)
    )
    row = usage_result.one()
    total_messages, total_tokens_in, total_tokens_out = row

    # Active profiles
    active_result = await db.execute(
        select(func.count(func.distinct(UsageDaily.profile_id))).where(UsageDaily.date >= since)
    )
    active_profiles = active_result.scalar() or 0

    # Safety events by severity
    events_result = await db.execute(
        select(SafetyEvent.severity, func.count())
        .where(SafetyEvent.created_at >= datetime.combine(since, datetime.min.time()))
        .group_by(SafetyEvent.severity)
    )
    safety_by_severity = {row[0]: row[1] for row in events_result.all()}

    # Usage by profile
    profile_usage_result = await db.execute(
        select(
            UsageDaily.profile_id,
            func.sum(UsageDaily.messages),
            func.sum(UsageDaily.tokens_in),
            func.sum(UsageDaily.tokens_out),
        )
        .where(UsageDaily.date >= since)
        .group_by(UsageDaily.profile_id)
    )
    usage_by_profile = []
    for row in profile_usage_result.all():
        p_result = await db.execute(select(Profile.prenom).where(Profile.id == row[0]))
        prenom = p_result.scalar() or "?"
        usage_by_profile.append(
            {
                "profile_id": str(row[0]),
                "prenom": prenom,
                "messages": row[1] or 0,
                "tokens_in": row[2] or 0,
                "tokens_out": row[3] or 0,
            }
        )

    return StatsResponse(
        period_days=days,
        total_messages=total_messages,
        total_tokens_in=total_tokens_in,
        total_tokens_out=total_tokens_out,
        active_profiles=active_profiles,
        safety_events_by_severity=safety_by_severity,
        usage_by_profile=usage_by_profile,
    )


# ---------------------------------------------------------------------------
# Devices
# ---------------------------------------------------------------------------
@router.get("/devices", response_model=list[DeviceResponse])
async def list_devices(
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[TrustedDevice]:
    result = await db.execute(
        select(TrustedDevice)
        .where(TrustedDevice.revoked_at.is_(None))
        .order_by(TrustedDevice.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/devices", response_model=DeviceResponse, status_code=201)
async def create_device(
    body: DeviceCreate,
    request: Request,
    response_obj: None = None,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TrustedDevice:
    token = generate_device_token()
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    device = TrustedDevice(
        label=body.label,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(seconds=settings.device_cookie_max_age),
    )
    db.add(device)
    await db.flush()

    await log_action(
        db,
        admin_id=admin.id,
        action="create_device",
        target_type="trusted_device",
        target_id=device.id,
        details={"label": body.label},
        ip_address=get_real_ip(request),
    )

    # We need to set the cookie on the response - store token in device for the middleware
    # The cookie will be set via a custom response
    device._token = token  # type: ignore[attr-defined]
    return device


@router.delete("/devices/{device_id}", status_code=204)
async def revoke_device(
    device_id: uuid.UUID,
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(TrustedDevice).where(TrustedDevice.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Appareil introuvable."}},
        )
    device.revoked_at = datetime.utcnow()

    await log_action(
        db,
        admin_id=admin.id,
        action="revoke_device",
        target_type="trusted_device",
        target_id=device.id,
        ip_address=get_real_ip(request),
    )


# ---------------------------------------------------------------------------
# TOTP Setup
# ---------------------------------------------------------------------------
@router.post("/totp/setup")
async def totp_setup(
    admin: Admin = Depends(require_admin),
) -> dict:
    import pyotp

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=admin.email, issuer_name="Lumio")
    return {"secret": secret, "uri": provisioning_uri}


@router.post("/totp/confirm", status_code=204)
async def totp_confirm(
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    import pyotp

    body = await request.json()
    secret = body.get("secret", "")
    code = body.get("code", "")

    if not secret or not code:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "missing_fields", "message": "Secret et code requis."}},
        )

    totp = pyotp.TOTP(secret)
    if not totp.verify(code):
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "invalid_totp", "message": "Code TOTP invalide."}},
        )

    admin.totp_secret = secret
    await log_action(
        db,
        admin_id=admin.id,
        action="enable_totp",
        ip_address=get_real_ip(request),
    )


@router.delete("/totp", status_code=204)
async def totp_disable(
    request: Request,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    admin.totp_secret = None
    await log_action(
        db,
        admin_id=admin.id,
        action="disable_totp",
        ip_address=get_real_ip(request),
    )


@router.get("/totp/status")
async def totp_status(
    admin: Admin = Depends(require_admin),
) -> dict:
    return {"enabled": admin.totp_secret is not None}
