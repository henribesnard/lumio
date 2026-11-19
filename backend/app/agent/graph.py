"""LangGraph agent — tutoring conversation graph."""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Any, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_mistralai import ChatMistralAI

from app.agent.moderation import (
    get_safe_response,
    run_input_guard,
    run_output_guard,
)
from app.agent.prompts.builder import build_system_prompt, get_age_bracket
from app.config import get_settings
from app.db.models import LearnerNotes, Message, Profile

logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------
class AgentState(TypedDict, total=False):
    profile: dict
    messages: list[dict]
    child_message: str
    input_flags: dict
    draft: str
    output_verdict: dict
    rewrite_count: int
    safety_events: list[dict]
    final_response: str
    system_prompt: str
    learner_notes: list[dict]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_tutor_llm(model_override: str | None = None) -> ChatMistralAI:
    model = model_override or settings.mistral_tutor_model
    return ChatMistralAI(
        model=model,
        api_key=settings.mistral_api_key,
        temperature=settings.tutor_temperature,
        timeout=settings.mistral_timeout,
    )


def _build_chat_messages(
    system_prompt: str,
    history: list[Message],
    child_message: str,
    summary_threshold: int = 20,
) -> list:
    """Build LangChain message list from history."""
    msgs = [SystemMessage(content=system_prompt)]

    # If history is long, summarize older messages
    history_messages = []
    for m in history:
        if m.role == "child":
            history_messages.append(HumanMessage(content=m.contenu))
        elif m.role == "assistant":
            history_messages.append(AIMessage(content=m.contenu))
        # Skip system_notice

    # Keep last N messages if too long
    if len(history_messages) > summary_threshold:
        history_messages = history_messages[-summary_threshold:]

    msgs.extend(history_messages)
    msgs.append(HumanMessage(content=child_message))
    return msgs


# ---------------------------------------------------------------------------
# Main agent runner (streaming)
# ---------------------------------------------------------------------------
async def run_agent(
    *,
    profile: Profile,
    conversation_id: str,
    child_message: str,
    history: list[Message],
    learner_notes: list[LearnerNotes],
    child_msg_count: int,
) -> AsyncGenerator[dict[str, Any], None]:
    """Run the full agent pipeline and yield SSE events."""

    age_bracket = get_age_bracket(profile.age)
    safety_events: list[dict] = []
    total_tokens_in = 0
    total_tokens_out = 0

    # -----------------------------------------------------------------------
    # 1. Input guard
    # -----------------------------------------------------------------------
    try:
        input_verdict = await run_input_guard(
            message=child_message,
            age=profile.age,
            niveau=profile.niveau,
            sujets_interdits=profile.sujets_interdits or [],
        )
    except Exception as e:
        logger.error("Input guard failed: %s", e)
        input_verdict = {"distress": "none", "reason": "guard_error"}

    # -----------------------------------------------------------------------
    # 2. Router
    # -----------------------------------------------------------------------
    # Critical cases → safe response
    is_critical = (
        input_verdict.get("distress") == "high"
        or input_verdict.get("self_harm")
        or input_verdict.get("abuse_disclosure")
    )

    if is_critical:
        event_type = "distress"
        if input_verdict.get("self_harm"):
            event_type = "self_harm"
        elif input_verdict.get("abuse_disclosure"):
            event_type = "abuse_disclosure"

        safe_text = get_safe_response(event_type, age_bracket)
        safety_events.append({
            "type": event_type,
            "severity": "critical",
            "extrait": child_message[:200],
        })

        # Stream safe response
        for word in safe_text.split():
            yield {"type": "token", "data": {"text": word + " "}}
            await asyncio.sleep(0.03)

        yield {
            "type": "done",
            "data": {
                "full_text": safe_text,
                "safety_events": safety_events,
                "tokens_in": 0,
                "tokens_out": 0,
                "input_verdict": input_verdict,
            },
        }
        return

    # Blocked content
    is_blocked = (
        input_verdict.get("inappropriate_request")
        or input_verdict.get("jailbreak_attempt")
    )
    is_forbidden = input_verdict.get("forbidden_topic")

    if is_blocked:
        event_type = "inappropriate_content"
        if input_verdict.get("jailbreak_attempt"):
            event_type = "jailbreak_attempt"
            safety_events.append({
                "type": "jailbreak_attempt",
                "severity": "warning",
                "extrait": child_message[:200],
            })

        safe_text = get_safe_response("inappropriate_content", age_bracket)

        for word in safe_text.split():
            yield {"type": "token", "data": {"text": word + " "}}
            await asyncio.sleep(0.03)

        yield {
            "type": "done",
            "data": {
                "full_text": safe_text,
                "safety_events": safety_events,
                "tokens_in": 0,
                "tokens_out": 0,
                "input_verdict": input_verdict,
            },
        }
        return

    if is_forbidden:
        safe_text = get_safe_response("forbidden_topic", age_bracket)
        safety_events.append({
            "type": "forbidden_topic",
            "severity": "info",
            "extrait": child_message[:200],
        })

        for word in safe_text.split():
            yield {"type": "token", "data": {"text": word + " "}}
            await asyncio.sleep(0.03)

        yield {
            "type": "done",
            "data": {
                "full_text": safe_text,
                "safety_events": safety_events,
                "tokens_in": 0,
                "tokens_out": 0,
                "input_verdict": input_verdict,
            },
        }
        return

    # Personal info shared — log but continue
    if input_verdict.get("personal_info_shared"):
        safety_events.append({
            "type": "personal_info_shared",
            "severity": "warning",
            "extrait": child_message[:200],
        })

    # -----------------------------------------------------------------------
    # 3. Context assembly
    # -----------------------------------------------------------------------
    system_prompt = build_system_prompt(profile, learner_notes)

    # Add homework_dump hint to context if detected
    if input_verdict.get("homework_dump"):
        system_prompt += (
            "\n\n[NOTE INTERNE : L'enfant semble coller un exercice entier. "
            "Guide-le étape par étape sans faire l'exercice à sa place.]"
        )

    chat_messages = _build_chat_messages(
        system_prompt, history, child_message, settings.summary_threshold
    )

    # -----------------------------------------------------------------------
    # 4. Tutor call
    # -----------------------------------------------------------------------
    model_override = profile.modele
    llm = _get_tutor_llm(model_override)
    rewrite_count = 0
    max_rewrites = settings.max_rewrite_count

    for attempt in range(1 + max_rewrites):
        try:
            response = await llm.ainvoke(chat_messages)
            draft = response.content
            token_usage = getattr(response, "usage_metadata", None) or {}
            total_tokens_in += token_usage.get("input_tokens", 0)
            total_tokens_out += token_usage.get("output_tokens", 0)
        except Exception as e:
            logger.error("Tutor LLM failed (attempt %d): %s", attempt + 1, e)
            if attempt == 0:
                # Retry once
                await asyncio.sleep(1)
                continue
            # Final fallback
            safe_text = get_safe_response("technical_error", age_bracket)
            for word in safe_text.split():
                yield {"type": "token", "data": {"text": word + " "}}
                await asyncio.sleep(0.03)

            yield {
                "type": "done",
                "data": {
                    "full_text": safe_text,
                    "safety_events": safety_events,
                    "tokens_in": total_tokens_in,
                    "tokens_out": total_tokens_out,
                    "input_verdict": input_verdict,
                },
            }
            return

        # -------------------------------------------------------------------
        # 5. Output guard
        # -------------------------------------------------------------------
        try:
            output_verdict = await run_output_guard(
                draft=draft,
                child_message=child_message,
                age=profile.age,
                niveau=profile.niveau,
            )
        except Exception as e:
            logger.error("Output guard failed: %s", e)
            output_verdict = {"status": "ok"}

        status = output_verdict.get("status", "ok")

        if status == "ok":
            break
        elif status == "rewrite" and rewrite_count < max_rewrites:
            rewrite_count += 1
            critique = output_verdict.get("critique", "")
            chat_messages.append(AIMessage(content=draft))
            chat_messages.append(
                HumanMessage(
                    content=f"[CONSIGNE INTERNE : Réécris ta réponse. Problème : {critique}. "
                    f"Rappel : ne donne pas la réponse directement, guide l'enfant.]"
                )
            )
            continue
        else:
            # Block → fallback
            safe_text = get_safe_response("technical_error", age_bracket)
            for word in safe_text.split():
                yield {"type": "token", "data": {"text": word + " "}}
                await asyncio.sleep(0.03)

            yield {
                "type": "done",
                "data": {
                    "full_text": safe_text,
                    "safety_events": safety_events,
                    "tokens_in": total_tokens_in,
                    "tokens_out": total_tokens_out,
                    "input_verdict": input_verdict,
                    "output_verdict": output_verdict,
                },
            }
            return

    # -----------------------------------------------------------------------
    # 6. Stream the validated response
    # -----------------------------------------------------------------------
    words = draft.split()
    for word in words:
        yield {"type": "token", "data": {"text": word + " "}}
        await asyncio.sleep(0.02)

    yield {
        "type": "done",
        "data": {
            "full_text": draft,
            "safety_events": safety_events,
            "tokens_in": total_tokens_in,
            "tokens_out": total_tokens_out,
            "input_verdict": input_verdict,
            "output_verdict": output_verdict if 'output_verdict' in dir() else {},
            "model": model_override or settings.mistral_tutor_model,
        },
    }

    # -----------------------------------------------------------------------
    # 7. Learner notes (async, every N messages)
    # -----------------------------------------------------------------------
    if child_msg_count > 0 and child_msg_count % settings.learner_notes_interval == 0:
        # Fire and forget — don't block the response
        asyncio.create_task(_update_learner_notes(profile, history, learner_notes))


async def _update_learner_notes(
    profile: Profile,
    history: list[Message],
    existing_notes: list[LearnerNotes],
) -> None:
    """Update learner notes asynchronously."""
    from pathlib import Path

    try:
        template = (Path(__file__).parent / "prompts" / "learner_notes.md").read_text(
            encoding="utf-8"
        )

        # Build exchanges text from last 20 messages
        recent = history[-20:] if len(history) > 20 else history
        exchanges = "\n".join(
            f"{'Enfant' if m.role == 'child' else 'Tuteur'}: {m.contenu}"
            for m in recent
        )

        existing_text = "\n".join(
            f"- {n.matiere}: {n.notes}" for n in existing_notes
        ) or "Aucune note existante."

        prompt = template.format(
            prenom=profile.prenom,
            age=profile.age,
            niveau=profile.niveau,
            exchanges=exchanges,
            existing_notes=existing_text,
        )

        llm = ChatMistralAI(
            model=settings.mistral_guard_model,
            api_key=settings.mistral_api_key,
            temperature=0,
            max_tokens=500,
        )
        response = await llm.ainvoke(prompt)
        content = response.content.strip()

        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        notes_data = json.loads(content)

        # Save to DB
        from app.db.session import async_session
        from app.db.models import LearnerNotes as LN
        from sqlalchemy import delete

        async with async_session() as db:
            await db.execute(delete(LN).where(LN.profile_id == profile.id))
            for item in notes_data:
                note = LN(
                    profile_id=profile.id,
                    matiere=item["matiere"],
                    notes=item["notes"][:500],
                )
                db.add(note)
            await db.commit()

    except Exception as e:
        logger.error("Learner notes update failed: %s", e)
