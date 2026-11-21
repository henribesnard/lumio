import type { TimelineVisual } from "@/api/types";
import { C, FONT, UnknownBox } from "./shared";

const W = 640;
const PAD = 60;
const AXIS_Y = 110;

/**
 * Frise chronologique. Années connues : positions proportionnelles ; si une
 * date est à trouver, les événements sont répartis dans l'ordre donné.
 */
export function Timeline({ spec }: { spec: TimelineVisual }) {
  const ev = spec.events;
  const allKnown = ev.every((e) => e.year !== null && e.year !== undefined);
  const years = ev.map((e) => e.year ?? 0);
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  const x = (i: number) =>
    allKnown && hi > lo
      ? PAD + ((years[i] - lo) / (hi - lo)) * (W - 2 * PAD)
      : PAD + (i / Math.max(1, ev.length - 1)) * (W - 2 * PAD);
  return (
    <svg viewBox={`0 0 ${W} 190`} width="100%" aria-hidden="true">
      <path
        d={`M20 ${AXIS_Y} H${W - 20}`}
        style={{ stroke: C.ink }}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {ev.map((e, i) => {
        const unknown = e.year === null || e.year === undefined;
        return (
          <g key={i}>
            <circle
              cx={x(i)}
              cy={AXIS_Y}
              r={9}
              style={
                unknown ? { fill: C.paper, stroke: C.sun } : { fill: C.prism }
              }
              strokeWidth={3}
            />
            {unknown ? (
              <UnknownBox x={x(i)} y={AXIS_Y - 40} w={56} />
            ) : (
              <text
                x={x(i)}
                y={AXIS_Y - 26}
                textAnchor="middle"
                fontFamily={FONT}
                fontWeight={700}
                fontSize={17}
                style={{ fill: C.ink }}
              >
                {e.year}
              </text>
            )}
            <text
              x={x(i)}
              y={AXIS_Y + 34}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={16}
              style={{ fill: C.ink }}
            >
              {e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
