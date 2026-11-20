"""Tests for Pydantic schema behaviour."""

from __future__ import annotations

import uuid
from datetime import datetime

from app.api.schemas import MessageResponse, MessageResponseKid


class TestModerationSummary:
    """moderation_summary: computed on admin MessageResponse, absent from kid."""

    def _make_message_kwargs(self, **overrides):
        base = {
            "id": uuid.uuid4(),
            "conversation_id": uuid.uuid4(),
            "role": "assistant",
            "contenu": "Salut !",
            "tokens_in": 10,
            "tokens_out": 20,
            "modele": "mistral-small",
            "moderation": None,
            "guard_verdict": None,
            "created_at": datetime.utcnow(),
        }
        base.update(overrides)
        return base

    def test_summary_none_when_allowed(self):
        msg = MessageResponse(**self._make_message_kwargs())
        assert msg.moderation_summary is None

    def test_summary_none_when_action_allow(self):
        msg = MessageResponse(
            **self._make_message_kwargs(
                moderation={"action": "allow"},
                guard_verdict={"action": "allow"},
            )
        )
        assert msg.moderation_summary is None

    def test_summary_input_blocked(self):
        msg = MessageResponse(
            **self._make_message_kwargs(
                moderation={"action": "block", "categories": ["violence"]},
            )
        )
        assert msg.moderation_summary == "Entrée: block (violence)"

    def test_summary_output_blocked(self):
        msg = MessageResponse(
            **self._make_message_kwargs(
                guard_verdict={"action": "rewrite", "categories": ["personal_info"]},
            )
        )
        assert msg.moderation_summary == "Sortie: rewrite (personal_info)"

    def test_summary_both_blocked(self):
        msg = MessageResponse(
            **self._make_message_kwargs(
                moderation={"action": "block", "categories": ["violence"]},
                guard_verdict={"action": "rewrite"},
            )
        )
        assert "Entrée: block (violence)" in msg.moderation_summary
        assert "Sortie: rewrite" in msg.moderation_summary

    def test_kid_response_has_no_moderation_fields(self):
        """MessageResponseKid must NOT expose moderation_summary, moderation, or guard_verdict."""
        kid_fields = set(MessageResponseKid.model_fields.keys())
        assert "moderation_summary" not in kid_fields
        assert "moderation" not in kid_fields
        assert "guard_verdict" not in kid_fields
