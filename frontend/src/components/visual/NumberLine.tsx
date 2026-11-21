import type { NumberLineVisual } from "@/api/types";
import { C, FONT, Label, fmt, layerStroke } from "./shared";

const W = 640;
const PAD = 30;
const AXIS_Y = 120;

/** Droite graduée : graduations, repères, sauts (connus / ajoutés par l'indice). */
export function NumberLine({ spec }: { spec: NumberLineVisual }) {
  const span = spec.max - spec.min;
  const x = (v: number) => PAD + ((v - spec.min) / span) * (W - 2 * PAD);
  const ticks: number[] = [];
  for (let v = spec.min; v <= spec.max + 1e-9; v += spec.step)
    ticks.push(Math.round(v * 1e6) / 1e6);
  const marks = spec.marks ?? [];
  const markValues = new Set(marks.map((m) => m.value));
  // Valeur cherchée : le trait reste, son nombre n'est jamais écrit.
  // Comparaison à la précision d'affichage : les graduations sont arrondies
  // au millionième (pas fractionnaire : 2/3 → 0,666667).
  const isMasked = (v: number) =>
    (spec.masked ?? []).some((m) => Math.abs(m - v) < 1e-6);
  const labelEvery = ticks.length > 21 ? 5 : ticks.length > 11 ? 5 : 1;
  return (
    <svg viewBox={`0 0 ${W} 170`} width="100%" aria-hidden="true">
      <path
        d={`M${PAD - 18} ${AXIS_Y} H${W - PAD + 18}`}
        style={{ stroke: C.ink }}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {ticks.map((t, i) => (
        <g key={i}>
          <path
            d={`M${x(t)} ${AXIS_Y - 8} V${AXIS_Y + 8}`}
            style={{ stroke: C.ink }}
            strokeWidth={2.5}
          />
          {!isMasked(t) &&
            (i % labelEvery === 0 ||
              i === ticks.length - 1 ||
              markValues.has(t)) && (
              <text
                x={x(t)}
                y={AXIS_Y + 30}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={17}
                fontWeight={markValues.has(t) ? 700 : 400}
                style={{ fill: C.ink }}
              >
                {fmt(t)}
              </text>
            )}
        </g>
      ))}
      {marks.map((m, i) => (
        <g key={`m${i}`}>
          <circle cx={x(m.value)} cy={AXIS_Y} r={6} style={{ fill: C.prism }} />
          {m.label && m.label !== fmt(m.value) && !isMasked(m.value) && (
            <Label x={x(m.value)} y={AXIS_Y + 52} text={m.label} />
          )}
        </g>
      ))}
      {(spec.jumps ?? []).map((j, i) => {
        const a = x(j.start);
        const b = x(j.end);
        const h = Math.min(70, 18 + Math.abs(b - a) * 0.35);
        const mid = (a + b) / 2;
        const hint = j.layer === "hint";
        return (
          <g key={`j${i}`}>
            <path
              d={`M${a} ${AXIS_Y - 6} Q${mid} ${AXIS_Y - 6 - h * 2} ${b} ${AXIS_Y - 6}`}
              fill="none"
              strokeWidth={4}
              strokeLinecap="round"
              style={layerStroke(j.layer)}
            />
            {j.label && (
              <Label
                x={mid}
                y={AXIS_Y - h - 14}
                text={j.label}
                weight={700}
                color={hint ? C.hintText : C.prism}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
