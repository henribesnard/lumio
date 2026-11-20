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
