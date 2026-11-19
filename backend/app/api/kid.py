"""Kid API routes."""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    ConversationCreate,
    ConversationResponse,
    KidMeResponse,
    MessageCreate,
    MessageResponseKid,
    ProfilePublic,
)
from app.auth.dependencies import require_kid, require_trusted_device
from app.config import get_settings
from app.db import get_db
from app.db.models import (
    Conversation,
    LearnerNotes,
    Message,
    Profile,
    TrustedDevice,
    UsageDaily,
)
from app.services.quota import check_quota_and_schedule, get_remaining_quota, is_within_time_window

router = APIRouter(prefix="/api/kid", tags=["kid"])
settings = get_settings()


@router.get("/profiles", response_model=list[ProfilePublic])
async def list_kid_profiles(
    device: TrustedDevice = Depends(require_trusted_device),
    db: AsyncSession = Depends(get_db),
) -> list[Profile]:
    """List active profiles for the kid selection screen. Requires trusted device."""
    result = await db.execute(
        select(Profile).where(Profile.actif.is_(True)).order_by(Profile.prenom)
    )
    return list(result.scalars().all())


@router.get("/me", response_model=KidMeResponse)
async def kid_me(
    profile: Profile = Depends(require_kid),
    db: AsyncSession = Depends(get_db),
) -> KidMeResponse:
    msg_remaining, tok_remaining = await get_remaining_quota(db, profile)
    return KidMeResponse(
        prenom=profile.prenom,
        avatar=profile.avatar,
        age=profile.age,
        quota_messages_restant=msg_remaining,
        quota_tokens_restant=tok_remaining,
        hors_plage_horaire=not is_within_time_window(profile),
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    profile: Profile = Depends(require_kid),
    db: AsyncSession = Depends(get_db),
) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.profile_id == profile.id,
            Conversation.archived.is_(False),
        )
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    body: ConversationCreate,
    profile: Profile = Depends(require_kid),
    db: AsyncSession = Depends(get_db),
) -> Conversation:
    conv = Conversation(
        profile_id=profile.id,
        titre=body.titre or "Nouvelle conversation",
    )
    db.add(conv)
    await db.flush()
    return conv


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponseKid])
async def get_messages(
    conversation_id: uuid.UUID,
    profile: Profile = Depends(require_kid),
    db: AsyncSession = Depends(get_db),
) -> list[Message]:
    # Verify ownership
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.profile_id == profile.id,
        )
    )
    if not conv_result.scalar_one_or_none():
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Conversation introuvable."}},
        )

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    return list(result.scalars().all())


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    body: MessageCreate,
    request: Request,
    profile: Profile = Depends(require_kid),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Send a message and get SSE streamed response."""

    # Verify ownership
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.profile_id == profile.id,
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Conversation introuvable."}},
        )

    # Check quota and schedule
    error_msg = await check_quota_and_schedule(db, profile)
    if error_msg:
        async def quota_stream():
            yield f"event: notice\ndata: {json.dumps({'message': error_msg})}\n\n"
            yield f"event: done\ndata: {json.dumps({'message_id': None})}\n\n"
        return StreamingResponse(
            quota_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    # Save child message
    child_msg = Message(
        conversation_id=conversation_id,
        role="child",
        contenu=body.contenu,
    )
    db.add(child_msg)
    await db.flush()

    # Get learner notes for the profile
    notes_result = await db.execute(
        select(LearnerNotes).where(LearnerNotes.profile_id == profile.id)
    )
    learner_notes = list(notes_result.scalars().all())

    # Count child messages in this conversation for learner notes trigger
    msg_count_result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.role == "child",
        )
    )
    child_msg_count = len(list(msg_count_result.scalars().all()))

    # Get conversation history
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    history = list(history_result.scalars().all())

    # Commit child message before streaming
    await db.commit()

    # Capture data needed in the closure
    profile_id = profile.id
    profile_age = profile.age
    profile_niveau = profile.niveau
    profile_sujets = profile.sujets_interdits
    profile_modele = profile.modele
    profile_prenom = profile.prenom
    child_contenu = body.contenu

    async def sse_stream():
        from app.db.session import async_session as db_factory

        try:
            from app.agent.graph import run_agent

            done_data = None
            async for event in run_agent(
                profile=profile,
                conversation_id=str(conversation_id),
                child_message=child_contenu,
                history=history,
                learner_notes=learner_notes,
                child_msg_count=child_msg_count,
            ):
                event_type = event.get("type", "token")
                event_data = event.get("data", {})

                if event_type == "done":
                    done_data = event_data

                yield f"event: {event_type}\ndata: {json.dumps(event_data, ensure_ascii=False)}\n\n"

            # Persist assistant message and safety events after streaming
            if done_data:
                async with db_factory() as post_db:
                    full_text = done_data.get("full_text", "")
                    assistant_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        contenu=full_text,
                        tokens_in=done_data.get("tokens_in", 0),
                        tokens_out=done_data.get("tokens_out", 0),
                        modele=done_data.get("model"),
                        moderation=done_data.get("input_verdict"),
                        guard_verdict=done_data.get("output_verdict"),
                    )
                    post_db.add(assistant_msg)
                    await post_db.flush()

                    # Create safety events
                    from app.services.safety import create_safety_event
                    for se in done_data.get("safety_events", []):
                        await create_safety_event(
                            post_db,
                            type=se["type"],
                            severity=se["severity"],
                            profile_id=profile_id,
                            conversation_id=conversation_id,
                            message_id=assistant_msg.id,
                            extrait=se.get("extrait"),
                        )

                    # Increment usage
                    from app.services.quota import increment_usage
                    await increment_usage(
                        post_db,
                        profile_id,
                        tokens_in=done_data.get("tokens_in", 0),
                        tokens_out=done_data.get("tokens_out", 0),
                    )

                    await post_db.commit()

        except Exception:
            error_data = {"message": "Oups, j'ai eu un petit problème. Réessaie dans un instant !"}
            yield f"event: error\ndata: {json.dumps(error_data)}\n\n"
            yield f"event: done\ndata: {json.dumps({'message_id': None})}\n\n"

    return StreamingResponse(
        sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
