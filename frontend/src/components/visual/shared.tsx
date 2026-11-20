/**
 * Primitives partagées des dessins de la feuille. Toutes les couleurs viennent
 * des tokens --color-sheet-* (la feuille reste blanche dans tous les thèmes).
 * Calques : encre/prisme = ce qu'on sait ; menthe pointillé = ajouté par
 * l'indice ; soleil = case « ? » de l'enfant.
 */
import type { VisualLayer } from "@/api/types";

export const C = {
  ink: "var(--color-sheet-ink)",
  muted: "var(--color-sheet-muted)",
  grid: "var(--color-sheet-grid)",
  prism: "var(--color-sheet-prism)",
  prismSoft: "var(--color-sheet-prism-soft)",
  hint: "var(--color-sheet-hint)",
  hintText: "var(--color-sheet-hint-text)",
  hintSoft: "var(--color-sheet-hint-soft)",
  sky: "var(--color-sheet-sky)",
  skyText: "var(--color-sheet-sky-text)",
  sun: "var(--color-sheet-sun)",
  sunBg: "var(--color-sheet-sun-bg)",
  sunText: "var(--color-sheet-sun-text)",
  paper: "var(--color-sheet)",
};

export const FONT = "var(--font-sans)";
export const DISPLAY = "var(--font-display)";

export function layerStroke(layer?: VisualLayer) {
  return layer === "hint"
    ? { stroke: C.hint, strokeDasharray: "2 9" }
    : { stroke: C.prism };
}

export const isUnknown = (label?: string | null) =>
  !!label && label.trim() === "?";

/** Case « ? » de l'enfant (soleil, pointillé) centrée en (x, y). */
export function UnknownBox({
  x,
  y,
  w = 44,
  h = 34,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
}) {
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={8}
        style={{ fill: C.sunBg, stroke: C.sun }}
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />
      <text
        x={x}
        y={y + 7}
        textAnchor="middle"
        fontFamily={DISPLAY}
        fontWeight={700}
        fontSize={19}
        style={{ fill: C.sunText }}
      >
        ?
      </text>
    </g>
  );
}

/** Texte, ou case « ? » si l'étiquette vaut « ? ». */
export function Label({
  x,
  y,
  text,
  color = C.ink,
  anchor = "middle",
  weight = 500,
  size = 17,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  size?: number;
}) {
  if (isUnknown(text)) return <UnknownBox x={x} y={y - 5} />;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={FONT}
      fontWeight={weight}
      fontSize={size}
      style={{ fill: color }}
    >
      {text}
    </text>
  );
}

export function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}
