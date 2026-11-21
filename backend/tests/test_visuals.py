"""Supports visuels (« feuille de Lumio ») : schémas, garde-fous, graphe."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agent import graph
from app.agent.graph import run_agent, show_visual_tool
from app.agent.visuals import (
    alt_text,
    arithmetic_answer,
    reveals_arithmetic_answer,
    validate_visual,
)
from tests.test_graph import _make_profile
from tests.test_tutor_output import INPUT_OK

NUMBER_LINE = {
    "kind": "number_line",
    "title": "7 + 5 sur la droite",
    "min": 0,
    "max": 15,
    "step": 1,
    "marks": [{"value": 7}],
    "jumps": [
        {"start": 0, "end": 7, "layer": "known"},
        {"start": 7, "end": 10, "label": "+3", "layer": "hint"},
    ],
}
VALID = {
    "number_line": NUMBER_LINE,
    "fraction_bars": {
        "kind": "fraction_bars",
        "title": "Un tiers et un quart",
        "bars": [{"parts": 3, "shaded": 1, "label": "1/3"}, {"parts": 4, "shaded": 1}],
    },
    "chart": {
        "kind": "chart",
        "title": "Livres lus",
        "chart_type": "bar",
        "x_labels": ["lun.", "mar.", "mer.", "jeu."],
        "series": [{"name": "Livres", "values": [2, 4, 3, None]}],
    },
    "shape": {
        "kind": "shape",
        "title": "Ton triangle",
        "figure": "triangle",
        "width": 6,
        "height": 4,
        "base_label": "base 6 cm",
        "height_label": "hauteur 4 cm",
        "twin": True,
    },
    "timeline": {
        "kind": "timeline",
        "title": "De la Révolution à l'abolition",
        "events": [
            {"year": 1789, "label": "Révolution"},
            {"year": 1804, "label": "Empire"},
            {"year": None, "label": "Abolition"},
        ],
    },
}


class TestSchemas:
    @pytest.mark.parametrize("kind", list(VALID))
    def test_valid_specs(self, kind):
        out = validate_visual(VALID[kind])
        assert out is not None and out["kind"] == kind
        assert out["alt"].startswith(VALID[kind]["title"])

    def test_json_string_accepted(self):
        assert validate_visual(json.dumps(NUMBER_LINE)) is not None

    @pytest.mark.parametrize(
        "bad",
        [
            {**NUMBER_LINE, "kind": "svg"},  # type hors liste blanche
            {**NUMBER_LINE, "svg": "<svg onload=alert(1)>"},  # champ inconnu
            {**NUMBER_LINE, "title": "Voir https://exemple.fr"},  # URL
            {**NUMBER_LINE, "title": "<script>"},  # balise
            {**NUMBER_LINE, "min": 10, "max": 5},  # bornes
            {**NUMBER_LINE, "max": 1000, "step": 1},  # trop de graduations
            {**NUMBER_LINE, "marks": [{"value": 99}]},  # hors droite
            {**NUMBER_LINE, "marks": [{"value": i} for i in range(13)]},  # trop de marques
            {**VALID["fraction_bars"], "bars": [{"parts": 3, "shaded": 4}]},
            {**VALID["chart"], "series": [{"name": "x", "values": [1, 2]}]},  # longueurs
            {**VALID["shape"], "figure": "circle"},  # rayon manquant
            {**VALID["timeline"], "events": [{"year": 1789, "label": "R"}]},  # 1 événement
            {**VALID["timeline"], "title": "x" * 61},  # titre trop long
            "pas du json",
            42,
        ],
    )
    def test_invalid_specs_rejected(self, bad):
        assert validate_visual(bad) is None

    def test_oversized_spec_rejected(self):
        big = {**NUMBER_LINE, "caption": "a" * 140, "extra_padding": "b" * 5000}
        assert validate_visual(big) is None

    def test_alt_text_mentions_unknown(self):
        out = validate_visual(VALID["chart"])
        assert out is not None and "à trouver" in out["alt"]
        assert "date à trouver" in alt_text(validate_visual(VALID["timeline"]) or {})

    def test_tool_schema_has_no_refs(self):
        params = show_visual_tool()["function"]["parameters"]
        assert "$ref" not in json.dumps(params)


class TestNoAnswerGuard:
    def test_arithmetic_answer(self):
        assert arithmetic_answer("C'est combien 7 + 5 ?") == 12
        assert arithmetic_answer("6 fois 7") == 42
        assert arithmetic_answer("Pourquoi il pleut ?") is None

    def test_number_line_marking_result_is_blocked(self):
        spec = validate_visual(
            {
                **NUMBER_LINE,
                "marks": [{"value": 7}, {"value": 12, "label": "12"}],
            }
        )
        assert spec is not None
        assert reveals_arithmetic_answer(spec, "7 + 5 ?")

    def test_jump_landing_on_result_is_blocked(self):
        spec = validate_visual({**NUMBER_LINE, "jumps": [{"start": 7, "end": 12, "label": "+5"}]})
        assert spec is not None and reveals_arithmetic_answer(spec, "7 + 5")

    def test_label_spelling_result_is_blocked(self):
        spec = validate_visual({**NUMBER_LINE, "title": "7 + 5 = 12"})
        assert spec is not None and reveals_arithmetic_answer(spec, "7 + 5")

    def test_helpful_visual_passes(self):
        spec = validate_visual(NUMBER_LINE)
        assert spec is not None and not reveals_arithmetic_answer(spec, "7 + 5 ?")


def _response(content: str, tool_args: dict | None = None):
    m = MagicMock()
    m.content = content
    m.usage_metadata = {"input_tokens": 10, "output_tokens": 5}
    m.tool_calls = [{"name": "show_visual", "args": tool_args, "id": "call-1"}] if tool_args else []
    return m


async def _run(llm, guard, *, flag: bool, profile_on: bool, message: str = "7 + 5 ?"):
    get_llm = MagicMock(return_value=llm)
    with (
        patch.object(graph.settings, "visual_aids_enabled", flag),
        patch("app.agent.graph.run_input_guard", new_callable=AsyncMock, return_value=INPUT_OK),
        patch("app.agent.graph.run_output_guard", side_effect=guard),
        patch("app.agent.graph._get_tutor_llm", get_llm),
    ):
        events = [
            e
            async for e in run_agent(
                profile=_make_profile(supports_visuels=profile_on),
                conversation_id="c",
                child_message=message,
                history=[],
                learner_notes=[],
                child_msg_count=1,
            )
        ]
    done = [e for e in events if e["type"] == "done"][0]["data"]
    return done, get_llm


TEXT = '{"type":"hint","hint_level":2,"text":"Regarde la feuille : il reste combien ?"}'


class TestGraphVisuals:
    @pytest.mark.asyncio
    async def test_flag_off_tool_absent(self):
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(TEXT, NUMBER_LINE))
        guard = AsyncMock(return_value={"status": "ok"})
        done, get_llm = await _run(llm, guard, flag=False, profile_on=True)
        assert get_llm.call_args.kwargs.get("with_visual_tool") is False
        assert done["visual"] is None
        system = llm.ainvoke.call_args.args[0][0].content
        assert "show_visual" not in system

    @pytest.mark.asyncio
    async def test_profile_off_tool_absent(self):
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(TEXT))
        guard = AsyncMock(return_value={"status": "ok"})
        _, get_llm = await _run(llm, guard, flag=True, profile_on=False)
        assert get_llm.call_args.kwargs.get("with_visual_tool") is False

    @pytest.mark.asyncio
    async def test_visual_in_done_event(self):
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(TEXT, NUMBER_LINE))
        guard = AsyncMock(return_value={"status": "ok", "visual_ok": True})
        done, get_llm = await _run(llm, guard, flag=True, profile_on=True)
        assert get_llm.call_args.kwargs.get("with_visual_tool") is True
        assert done["visual"]["kind"] == "number_line"
        assert done["kind"] == "hint"
        assert guard.call_args.kwargs["visual_description"].startswith("7 + 5")
        assert "show_visual" in llm.ainvoke.call_args.args[0][0].content

    @pytest.mark.asyncio
    async def test_visual_revealing_answer_is_dropped_text_kept(self):
        bad = {**NUMBER_LINE, "jumps": [{"start": 0, "end": 12, "label": "12"}]}
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(TEXT, bad))
        guard = AsyncMock(return_value={"status": "ok"})
        done, _ = await _run(llm, guard, flag=True, profile_on=True)
        assert done["visual"] is None
        assert done["full_text"].startswith("Regarde la feuille")
        assert done["output_verdict"]["visual_dropped"] == "reveals_answer"

    @pytest.mark.asyncio
    async def test_invalid_spec_is_dropped(self):
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(TEXT, {"kind": "svg", "title": "x"}))
        guard = AsyncMock(return_value={"status": "ok"})
        done, _ = await _run(llm, guard, flag=True, profile_on=True)
        assert done["visual"] is None and done["kind"] == "hint"

    @pytest.mark.asyncio
    async def test_output_guard_can_reject_visual(self):
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(TEXT, VALID["fraction_bars"]))
        guard = AsyncMock(return_value={"status": "ok", "visual_ok": False})
        done, _ = await _run(llm, guard, flag=True, profile_on=True, message="1/3 + 1/4 ?")
        assert done["visual"] is None
        assert done["output_verdict"]["visual_dropped"] == "output_guard"

    @pytest.mark.asyncio
    async def test_tool_error_falls_back_without_tool(self):
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(side_effect=[Exception("tools refused"), _response(TEXT)])
        guard = AsyncMock(return_value={"status": "ok"})
        done, get_llm = await _run(llm, guard, flag=True, profile_on=True)
        assert done["visual"] is None and done["kind"] == "hint"
        assert get_llm.call_args_list[-1].kwargs.get("with_visual_tool", False) is False


# ---------------------------------------------------------------------------
# Règle : la valeur cherchée n'est ni écrite ni mise en valeur avant la réussite
# ---------------------------------------------------------------------------
from fractions import Fraction  # noqa: E402

from app.agent.visuals import (  # noqa: E402
    enforce_no_answer,
    reveals_answer,
    sought_value,
)

NON_SUCCESS = ["question", "hint", "example", "explanation", None]
TWELVE = Fraction(12)


def _nl(**over):
    spec = validate_visual({**NUMBER_LINE, **over})
    assert spec is not None
    return spec


class TestNoAnswerBeforeSuccess:
    @pytest.mark.parametrize("kind", NON_SUCCESS)
    def test_helpful_line_kept_and_tick_12_masked(self, kind):
        out, reason = enforce_no_answer(_nl(), TWELVE, kind)
        assert reason is None and out is not None
        assert out["masked"] == [12.0]  # la graduation reste, son nombre n'est pas écrit

    @pytest.mark.parametrize("kind", NON_SUCCESS)
    @pytest.mark.parametrize(
        "over",
        [
            {"marks": [{"value": 12}]},  # point sur 12
            {"marks": [{"value": 7}, {"value": 12, "label": "ici"}]},
            {"jumps": [{"start": 7, "end": 12, "label": "+5"}]},  # flèche qui s'arrête sur 12
            {"jumps": [{"start": 12, "end": 15, "label": "+3"}]},  # flèche qui part de 12
            {"title": "7 + 5 = 12"},  # « 12 » écrit
            {"caption": "La réponse est 12"},
            {"jumps": [{"start": 7, "end": 10, "label": "12"}]},  # étiquette « 12 »
        ],
    )
    def test_twelve_written_or_highlighted_is_dropped(self, kind, over):
        out, reason = enforce_no_answer(_nl(**over), TWELVE, kind)
        assert out is None and reason == "reveals_answer"

    def test_success_may_show_the_result(self):
        spec = _nl(marks=[{"value": 12, "label": "12"}], jumps=[{"start": 7, "end": 12}])
        out, reason = enforce_no_answer(spec, TWELVE, "success")
        assert out == spec and reason is None
        assert "masked" not in out

    def test_value_outside_line_is_not_masked(self):
        out, _ = enforce_no_answer(_nl(max=10), TWELVE, "hint")
        assert out is not None and "masked" not in out

    def test_sought_value_from_previous_child_message(self):
        assert sought_value("3 ?", ["C'est combien 7 + 5 ?", "je sais pas"]) == 12
        assert sought_value("Pourquoi il pleut ?", []) is None

    def test_fraction_answer(self):
        ans = sought_value("Combien font 1/3 + 1/4 ?")
        assert ans == Fraction(7, 12)
        seven_twelfths = validate_visual(
            {
                "kind": "fraction_bars",
                "title": "Douzièmes",
                "bars": [{"parts": 12, "shaded": 7}],
            }
        )
        thirds = validate_visual(VALID["fraction_bars"])
        assert seven_twelfths and thirds
        assert reveals_answer(seven_twelfths, ans)  # 7 parts sur 12 coloriées
        assert not reveals_answer(thirds, ans)
        labelled = validate_visual(
            {
                "kind": "fraction_bars",
                "title": "Résultat 7/12",
                "bars": [{"parts": 3, "shaded": 1}],
            }
        )
        assert labelled and reveals_answer(labelled, ans)

    def test_chart_value_equal_to_answer_is_dropped(self):
        spec = validate_visual(
            {**VALID["chart"], "series": [{"name": "x", "values": [2, 12, 3, None]}]}
        )
        assert spec is not None
        assert enforce_no_answer(spec, TWELVE, "hint")[0] is None


class TestGraphNoAnswerRule:
    @pytest.mark.asyncio
    async def test_hint_line_has_tick_12_masked_and_guard_gets_value(self):
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(TEXT, NUMBER_LINE))
        guard = AsyncMock(return_value={"status": "ok", "visual_ok": True})
        done, _ = await _run(llm, guard, flag=True, profile_on=True, message="7 + 5 ?")
        assert done["visual"]["masked"] == [12.0]
        assert guard.call_args.kwargs["sought_value"] == "12"

    @pytest.mark.asyncio
    async def test_twelve_marked_in_a_hint_is_dropped(self):
        bad = {**NUMBER_LINE, "marks": [{"value": 12}]}
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(TEXT, bad))
        guard = AsyncMock(return_value={"status": "ok", "visual_ok": True})
        done, _ = await _run(llm, guard, flag=True, profile_on=True, message="7 + 5 ?")
        assert done["visual"] is None
        assert done["output_verdict"]["visual_dropped"] == "reveals_answer"
        assert done["kind"] == "hint"  # le texte part quand même

    @pytest.mark.asyncio
    async def test_success_message_may_show_twelve(self):
        ok = {**NUMBER_LINE, "jumps": [{"start": 7, "end": 12, "label": "+5"}]}
        text = '{"type":"success","text":"Oui ! Tu as trouvé 12 tout seul."}'
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(text, ok))
        guard = AsyncMock(return_value={"status": "ok", "type_ok": True})
        done, _ = await _run(llm, guard, flag=True, profile_on=True, message="7 + 5 = 12 ?")
        assert done["kind"] == "success"
        assert done["visual"] is not None and "masked" not in done["visual"]

    @pytest.mark.asyncio
    async def test_success_refused_by_guard_drops_revealing_visual(self):
        ok = {**NUMBER_LINE, "jumps": [{"start": 7, "end": 12, "label": "+5"}]}
        text = '{"type":"success","text":"Bravo !"}'
        llm = AsyncMock()
        llm.ainvoke = AsyncMock(return_value=_response(text, ok))
        guard = AsyncMock(return_value={"status": "ok", "type_ok": False})
        done, _ = await _run(llm, guard, flag=True, profile_on=True, message="7 + 5 ?")
        assert done["kind"] is None
        assert done["visual"] is None

    @pytest.mark.asyncio
    async def test_output_guard_prompt_states_the_rule(self):
        from app.agent import moderation

        captured = {}

        async def fake_invoke(prompt):
            captured["prompt"] = prompt
            m = MagicMock()
            m.content = '{"status":"ok"}'
            return m

        fake = MagicMock()
        fake.ainvoke = fake_invoke
        with patch.object(moderation, "_get_guard_llm", return_value=fake):
            await moderation.run_output_guard(
                draft="Regarde la feuille",
                child_message="7 + 5 ?",
                age=7,
                niveau="CE1",
                message_type="hint",
                visual_description="Droite graduée de 0 à 15.",
                sought_value="12",
            )
        prompt = captured["prompt"]
        assert "Valeur cherchée par l'enfant" in prompt and ": 12" in prompt
        assert "seul un message « success »" in prompt


class TestAnswerSafeAltText:
    @pytest.mark.parametrize("kind", NON_SUCCESS)
    def test_endpoint_equal_to_answer_not_in_alt(self, kind):
        out, reason = enforce_no_answer(_nl(max=12), TWELVE, kind)
        assert reason is None and out is not None
        assert out["masked"] == [12.0]
        assert "12" not in out["alt"]
        assert "une valeur à trouver" in out["alt"]

    def test_success_alt_keeps_the_endpoint(self):
        out, _ = enforce_no_answer(_nl(max=12), TWELVE, "success")
        assert out is not None and "12" in out["alt"]

    def test_number_line_alt_is_regenerated_after_masking(self):
        spec = _nl()
        spec["alt"] = "Une droite qui mène à 12."
        out, _ = enforce_no_answer(spec, TWELVE, "hint")
        assert out is not None and "12" not in out["alt"]

    def test_alt_backstop(self):
        spec = validate_visual(VALID["timeline"])
        assert spec is not None
        spec["alt"] = "Frise : réponse 12."
        assert enforce_no_answer(spec, TWELVE, "hint") == (None, "reveals_answer")


# --- Export RGPD : le visuel et le type du message sont inclus ---------------
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.db.models import Admin, Conversation, Message, Profile  # noqa: E402


@pytest_asyncio.fixture
async def https_client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://testserver") as c:
        yield c


@pytest.mark.asyncio
async def test_profile_export_includes_visual(
    https_client: AsyncClient, admin_user: Admin, child_profile: Profile, db_session
):
    conv = Conversation(profile_id=child_profile.id, titre="Additions")
    db_session.add(conv)
    await db_session.flush()
    spec = validate_visual(NUMBER_LINE)
    db_session.add(
        Message(
            conversation_id=conv.id,
            role="assistant",
            contenu="Regarde la feuille",
            kind="hint",
            hint_level=2,
            visual=spec,
        )
    )
    await db_session.commit()
    r = await https_client.post(
        "/api/auth/admin/login",
        json={"email": "admin@test.com", "password": "test-password-123"},
    )
    assert r.status_code == 200
    r = await https_client.get(f"/api/admin/profiles/{child_profile.id}/export")
    assert r.status_code == 200, r.text
    msg = r.json()["conversations"][0]["messages"][0]
    assert msg["visual"]["kind"] == "number_line"
    assert msg["kind"] == "hint" and msg["hint_level"] == 2


class TestFractionalPrecision:
    def test_fractional_step_masks_two_thirds(self):
        ans = sought_value("1/3 + 1/3 ?")
        assert ans == Fraction(2, 3)
        spec = validate_visual(
            {
                "kind": "number_line",
                "title": "Des tiers",
                "min": 0,
                "max": 1,
                "step": 1 / 3,
                "jumps": [{"start": 0, "end": 1 / 3, "label": "+1/3"}],
            }
        )
        assert spec is not None
        out, reason = enforce_no_answer(spec, ans, "hint")
        assert reason is None and out is not None
        assert out["masked"] and abs(out["masked"][0] - 2 / 3) < 1e-9

    @pytest.mark.parametrize("value", [0.67, 0.667, 0.6667, 0.7])
    def test_rounded_mark_counts_as_the_answer(self, value):
        spec = validate_visual(
            {
                "kind": "number_line",
                "title": "Des tiers",
                "min": 0,
                "max": 1,
                "step": 0.1,
                "marks": [{"value": value}],
            }
        )
        assert spec is not None
        assert enforce_no_answer(spec, Fraction(2, 3), "hint") == (None, "reveals_answer")

    def test_rounded_label_counts_as_the_answer(self):
        spec = validate_visual({**VALID["timeline"], "title": "Environ 0,67"})
        assert spec is not None and reveals_answer(spec, Fraction(2, 3))

    def test_whole_numbers_stay_exact(self):
        spec = _nl(marks=[{"value": 11.5}])
        assert not reveals_answer(spec, TWELVE)


class TestChartAxisMasking:
    @pytest.mark.parametrize("kind", NON_SUCCESS)
    def test_chart_axis_masks_sought_value(self, kind):
        spec = validate_visual(
            {**VALID["chart"], "series": [{"name": "x", "values": [5, 11, 3, None]}]}
        )
        assert spec is not None
        out, reason = enforce_no_answer(spec, TWELVE, kind)
        assert reason is None and out is not None
        assert out["masked"] == [12.0]

    def test_success_chart_not_masked(self):
        spec = validate_visual(VALID["chart"])
        out, _ = enforce_no_answer(spec, TWELVE, "success")
        assert out is not None and "masked" not in out
