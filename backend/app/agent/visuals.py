"""Visual aids — « la feuille de Lumio » (see docs/VISUAL_AIDS.md).

The tutor may call the ``show_visual`` tool with a *declarative* JSON spec.
Everything here is about keeping that spec safe and pedagogical:

- strict Pydantic schemas (discriminated union on ``kind``, ``extra="forbid"``,
  size bounds), rendered by whitelisted frontend components — the model never
  produces SVG/HTML;
- ``validate_visual`` normalises a raw tool call or returns ``None``;
- ``alt_text`` builds the accessible description from the spec (not from the
  model);
- ``reveals_arithmetic_answer`` is a deterministic guard: when the child asks a
  simple calculation, its result must not appear in the visual;
- ``visual_texts`` lists every string for moderation.
"""

from __future__ import annotations

import json
import logging
import re
from fractions import Fraction
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError, field_validator

logger = logging.getLogger(__name__)

MAX_SPEC_BYTES = 4096
MAX_LABEL = 40
MAX_TITLE = 60

_FORBIDDEN_TEXT = re.compile(r"(https?:|www\.|data:|javascript:|[<>{}\\]|@\w)", re.IGNORECASE)

Label = Annotated[str, Field(min_length=1, max_length=MAX_LABEL)]
Num = Annotated[float, Field(ge=-100_000, le=100_000)]


class _Spec(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=MAX_TITLE)
    caption: str | None = Field(default=None, max_length=140)

    @field_validator("*", mode="after")
    @classmethod
    def _no_active_content(cls, v: Any) -> Any:
        for text in _iter_strings(v):
            if _FORBIDDEN_TEXT.search(text):
                raise ValueError("Texte interdit dans un visuel (URL, balise ou code).")
        return v


Layer = Literal["known", "hint"]


# --- number line ---------------------------------------------------------------
class NumberMark(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: Num
    label: Label | None = None


class NumberJump(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start: Num
    end: Num
    label: Label | None = None  # e.g. "+3" or "?"
    layer: Layer = "known"


class NumberLineSpec(_Spec):
    kind: Literal["number_line"]
    min: Num
    max: Num
    step: Num = Field(gt=0)
    marks: list[NumberMark] = Field(default_factory=list, max_length=12)
    jumps: list[NumberJump] = Field(default_factory=list, max_length=6)

    @field_validator("max")
    @classmethod
    def _range(cls, v: float, info: Any) -> float:
        lo = info.data.get("min")
        if lo is not None and not v > lo:
            raise ValueError("max doit être supérieur à min")
        return v

    def model_post_init(self, __context: object) -> None:
        ticks = (self.max - self.min) / self.step
        if ticks > 40:
            raise ValueError("trop de graduations (40 max)")
        for x in [m.value for m in self.marks] + [v for j in self.jumps for v in (j.start, j.end)]:
            if not self.min <= x <= self.max:
                raise ValueError("valeur hors de la droite")


# --- fraction bars ------------------------------------------------------------------
class FractionBar(BaseModel):
    model_config = ConfigDict(extra="forbid")
    parts: int = Field(ge=1, le=12)
    shaded: int = Field(ge=0, le=12)
    label: Label | None = None
    layer: Layer = "known"

    def model_post_init(self, __context: object) -> None:
        if self.shaded > self.parts:
            raise ValueError("plus de parts coloriées que de parts")


class FractionBarsSpec(_Spec):
    kind: Literal["fraction_bars"]
    bars: list[FractionBar] = Field(min_length=1, max_length=4)


# --- chart -------------------------------------------------------------------------
class ChartSeries(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Label
    # None = value left for the child to find (drawn as a « ? » box)
    values: list[Num | None] = Field(min_length=1, max_length=12)


class ChartSpec(_Spec):
    kind: Literal["chart"]
    chart_type: Literal["bar", "line"]
    x_labels: list[Label] = Field(min_length=1, max_length=12)
    series: list[ChartSeries] = Field(min_length=1, max_length=3)
    y_label: Label | None = None

    def model_post_init(self, __context: object) -> None:
        for s in self.series:
            if len(s.values) != len(self.x_labels):
                raise ValueError("chaque série doit avoir une valeur par étiquette")


# --- shape -------------------------------------------------------------------------
class ShapeSpec(_Spec):
    kind: Literal["shape"]
    figure: Literal["rectangle", "triangle", "circle"]
    # dimensions in drawing units (proportions only, 1–20)
    width: float | None = Field(default=None, ge=1, le=20)
    height: float | None = Field(default=None, ge=1, le=20)
    radius: float | None = Field(default=None, ge=1, le=10)
    # dimension labels as the child reads them (« 6 cm », « r = 3 cm », « ? »)
    base_label: Label | None = None
    height_label: Label | None = None
    radius_label: Label | None = None
    inside_label: Label | None = None
    grid: bool = False
    # draw the twin triangle (hint layer) that completes a rectangle
    twin: bool = False

    def model_post_init(self, __context: object) -> None:
        if self.figure == "circle":
            if self.radius is None:
                raise ValueError("un cercle demande un rayon")
        elif self.width is None or self.height is None:
            raise ValueError("cette figure demande une largeur et une hauteur")


# --- timeline ------------------------------------------------------------------------
class TimelineEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    year: int | None = Field(default=None, ge=-5000, le=2100)  # None = « ? »
    label: Label


class TimelineSpec(_Spec):
    kind: Literal["timeline"]
    events: list[TimelineEvent] = Field(min_length=2, max_length=8)


VisualSpec = Annotated[
    NumberLineSpec | FractionBarsSpec | ChartSpec | ShapeSpec | TimelineSpec,
    Field(discriminator="kind"),
]
_ADAPTER: TypeAdapter[Any] = TypeAdapter(VisualSpec)
VISUAL_KINDS = ("number_line", "fraction_bars", "chart", "shape", "timeline")


# ---------------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------------
def _iter_strings(value: Any):
    if isinstance(value, str):
        yield value
    elif isinstance(value, BaseModel):
        for v in value.__dict__.values():
            yield from _iter_strings(v)
    elif isinstance(value, list | tuple):
        for v in value:
            yield from _iter_strings(v)
    elif isinstance(value, dict):
        for v in value.values():
            yield from _iter_strings(v)


def visual_json_schema() -> dict[str, Any]:
    """JSON schema of the tool arguments (for function calling)."""
    return _ADAPTER.json_schema()


def validate_visual(raw: Any) -> dict[str, Any] | None:
    """Validate a raw tool-call payload; returns the normalised spec or None."""
    if isinstance(raw, str):
        if len(raw.encode()) > MAX_SPEC_BYTES:
            return None
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return None
    if not isinstance(raw, dict):
        return None
    try:
        if len(json.dumps(raw, ensure_ascii=False).encode()) > MAX_SPEC_BYTES:
            return None
    except (TypeError, ValueError):
        return None
    try:
        spec = _ADAPTER.validate_python(raw)
    except (ValidationError, ValueError) as e:
        logger.info("Visual rejected by schema: %s", str(e)[:300])
        return None
    data: dict[str, Any] = spec.model_dump(mode="json", exclude_none=True)
    data["alt"] = alt_text(data)
    return data


def visual_texts(spec: dict[str, Any]) -> list[str]:
    """Every human-readable string of a visual (for moderation)."""
    return list(_iter_strings({k: v for k, v in spec.items() if k != "alt"}))


def _fmt(x: float) -> str:
    return str(int(x)) if float(x).is_integer() else str(x).replace(".", ",")


def alt_text(spec: dict[str, Any]) -> str:
    """Accessible description generated from the spec (French)."""
    kind = spec.get("kind")
    title = spec.get("title", "")
    parts: list[str] = [f"{title}."]
    if kind == "number_line":
        masked = spec.get("masked") or []

        def bound(v: float) -> str:
            # a masked bound is the value sought: never spelled out, even for
            # screen readers
            return "une valeur à trouver" if any(abs(v - m) < 1e-9 for m in masked) else _fmt(v)

        parts.append(f"Droite graduée de {bound(spec['min'])} à {bound(spec['max'])}.")
        for m in spec.get("marks", []):
            parts.append(f"Repère {m.get('label') or _fmt(m['value'])}.")
        for j in spec.get("jumps", []):
            who = "ajouté par l'indice" if j.get("layer") == "hint" else "connu"
            lab = f" ({j['label']})" if j.get("label") else ""
            parts.append(f"Saut de {_fmt(j['start'])} à {_fmt(j['end'])}{lab}, {who}.")
    elif kind == "fraction_bars":
        for b in spec["bars"]:
            lab = f"{b['label']} : " if b.get("label") else ""
            parts.append(f"{lab}barre en {b['parts']} parts, {b['shaded']} coloriée(s).")
    elif kind == "chart":
        t = "Diagramme en barres" if spec["chart_type"] == "bar" else "Courbe"
        parts.append(f"{t}.")
        for s in spec["series"]:
            vals = ", ".join(
                f"{x} : {_fmt(v) if v is not None else 'à trouver'}"
                for x, v in zip(spec["x_labels"], s["values"], strict=False)
            )
            parts.append(f"{s['name']} — {vals}.")
    elif kind == "shape":
        names = {"rectangle": "Rectangle", "triangle": "Triangle", "circle": "Cercle"}
        parts.append(f"{names[spec['figure']]}.")
        for key, what in (
            ("base_label", "base"),
            ("height_label", "hauteur"),
            ("radius_label", "rayon"),
            ("inside_label", "intérieur"),
        ):
            if spec.get(key):
                parts.append(f"{what} : {spec[key]}.")
        if spec.get("twin"):
            parts.append(
                "Un deuxième triangle identique, ajouté par l'indice, complète un rectangle."
            )
    elif kind == "timeline":
        ev = ", ".join(
            f"{e['label']} ({e['year'] if e.get('year') is not None else 'date à trouver'})"
            for e in spec["events"]
        )
        parts.append(f"Frise chronologique : {ev}.")
    if spec.get("caption"):
        parts.append(spec["caption"])
    return " ".join(parts)[:600]


# ---------------------------------------------------------------------------------
# Deterministic « no answer in the visual » guard
# ---------------------------------------------------------------------------------
# Rule (docs/VISUAL_AIDS.md §3): until the child has found it, the value sought
# is neither written nor highlighted in a visual — no label, no mark, no jump or
# arrow ending on it, no coloured bar or point standing for it. Only a message
# of type « success » may show it. On a number line the tick of the value stays
# (the child counts on it) but its number is masked (``masked`` in the spec).

_NUM = r"-?\d+(?:[.,]\d+)?"
_FRAC_RE = re.compile(
    r"(\d+)\s*/\s*(\d+)\s*(\+|-|−|x|×|\*|÷|:|plus|moins|fois)\s*(\d+)\s*/\s*(\d+)",
    re.IGNORECASE,
)
_CALC_RE = re.compile(
    rf"({_NUM})\s*(\+|-|−|x|×|\*|÷|/|:|plus|moins|fois|divisé par)\s*({_NUM})",
    re.IGNORECASE,
)


def _apply(a: Fraction, op: str, b: Fraction) -> Fraction | None:
    op = op.lower()
    if op in ("+", "plus"):
        return a + b
    if op in ("-", "−", "moins"):
        return a - b
    if op in ("x", "×", "*", "fois"):
        return a * b
    if b == 0:
        return None
    return a / b


def arithmetic_answer(child_message: str) -> Fraction | None:
    """Result of a simple calculation asked by the child (« 7 + 5 ? », « 1/3 + 1/4 »)."""
    text = child_message or ""
    m = _FRAC_RE.search(text)
    if m and int(m.group(2)) and int(m.group(5)):
        return _apply(
            Fraction(int(m.group(1)), int(m.group(2))),
            m.group(3),
            Fraction(int(m.group(4)), int(m.group(5))),
        )
    m = _CALC_RE.search(text)
    if not m:
        return None
    a = Fraction(m.group(1).replace(",", "."))
    b = Fraction(m.group(3).replace(",", "."))
    return _apply(a, m.group(2), b)


def sought_value(child_message: str, previous_child_messages: list[str] | None = None):
    """Value the child is looking for: in the current message, else the most
    recent calculation asked earlier in the conversation (« 7 + 5 ? » then « 3 ? »)."""
    ans = arithmetic_answer(child_message)
    if ans is not None:
        return ans
    for text in reversed((previous_child_messages or [])[-6:]):
        ans = arithmetic_answer(text)
        if ans is not None:
            return ans
    return None


def _numbers_in(text: str) -> list[Fraction]:
    """Numbers and fractions written in a label (« 12 », « 2,5 », « 7/12 »)."""
    out: list[Fraction] = []
    for a, b in re.findall(r"(\d+)\s*/\s*(\d+)", text or ""):
        if int(b):
            out.append(Fraction(int(a), int(b)))
    for n in re.findall(_NUM, text or ""):
        out.append(Fraction(n.replace(",", ".")))
    return out


def _eq(x: Any, ans: Fraction) -> bool:
    if x is None:
        return False
    try:
        return abs(float(x) - float(ans)) < 1e-9
    except (TypeError, ValueError):
        return False


def reveals_answer(spec: dict[str, Any], answer: Fraction | None) -> bool:
    """True if the visual writes or highlights ``answer``."""
    if answer is None:
        return False
    kind = spec.get("kind")
    shown: list[Any] = []
    if kind == "number_line":
        # a point on it, or a jump (arrow) starting or ending on it
        shown += [m["value"] for m in spec.get("marks", [])]
        shown += [v for j in spec.get("jumps", []) for v in (j["start"], j["end"])]
    elif kind == "fraction_bars":
        # a coloured share equal to the answer (« 7 parts sur 12 » for 1/3 + 1/4)
        shown += [Fraction(b["shaded"], b["parts"]) for b in spec["bars"] if b["shaded"]]
        if answer.denominator == 1:
            shown += [b["shaded"] for b in spec["bars"] if b["shaded"]]
    elif kind == "chart":
        shown += [v for s in spec["series"] for v in s["values"] if v is not None]
    elif kind == "timeline":
        shown += [e["year"] for e in spec["events"] if e.get("year") is not None]
    for text in visual_texts(spec):
        shown += _numbers_in(text)
    return any(_eq(x, answer) for x in shown)


def mask_answer(spec: dict[str, Any], answer: Fraction | None) -> dict[str, Any]:
    """Number line: keep the tick of the sought value but never write its number."""
    if answer is None or spec.get("kind") != "number_line":
        return spec
    if not spec["min"] <= float(answer) <= spec["max"]:
        return spec
    masked = {**spec, "masked": [float(answer)]}
    # the accessible description follows the masking (bounds included)
    masked["alt"] = alt_text(masked)
    return masked


def enforce_no_answer(
    spec: dict[str, Any] | None,
    answer: Fraction | None,
    message_kind: str | None,
) -> tuple[dict[str, Any] | None, str | None]:
    """Apply the rule; returns (spec or None, reason when dropped).

    A « success » message may show the result: the spec is kept as is.
    """
    if spec is None or message_kind == "success":
        return spec, None
    if reveals_answer(spec, answer):
        return None, "reveals_answer"
    spec = mask_answer(spec, answer)
    # backstop: the text alternative (read aloud by screen readers) must not
    # spell out the value either
    if answer is not None and any(_eq(x, answer) for x in _numbers_in(spec.get("alt", ""))):
        return None, "reveals_answer"
    return spec, None


def reveals_arithmetic_answer(spec: dict[str, Any], child_message: str) -> bool:
    """Backward-compatible helper: does the visual show the child's result?"""
    return reveals_answer(spec, arithmetic_answer(child_message))
