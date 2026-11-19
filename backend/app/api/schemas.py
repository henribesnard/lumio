"""Pydantic v2 schemas for all API endpoints."""

from __future__ import annotations

import uuid
from datetime import date, datetime

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
    quota_messages_jour: int = Field(default=50, ge=1, le=500)
    quota_tokens_jour: int = Field(default=50000, ge=1000, le=500000)
    plages_horaires: dict | None = None

    @field_validator("pin")
    @classmethod
    def pin_must_be_digits(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Le PIN doit contenir 4 chiffres.")
        return v


class ProfileUpdate(BaseModel):
    prenom: str | None = Field(default=None, min_length=1, max_length=50)
    age: int | None = Field(default=None, ge=6, le=14)
    niveau: str | None = Field(default=None, min_length=1, max_length=10)
    avatar: str | None = Field(default=None, max_length=30)
    consignes_admin: str | None = None
    sujets_interdits: list[str] | None = None
    modele: str | None = None
    quota_messages_jour: int | None = Field(default=None, ge=1, le=500)
    quota_tokens_jour: int | None = Field(default=None, ge=1000, le=500000)
    plages_horaires: dict | None = None
    actif: bool | None = None


class ProfileResponse(BaseModel):
    id: uuid.UUID
    prenom: str
    age: int
    niveau: str
    avatar: str
    consignes_admin: str | None
    sujets_interdits: list[str]
    modele: str | None
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


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    contenu: str
    tokens_in: int
    tokens_out: int
    modele: str | None
    moderation: dict | None = None
    guard_verdict: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageResponseKid(BaseModel):
    """Message response for kids — no moderation/guard details."""
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    contenu: str
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
