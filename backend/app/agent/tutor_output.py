"""Structured tutor output — message type for the kid UI.

The tutor answers with a small JSON object::

    {"type": "question|hint|example|success|explanation", "hint_level": 1|2|3|null,
     "text": "..."}

``type`` lets the frontend highlight questions, progressive hints, analogous
examples and success moments. Parsing is deliberately forgiving: any failure
falls back to a plain message (``kind=None``) so the child always gets an
answer, and raw JSON is never shown to the child.
"""

from __future__ import annotations

import json
import re
from typing import Literal

from pydantic import BaseModel, Field, ValidationError, field_validator

TutorKind = Literal["question", "hint", "example", "success", "explanation"]
TUTOR_KINDS: tuple[str, ...] = ("question", "hint", "example", "success", "explanation")
#: kinds stored on messages (tutor kinds + predefined safety response)
MESSAGE_KINDS: tuple[str, ...] = (*TUTOR_KINDS, "safety")

MAX_TEXT_CHARS = 4000


class TutorReply(BaseModel):
    """Validated tutor reply. ``kind`` is None when the type is unknown."""

    kind: TutorKind | None = None
    hint_level: int | None = Field(default=None, ge=1, le=3)
    text: str = Field(min_length=1, max_length=MAX_TEXT_CHARS)

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("empty text")
        return v

    def model_post_init(self, __context: object) -> None:
        # A hint level only makes sense on a hint.
        if self.kind != "hint":
            self.hint_level = None


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)
_TEXT_FIELD_RE = re.compile(r'"text"\s*:\s*"((?:[^"\\]|\\.)*)"', re.DOTALL)


def _strip_fences(raw: str) -> str:
    return _FENCE_RE.sub("", raw.strip()).strip()


def parse_tutor_output(raw: str) -> TutorReply | None:
    """Parse the tutor's raw output.

    Returns ``None`` only when the output looks like JSON but no text can be
    recovered (the caller then uses a predefined fallback). Plain text is
    accepted as an untyped message.
    """
    content = _strip_fences(raw or "")
    if not content:
        return None

    if not content.startswith("{"):
        # Model ignored the JSON format: show the text as a plain message.
        try:
            return TutorReply(text=content[:MAX_TEXT_CHARS])
        except ValidationError:
            return None

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        data = None

    if isinstance(data, dict):
        text = data.get("text")
        if not isinstance(text, str) or not text.strip():
            return None
        kind = data.get("type")
        if kind not in TUTOR_KINDS:
            kind = None
        level = data.get("hint_level")
        if not isinstance(level, int) or isinstance(level, bool) or not 1 <= level <= 3:
            level = None
        try:
            return TutorReply(kind=kind, hint_level=level, text=text[:MAX_TEXT_CHARS])
        except ValidationError:
            return None

    # Broken JSON: try to salvage the "text" field, never show raw JSON.
    m = _TEXT_FIELD_RE.search(content)
    if not m:
        return None
    try:
        text = json.loads(f'"{m.group(1)}"')
    except json.JSONDecodeError:
        return None
    try:
        return TutorReply(text=text[:MAX_TEXT_CHARS])
    except ValidationError:
        return None
