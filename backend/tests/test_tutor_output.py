"""Sortie structurée du tuteur : type de message (question, indice, exemple…)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agent.graph import run_agent
from app.agent.tutor_output import parse_tutor_output
from app.api.schemas import MessageResponseKid
from tests.test_graph import _make_profile

INPUT_OK = {
    "distress": "none",
    "self_harm": False,
    "abuse_disclosure": False,
    "personal_info_shared": False,
    "jailbreak_attempt": False,
    "inappropriate_request": False,
    "forbidden_topic": False,
    "homework_dump": False,
    "reason": "",
}


class TestParseTutorOutput:
    def test_hint_with_level(self):
        r = parse_tutor_output('{"type":"hint","hint_level":2,"text":"Regarde les dizaines."}')
        assert r is not None
        assert (r.kind, r.hint_level, r.text) == ("hint", 2, "Regarde les dizaines.")

    def test_code_fence_is_stripped(self):
        r = parse_tutor_output('```json\n{"type":"question","text":"Que sais-tu ?"}\n```')
        assert r is not None and r.kind == "question"

    def test_hint_level_dropped_for_other_kinds(self):
        r = parse_tutor_output('{"type":"question","hint_level":3,"text":"Et toi ?"}')
        assert r is not None and r.hint_level is None

    def test_invalid_level_ignored(self):
        r = parse_tutor_output('{"type":"hint","hint_level":7,"text":"Indice"}')
        assert r is not None and r.kind == "hint" and r.hint_level is None

    def test_unknown_type_falls_back_to_plain(self):
        r = parse_tutor_output('{"type":"answer","text":"Bonjour"}')
        assert r is not None and r.kind is None and r.text == "Bonjour"

    def test_plain_text_is_accepted_untyped(self):
        r = parse_tutor_output("Essayons ensemble ! Qu'est-ce que tu sais déjà ?")
        assert r is not None and r.kind is None

    def test_broken_json_salvages_text(self):
        r = parse_tutor_output('{"type": "hint", "text": "Compte sur tes doigts", "hint_level": ')
        assert r is not None and r.text == "Compte sur tes doigts" and r.kind is None

    @pytest.mark.parametrize("raw", ["", "   ", '{"type":"hint"}', '{"text": ""}', "{oops"])
    def test_unusable_output_returns_none(self, raw):
        assert parse_tutor_output(raw) is None

    def test_kid_schema_exposes_kind(self):
        fields = MessageResponseKid.model_fields
        assert "kind" in fields and "hint_level" in fields


def _llm_returning(*contents: str) -> AsyncMock:
    responses = []
    for c in contents:
        m = MagicMock()
        m.content = c
        m.usage_metadata = {"input_tokens": 10, "output_tokens": 5}
        responses.append(m)
    llm = AsyncMock()
    llm.ainvoke = AsyncMock(side_effect=responses)
    return llm


async def _done(llm, output_guard) -> dict:
    with (
        patch("app.agent.graph.run_input_guard", new_callable=AsyncMock, return_value=INPUT_OK),
        patch("app.agent.graph.run_output_guard", side_effect=output_guard),
        patch("app.agent.graph._get_tutor_llm", return_value=llm),
    ):
        events = [
            e
            async for e in run_agent(
                profile=_make_profile(),
                conversation_id="c",
                child_message="7 + 8 ?",
                history=[],
                learner_notes=[],
                child_msg_count=1,
            )
        ]
    done = [e for e in events if e["type"] == "done"]
    assert len(done) == 1
    tokens = "".join(e["data"]["text"] for e in events if e["type"] == "token")
    assert "{" not in tokens, "le JSON brut ne doit jamais être montré à l'enfant"
    return done[0]["data"]


class TestAgentMessageKind:
    @pytest.mark.asyncio
    async def test_kind_and_level_in_done_event(self):
        guard = AsyncMock(return_value={"status": "ok", "type_ok": True})
        data = await _done(
            _llm_returning('{"type":"hint","hint_level":1,"text":"Pense à 10."}'), guard
        )
        assert data["kind"] == "hint" and data["hint_level"] == 1
        assert data["full_text"] == "Pense à 10."
        # output_guard reçoit le texte (pas le JSON) et le type déclaré
        kwargs = guard.call_args.kwargs
        assert kwargs["draft"] == "Pense à 10."
        assert kwargs["message_type"] == "hint" and kwargs["hint_level"] == 1

    @pytest.mark.asyncio
    async def test_guard_type_mismatch_drops_kind(self):
        guard = AsyncMock(return_value={"status": "ok", "type_ok": False})
        data = await _done(_llm_returning('{"type":"success","text":"Essaie encore !"}'), guard)
        assert data["kind"] is None and data["full_text"] == "Essaie encore !"

    @pytest.mark.asyncio
    async def test_unreadable_output_is_retried_once(self):
        guard = AsyncMock(return_value={"status": "ok"})
        llm = _llm_returning('{"type":"hint"', '{"type":"question","text":"Combien ?"}')
        data = await _done(llm, guard)
        assert llm.ainvoke.call_count == 2
        assert data["kind"] == "question"

    @pytest.mark.asyncio
    async def test_unreadable_output_twice_uses_fallback(self):
        guard = AsyncMock(return_value={"status": "ok"})
        data = await _done(_llm_returning("{", "{"), guard)
        assert data["kind"] is None
        assert "réessaie" in data["full_text"].lower() or "souci" in data["full_text"].lower()

    @pytest.mark.asyncio
    async def test_critical_safe_response_is_typed_safety(self):
        verdict = {**INPUT_OK, "distress": "high"}
        with patch(
            "app.agent.graph.run_input_guard", new_callable=AsyncMock, return_value=verdict
        ):
            events = [
                e
                async for e in run_agent(
                    profile=_make_profile(),
                    conversation_id="c",
                    child_message="je suis très triste",
                    history=[],
                    learner_notes=[],
                    child_msg_count=1,
                )
            ]
        done = [e for e in events if e["type"] == "done"][0]["data"]
        assert done["kind"] == "safety"
