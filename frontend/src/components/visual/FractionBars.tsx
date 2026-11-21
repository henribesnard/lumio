import type { FractionBarsVisual } from "@/api/types";
import { C, Label } from "./shared";

const W = 640;
const LEFT = 120;
const BAR_H = 46;
const GAP = 26;

/** Barres découpées en parts égales, parts coloriées (connues ou ajoutées par l'indice). */
export function FractionBars({ spec }: { spec: FractionBarsVisual }) {
  const H = spec.bars.length * (BAR_H + GAP) + 10;
  const bw = W - LEFT - 20;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true">
      {spec.bars.map((bar, r) => {
        const y = 10 + r * (BAR_H + GAP);
        const cw = bw / bar.parts;
        const hint = bar.layer === "hint";
        return (
          <g key={r}>
            {bar.label && (
              <Label
                x={LEFT - 16}
                y={y + BAR_H / 2 + 6}
                text={bar.label}
                anchor="end"
                weight={700}
                size={17}
              />
            )}
            {Array.from({ length: bar.parts }).map((_, i) => (
              <rect
                key={i}
                x={LEFT + i * cw}
                y={y}
                width={cw}
                height={BAR_H}
                style={{
                  fill:
                    i < bar.shaded ? (hint ? C.hintSoft : C.prism) : C.paper,
                  stroke: C.ink,
                }}
                strokeWidth={2.5}
              />
            ))}
            {hint &&
              Array.from({ length: bar.shaded }).map((_, i) => (
                <rect
                  key={`h${i}`}
                  x={LEFT + i * cw + 4}
                  y={y + 4}
                  width={cw - 8}
                  height={BAR_H - 8}
                  fill="none"
                  style={{ stroke: C.hint }}
                  strokeWidth={3}
                  strokeDasharray="2 7"
                />
              ))}
          </g>
        );
      })}
    </svg>
  );
}
