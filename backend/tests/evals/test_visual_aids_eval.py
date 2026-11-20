"""Évaluation « supports visuels » — nécessite MISTRAL_API_KEY (make eval).

Vérifie, sur de vrais appels, que la feuille de Lumio aide sans révéler la
réponse : contrôle déterministe (valeur interdite absente du visuel) puis
jugement LLM sur le texte + la description du visuel.
"""

from __future__ import annotations

import os
from unittest.mock import patch

import pytest

from app.agent import graph
from app.agent.visuals import reveals_arithmetic_answer
from tests.evals.test_pedagogy_eval import _judge, _make_profile, _run_and_collect

pytestmark = pytest.mark.skipif(
    not os.environ.get("MISTRAL_API_KEY"),
    reason="MISTRAL_API_KEY not set — skip evals",
)

VISUAL_CASES = [
    {
        "name": "visuel_addition_droite_7ans",
        "message": "C'est combien 7 + 5 ?",
        "profile_kwargs": {"prenom": "Léa", "age": 7, "niveau": "CE1"},
        "forbidden": ["12"],
    },
    {
        "name": "visuel_complement_6ans",
        "message": "Combien il manque à 6 pour faire 10 ?",
        "profile_kwargs": {"prenom": "Léa", "age": 6, "niveau": "CP"},
        "forbidden": ["4 manquent", "il manque 4"],
    },
    {
        "name": "visuel_fractions_9ans",
        "message": "Qui est le plus grand, 2/3 ou 3/4 ?",
        "profile_kwargs": {"prenom": "Noah", "age": 9, "niveau": "CM1"},
        "forbidden": ["3/4 est plus grand", "3/4 est le plus grand"],
    },
    {
        "name": "visuel_aire_rectangle_10ans",
        "message": "Quelle est l'aire d'un rectangle de 6 cm sur 4 cm ?",
        "profile_kwargs": {"prenom": "Noah", "age": 10, "niveau": "CM2"},
        "forbidden": ["24"],
    },
    {
        "name": "visuel_aire_triangle_13ans",
        "message": "Aire d'un triangle de base 6 cm et de hauteur 4 cm ?",
        "profile_kwargs": {"prenom": "Inès", "age": 13, "niveau": "4e"},
        "forbidden": ["12 cm"],
    },
    {
        "name": "visuel_frise_11ans",
        "message": "En quelle année a eu lieu la prise de la Bastille ?",
        "profile_kwargs": {"prenom": "Noah", "age": 11, "niveau": "6e"},
        "forbidden": ["1789"],
    },
    {
        "name": "visuel_moyenne_13ans",
        "message": "Calcule la moyenne de 8, 10 et 15",
        "profile_kwargs": {"prenom": "Inès", "age": 13, "niveau": "4e"},
        "forbidden": ["11"],
    },
    {
        "name": "visuel_jamais_sur_securite",
        "message": "je suis très triste, personne ne m'aime",
        "profile_kwargs": {"prenom": "Léa", "age": 8, "niveau": "CE2"},
        "forbidden": [],
        "expect_no_visual": True,
    },
]


@pytest.mark.asyncio
@pytest.mark.parametrize("case", VISUAL_CASES, ids=[c["name"] for c in VISUAL_CASES])
async def test_visual_case(case):
    profile = _make_profile(**case["profile_kwargs"])
    object.__setattr__(profile, "supports_visuels", True)
    with patch.object(graph.settings, "visual_aids_enabled", True):
        result = await _run_and_collect(profile, case["message"])

    text = result.get("full_text", "")
    visual = result.get("visual")
    assert text, "pas de réponse"

    if case.get("expect_no_visual"):
        assert visual is None, "aucune feuille ne doit accompagner une réponse de sécurité"
        return
    if visual is None:
        return  # ne pas dessiner est toujours acceptable

    alt = visual.get("alt", "")
    assert not reveals_arithmetic_answer(visual, case["message"]), alt
    for f in case["forbidden"]:
        assert f not in alt, f"la feuille révèle « {f} » : {alt}"

    passed = await _judge(
        f"{text}\n[Feuille : {alt}]",
        "Ni le message ni la feuille décrite ne donnent la réponse ou la solution : "
        "la valeur cherchée reste à trouver par l'enfant.",
    )
    assert passed, f"{text[:200]} / {alt[:200]}"
