"""Pydantic v2 schemas for all API endpoints."""

from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Error
# ---------------------------------------------------------------------------
class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class AdminLoginRequest(BaseModel):
    email: str
    password: str
    totp_code: str | None = None


class KidLoginRequest(BaseModel):
    profile_id: uuid.UUID
    pin: str = Field(min_length=4, max_length=4)


class AuthMeResponse(BaseModel):
    role: str  # "admin" or "kid"
    admin_id: uuid.UUID | None = None
    profile_id: uuid.UUID | None = None
    prenom: str | None = None


# ---------------------------------------------------------------------------
# Schedule (plages horaires)
# ---------------------------------------------------------------------------
JOURS = ("lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche")
MAX_SLOTS_PER_DAY = 4
_TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def validate_plages_horaires(value: dict | None) -> dict | None:
    """Validate and normalise ``plages_horaires``.

    Format: ``{"lundi": [{"debut": "16:30", "fin": "18:00"}], ...}``. ``None``
    means no restriction; once set, a day without slot is closed (see
    ``services/quota.py``). Rules: known French day names, ``HH:MM`` times,
    ``debut < fin``, at most 4 non-overlapping slots per day.
    """
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ValueError("Plages horaires invalides.")
    out: dict[str, list[dict[str, str]]] = {}
    for day, slots in value.items():
        if day not in JOURS:
            raise ValueError(f"Jour inconnu : {day}.")
        if not isinstance(slots, list):
            raise ValueError(f"{day} : liste de plages attendue.")
        if len(slots) > MAX_SLOTS_PER_DAY:
            raise ValueError(f"{day} : {MAX_SLOTS_PER_DAY} plages au maximum.")
        clean: list[dict[str, str]] = []
        for slot in slots:
            if not isinstance(slot, dict):
                raise ValueError(f"{day} : plage invalide.")
            debut, fin = slot.get("debut"), slot.get("fin")
            if not (
                isinstance(debut, str)
                and isinstance(fin, str)
                and _TIME_RE.match(debut)
                and _TIME_RE.match(fin)
            ):
                raise ValueError(f"{day} : heure invalide (format HH:MM).")
            if debut >= fin:
                raise ValueError(f"{day} : la fin doit être après le début.")
            clean.append({"debut": debut, "fin": fin})
        clean.sort(key=lambda s: s["debut"])
        for prev, cur in zip(clean, clean[1:], strict=False):
            if cur["debut"] < prev["fin"]:
                raise ValueError(f"{day} : deux plages se chevauchent.")
        out[day] = clean
    return out


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
class ProfileCreate(BaseModel):
    prenom: str = Field(min_length=1, max_length=50)
    age: int = Field(ge=6, le=14)
    niveau: str = Field(min_length=1, max_length=10)
    avatar: str = Field(default="avatar-01", max_length=30)
    pin: str = Field(min_length=4, max_length=4)
    consignes_admin: str | None = None
    sujets_interdits: list[str] = Field(default_factory=list)
    modele: str | None = None
    supports_visuels: bool = False
    quota_messages_jour: int = Field(default=50, ge=1, le=500)
    quota_tokens_jour: int = Field(default=50000, ge=1000, le=500000)
    plages_horaires: dict | None = None

    @field_validator("pin")
    @classmethod
    def pin_must_be_digits(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Le PIN doit contenir 4 chiffres.")
        return v

    @field_validator("plages_horaires")
    @classmethod
    def check_plages(cls, v: dict | None) -> dict | None:
        return validate_plages_horaires(v)


class ProfileUpdate(BaseModel):
    prenom: str | None = Field(default=None, min_length=1, max_length=50)
    age: int | None = Field(default=None, ge=6, le=14)
    niveau: str | None = Field(default=None, min_length=1, max_length=10)
    avatar: str | None = Field(default=None, max_length=30)
    consignes_admin: str | None = None
    sujets_interdits: list[str] | None = None
    modele: str | None = None
    supports_visuels: bool | None = None
    quota_messages_jour: int | None = Field(default=None, ge=1, le=500)
    quota_tokens_jour: int | None = Field(default=None, ge=1000, le=500000)
    plages_horaires: dict | None = None
    actif: bool | None = None

    @field_validator("plages_horaires")
    @classmethod
    def check_plages(cls, v: dict | None) -> dict | None:
        return validate_plages_horaires(v)


class ProfileResponse(BaseModel):
    id: uuid.UUID
    prenom: str
    age: int
    niveau: str
    avatar: str
    consignes_admin: str | None
    sujets_interdits: list[str]
    modele: str | None
    supports_visuels: bool = False
    quota_messages_jour: int
    quota_tokens_jour: int
    plages_horaires: dict | None
    actif: bool
    failed_pin_count: int
    locked_until: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfilePublic(BaseModel):
    """Minimal profile info for kid selection screen."""

    id: uuid.UUID
    prenom: str
    avatar: str
    actif: bool
    locked: bool = False
    hors_plage_horaire: bool = False

    model_config = {"from_attributes": True}


class PinUpdate(BaseModel):
    pin: str = Field(min_length=4, max_length=4)

    @field_validator("pin")
    @classmethod
    def pin_must_be_digits(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Le PIN doit contenir 4 chiffres.")
        return v


# ---------------------------------------------------------------------------
# Learner Notes
# ---------------------------------------------------------------------------
class LearnerNotesResponse(BaseModel):
    id: uuid.UUID
    matiere: str
    notes: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class LearnerNotesUpdate(BaseModel):
    matiere: str = Field(min_length=1, max_length=50)
    notes: str = Field(min_length=1, max_length=500)


# ---------------------------------------------------------------------------
# Conversation
# ---------------------------------------------------------------------------
class ConversationCreate(BaseModel):
    titre: str | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID
    titre: str
    archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------
class MessageCreate(BaseModel):
    contenu: str = Field(min_length=1, max_length=1000)


MessageKind = Literal["question", "hint", "example", "success", "explanation", "safety"]


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    contenu: str
    kind: MessageKind | None = None
    hint_level: int | None = None
    visual: dict | None = None
    tokens_in: int
    tokens_out: int
    modele: str | None
    moderation: dict | None = None
    guard_verdict: dict | None = None
    moderation_summary: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @staticmethod
    def _summarize_verdict(verdict: dict | None, label: str) -> str | None:
        if not verdict:
            return None
        action = verdict.get("action", "unknown")
        if action == "allow":
            return None
        categories = verdict.get("categories", [])
        if categories:
            return f"{label}: {action} ({', '.join(categories)})"
        return f"{label}: {action}"

    def model_post_init(self, __context: object) -> None:
        if self.moderation_summary is None:
            parts = []
            s = self._summarize_verdict(self.moderation, "Entrée")
            if s:
                parts.append(s)
            s = self._summarize_verdict(self.guard_verdict, "Sortie")
            if s:
                parts.append(s)
            if parts:
                self.moderation_summary = " | ".join(parts)


class MessageResponseKid(BaseModel):
    """Message response for kids — no moderation/guard details."""

    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    contenu: str
    kind: MessageKind | None = None
    hint_level: int | None = None
    visual: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Safety Event
# ---------------------------------------------------------------------------
class SafetyEventResponse(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID | None
    conversation_id: uuid.UUID | None
    message_id: uuid.UUID | None
    type: str
    severity: str
    extrait: str | None
    acknowledged_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
class StatsResponse(BaseModel):
    period_days: int
    total_messages: int
    total_tokens_in: int
    total_tokens_out: int
    active_profiles: int
    safety_events_by_severity: dict[str, int]
    usage_by_profile: list[dict]


# ---------------------------------------------------------------------------
# Device
# ---------------------------------------------------------------------------
class DeviceCreate(BaseModel):
    label: str = Field(min_length=1, max_length=100)


class DeviceResponse(BaseModel):
    id: uuid.UUID
    label: str
    last_seen_at: datetime | None
    expires_at: datetime
    revoked_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Kid me
# ---------------------------------------------------------------------------
class KidMeResponse(BaseModel):
    prenom: str
    avatar: str
    age: int
    quota_messages_jour: int
    quota_messages_restant: int
    quota_tokens_restant: int
    hors_plage_horaire: bool


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
