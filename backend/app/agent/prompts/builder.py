"""Assembles the multi-layered system prompt for the tutor."""

from __future__ import annotations

from pathlib import Path

from app.db.models import LearnerNotes, Profile

_PROMPT_DIR = Path(__file__).parent


def _read(filename: str) -> str:
    return (_PROMPT_DIR / filename).read_text(encoding="utf-8")


def _age_bracket(age: int) -> str:
    if age <= 8:
        return "6-8"
    if age <= 11:
        return "9-11"
    return "12-14"


def _age_prompt_file(age: int) -> str:
    bracket = _age_bracket(age)
    return f"03_age_{bracket}.md"


def build_system_prompt(
    profile: Profile,
    learner_notes: list[LearnerNotes] | None = None,
) -> str:
    """Build the 4-layer system prompt for a given profile."""
    layers = []

    # Layer 1: Security (immutable)
    layers.append(_read("01_securite.md"))

    # Layer 2: Pedagogy (immutable)
    layers.append(_read("02_pedagogie.md"))

    # Layer 3: Age adaptation
    layers.append(_read(_age_prompt_file(profile.age)))

    # Layer 4: Profile-specific
    template = _read("04_profil.md")
    notes_text = "Aucune note pour le moment."
    if learner_notes:
        notes_text = "\n".join(f"- {n.matiere} : {n.notes}" for n in learner_notes)

    sujets = ", ".join(profile.sujets_interdits) if profile.sujets_interdits else "Aucun"
    consignes = profile.consignes_admin or "Aucune consigne particulière."

    layer4 = template.format(
        prenom=profile.prenom,
        age=profile.age,
        niveau=profile.niveau,
        learner_notes=notes_text,
        sujets_interdits=sujets,
        consignes_admin=consignes,
    )
    layers.append(layer4)

    return "\n\n---\n\n".join(layers)


def get_age_bracket(age: int) -> str:
    return _age_bracket(age)
