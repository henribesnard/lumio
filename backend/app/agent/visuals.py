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


ALT_MAX_CHARS = 600


def alt_text(spec: dict[str, Any], limit: int | None = ALT_MAX_CHARS) -> str:
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
        if spec.get("y_label"):
            parts.append(f"Axe vertical : {spec['y_label']}.")
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
    text = " ".join(parts)
    return text if limit is None else text[:limit]


def describe_for_guard(spec: dict[str, Any]) -> str:
    """Full, untruncated description for output_guard: the generated
    description plus every string the renderer displays, so nothing shown to
    the child escapes the guard's review."""
    full = alt_text(spec, limit=None)
    return f"{full} Textes affichés : {' | '.join(visual_texts(spec))}"


# ---------------------------------------------------------------------------------
# Deterministic « no answer in the visual » guard
# ---------------------------------------------------------------------------------
# Rule (docs/VISUAL_AIDS.md §3): until the child has found it, the value sought
# is neither written nor highlighted in a visual — no label, no mark, no jump or
# arrow ending on it, no coloured bar or point standing for it. Only a message
# of type « success » may show it. On a number line the tick of the value stays
# (the child counts on it) but its number is masked (``masked`` in the spec).

_NUM = r"-?\d+(?:[.,]\d+)?"
# An operand is a fraction (« 1/2 ») or a number (« 7 », « 2,5 »): the fraction
# alternative comes first so « 1/2 + 1 » reads as (1/2) + 1, not 1 / 2. When
# no operator follows, the regex backtracks and « 6 / 3 » stays a division.
_OPERAND = rf"(?:\d+\s*/\s*\d+|{_NUM})"
_OP = r"(?:\+|-|−|x|×|\*|÷|/|:|plus|moins|fois|divisé par)"
# A whole calculation: operands, operators and parentheses (« 7 + 5 - 2 »,
# « (3 + 4) × 2 », « 1/2 + 1 »). The fraction alternative of _OPERAND comes
# first: « a/b » is one operand, which has the same value as « a ÷ b ».
_EXPR_RE = re.compile(
    rf"[(\s]*{_OPERAND}[)\s]*(?:{_OP}[(\s]*{_OPERAND}[)\s]*)+",
    re.IGNORECASE,
)
_UNSIGNED_OPERAND = re.compile(r"\d+\s*/\s*\d+|\d+(?:[.,]\d+)?")
_SIGNED_OPERAND = re.compile(rf"\d+\s*/\s*\d+|{_NUM}")
_OP_RE = re.compile(_OP, re.IGNORECASE)


def _operand(text: str) -> Fraction | None:
    if "/" in text:
        num, den = (int(x) for x in text.split("/"))
        return Fraction(num, den) if den else None
    return Fraction(text.replace(",", ".").strip())


def _op_kind(op: str) -> str:
    op = op.lower()
    if op in ("+", "plus"):
        return "+"
    if op in ("-", "−", "moins"):
        return "-"
    if op in ("x", "×", "*", "fois"):
        return "*"
    return "/"


def _tokenize(expr: str) -> list[Any] | None:
    """Tokens: Fraction operands, '+', '-', '*', '/', '(' and ')'.

    After an operand or ')' a « - » is an operator (« 7-5 »); elsewhere it
    may start a negative number (« -3 + 5 »).
    """
    tokens: list[Any] = []
    i = 0
    while i < len(expr):
        c = expr[i]
        if c.isspace():
            i += 1
            continue
        if c in "()":
            tokens.append(c)
            i += 1
            continue
        expect_operator = bool(tokens) and (isinstance(tokens[-1], Fraction) or tokens[-1] == ")")
        if expect_operator:
            m = _OP_RE.match(expr, i)
            if not m:
                return None
            tokens.append(_op_kind(m.group(0)))
            i = m.end()
            continue
        m = _SIGNED_OPERAND.match(expr, i) or _UNSIGNED_OPERAND.match(expr, i)
        if not m:
            return None
        value = _operand(m.group(0))
        if value is None:
            return None
        tokens.append(value)
        i = m.end()
    return tokens


def _evaluate(tokens: list[Any]) -> Fraction | None:
    """Recursive descent: × and ÷ before + and −, parentheses. No eval()."""
    pos = 0

    def peek() -> Any:
        return tokens[pos] if pos < len(tokens) else None

    def factor() -> Fraction:
        nonlocal pos
        tok = peek()
        if tok == "(":
            pos += 1
            val = expr()
            if peek() != ")":
                raise ValueError("unbalanced")
            pos += 1
            return val
        if isinstance(tok, Fraction):
            pos += 1
            return tok
        raise ValueError("operand expected")

    def term() -> Fraction:
        nonlocal pos
        val = factor()
        while peek() in ("*", "/"):
            op = tokens[pos]
            pos += 1
            rhs = factor()
            if op == "*":
                val *= rhs
            else:
                if rhs == 0:
                    raise ZeroDivisionError
                val /= rhs
        return val

    def expr() -> Fraction:
        nonlocal pos
        val = term()
        while peek() in ("+", "-"):
            op = tokens[pos]
            pos += 1
            rhs = term()
            val = val + rhs if op == "+" else val - rhs
        return val

    try:
        result = expr()
    except (ValueError, ZeroDivisionError):
        return None
    return result if pos == len(tokens) else None


def arithmetic_answer(child_message: str) -> Fraction | None:
    """Result of the calculation asked by the child (whole expression).

    « 7 + 5 ? » → 12, « 7 + 5 - 2 » → 10, « 2 + 3 × 4 » → 14,
    « (3 + 4) × 2 » → 14, « 1/2 + 1 » → 3/2, « 6 / 3 » → 2.
    """
    text = child_message or ""
    candidates = [m.group(0) for m in _EXPR_RE.finditer(text)]
    if not candidates:
        return None
    expr = max(candidates, key=len)
    tokens = _tokenize(expr)
    if tokens is None:
        return None
    result = _evaluate(tokens)
    if result is None and expr.count("(") != expr.count(")"):
        # unbalanced parentheses around the expression: evaluate without them
        stripped = _tokenize(expr.replace("(", " ").replace(")", " "))
        result = _evaluate(stripped) if stripped is not None else None
    return result


def arithmetic_answers(child_message: str) -> list[Fraction]:
    """Results of every calculation in a message (« 7 + 5, puis 3 + 4 » → 12, 7)."""
    out: list[Fraction] = []
    for m in _EXPR_RE.finditer(child_message or ""):
        expr = m.group(0)
        tokens = _tokenize(expr)
        val = _evaluate(tokens) if tokens is not None else None
        if val is None and expr.count("(") != expr.count(")"):
            stripped = _tokenize(expr.replace("(", " ").replace(")", " "))
            val = _evaluate(stripped) if stripped is not None else None
        if val is not None and val not in out:
            out.append(val)
    return out


def sought_values(
    child_message: str, previous_child_messages: list[str] | None = None
) -> list[Fraction]:
    """Every value the child is looking for: all calculations of the current
    message, else those of the most recent earlier message that has some."""
    found = arithmetic_answers(child_message)
    if found:
        return found
    for text in reversed((previous_child_messages or [])[-6:]):
        found = arithmetic_answers(text)
        if found:
            return found
    return []


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


def _numbers_in(text: str) -> list[Fraction | float]:
    """Numbers and fractions written in a label (« 12 », « 2,5 », « 7/12 »).

    Fractions stay exact; decimals are floats so that a rounded value
    (« 0,67 » for 2/3) is compared at the precision it is written.
    """
    out: list[Fraction | float] = []
    for a, b in re.findall(r"(\d+)\s*/\s*(\d+)", text or ""):
        if int(b):
            out.append(Fraction(int(a), int(b)))
    for n in re.findall(_NUM, text or ""):
        out.append(float(n.replace(",", ".")))
    return out


def _eq(x: Any, ans: Fraction) -> bool:
    """Does ``x`` show ``ans`` *at the precision it is written*?

    Exact for whole numbers; a rounded decimal counts as showing the answer
    (0,67 or 0,7 for 2/3), since the child reads it as the result.
    """
    if x is None:
        return False
    try:
        if isinstance(x, Fraction):
            return x == ans
        xf = float(x)
        af = float(ans)
    except (TypeError, ValueError):
        return False
    if abs(xf - af) < 1e-9:
        return True
    if xf.is_integer():
        return False
    # number of decimals as written (« 0.667 » → 3), capped at 6
    decimals = min(6, len(f"{xf:.6f}".rstrip("0").split(".")[1]))
    return round(af, decimals) == round(xf, decimals)


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


def _as_list(answer: Any) -> list[Fraction]:
    if answer is None:
        return []
    if isinstance(answer, list | tuple):
        return [a for a in answer if a is not None]
    return [answer]


def mask_answer(spec: dict[str, Any], answer: Any) -> dict[str, Any]:
    """Generated graduations keep their line but never write the sought value.

    Number line: its ticks. Chart: its y-axis ticks, computed by the renderer
    (the server does not know the axis range, so the value is always masked).
    """
    answers = _as_list(answer)
    if not answers:
        return spec
    if spec.get("kind") == "chart":
        return {**spec, "masked": [float(a) for a in answers]}
    if spec.get("kind") != "number_line":
        return spec
    inside = [float(a) for a in answers if spec["min"] <= float(a) <= spec["max"]]
    if not inside:
        return spec
    masked = {**spec, "masked": inside}
    # the accessible description follows the masking (bounds included)
    masked["alt"] = alt_text(masked)
    return masked


def enforce_no_answer(
    spec: dict[str, Any] | None,
    answer: Any,
    message_kind: str | None,
) -> tuple[dict[str, Any] | None, str | None]:
    """Apply the rule; returns (spec or None, reason when dropped).

    A « success » message may show the result: the spec is kept as is.
    """
    if spec is None or message_kind == "success":
        return spec, None
    answers = _as_list(answer)  # one or several sought values
    if any(reveals_answer(spec, a) for a in answers):
        return None, "reveals_answer"
    spec = mask_answer(spec, answers)
    # backstop: the text alternative (read aloud by screen readers) must not
    # spell out a sought value either
    alt_numbers = _numbers_in(spec.get("alt", ""))
    if any(_eq(x, a) for a in answers for x in alt_numbers):
        return None, "reveals_answer"
    return spec, None


def reveals_arithmetic_answer(spec: dict[str, Any], child_message: str) -> bool:
    """Backward-compatible helper: does the visual show the child's result?"""
    return reveals_answer(spec, arithmetic_answer(child_message))
