"""Moderation utilities — Mistral moderation + regex rules."""

from __future__ import annotations

import json
import re
from pathlib import Path

import yaml
from langchain_mistralai import ChatMistralAI

from app.config import get_settings

settings = get_settings()

_PROMPT_DIR = Path(__file__).parent / "prompts"

# ---------------------------------------------------------------------------
# Personal info regex patterns
# ---------------------------------------------------------------------------
_PERSONAL_INFO_PATTERNS = [
    re.compile(r"\b\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b"),  # FR phone
    re.compile(r"\b0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b"),  # FR phone
    re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"),  # email
    re.compile(r"\b\d{1,3}\s+(rue|avenue|boulevard|impasse|chemin|allée|place)\b", re.I),  # address
    re.compile(r"\b(instagram|tiktok|snapchat|facebook|twitter|discord)\s*[:@]?\s*\w+", re.I),  # social
]


def detect_personal_info(text: str) -> bool:
    """Check if text contains personal information patterns."""
    return any(p.search(text) for p in _PERSONAL_INFO_PATTERNS)


# ---------------------------------------------------------------------------
# Safe responses loader
# ---------------------------------------------------------------------------
_safe_responses: dict | None = None


def get_safe_responses() -> dict:
    global _safe_responses
    if _safe_responses is None:
        with open(_PROMPT_DIR / "safe_responses.yaml", encoding="utf-8") as f:
            _safe_responses = yaml.safe_load(f)
    return _safe_responses


def get_safe_response(event_type: str, age_bracket: str) -> str:
    """Get a predefined safe response for a given event type and age bracket."""
    responses = get_safe_responses()
    messages = responses.get(event_type, {}).get(age_bracket, [])
    if not messages:
        # Fallback
        return "Je ne peux pas répondre à ça. Parlons d'autre chose !"
    return "\n".join(messages)


# ---------------------------------------------------------------------------
# LLM-based guard (input/output)
# ---------------------------------------------------------------------------
def _get_guard_llm() -> ChatMistralAI:
    return ChatMistralAI(
        model=settings.mistral_guard_model,
        api_key=settings.mistral_api_key,
        temperature=0,
        max_tokens=300,
        timeout=settings.mistral_timeout,
    )


async def run_input_guard(
    message: str,
    age: int,
    niveau: str,
    sujets_interdits: list[str],
) -> dict:
    """Run the input guard classifier. Returns parsed JSON verdict."""
    template = (_PROMPT_DIR / "input_guard.md").read_text(encoding="utf-8")
    prompt = template.format(
        message=message,
        age=age,
        niveau=niveau,
        sujets_interdits=", ".join(sujets_interdits) if sujets_interdits else "Aucun",
    )

    # Also check regex rules
    has_personal_info = detect_personal_info(message)

    # Check forbidden topics locally
    forbidden_hit = False
    if sujets_interdits:
        msg_lower = message.lower()
        for topic in sujets_interdits:
            if topic.lower() in msg_lower:
                forbidden_hit = True
                break

    try:
        llm = _get_guard_llm()
        response = await llm.ainvoke(prompt)
        content = response.content.strip()
        # Extract JSON from response
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        verdict = json.loads(content)
    except Exception:
        # If LLM fails, use conservative defaults
        verdict = {
            "distress": "none",
            "self_harm": False,
            "abuse_disclosure": False,
            "personal_info_shared": False,
            "jailbreak_attempt": False,
            "inappropriate_request": False,
            "forbidden_topic": False,
            "homework_dump": False,
            "reason": "guard_llm_error",
        }

    # Override with local checks
    if has_personal_info:
        verdict["personal_info_shared"] = True
    if forbidden_hit:
        verdict["forbidden_topic"] = True

    return verdict


async def run_output_guard(
    draft: str,
    child_message: str,
    age: int,
    niveau: str,
) -> dict:
    """Run the output guard on the tutor's draft response."""
    template = (_PROMPT_DIR / "output_guard.md").read_text(encoding="utf-8")
    prompt = template.format(
        draft=draft,
        child_message=child_message,
        age=age,
        niveau=niveau,
    )

    try:
        llm = _get_guard_llm()
        response = await llm.ainvoke(prompt)
        content = response.content.strip()
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        verdict = json.loads(content)
    except Exception:
        # Conservative: block if we can't verify
        verdict = {
            "status": "block",
            "gives_direct_answer": False,
            "age_appropriate": True,
            "asks_personal_info": False,
            "unsafe_content": False,
            "too_long": False,
            "critique": "output_guard_llm_error",
        }

    return verdict
