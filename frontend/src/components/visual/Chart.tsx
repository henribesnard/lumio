import type { ChartVisual } from "@/api/types";
import { C, FONT, UnknownBox, fmt } from "./shared";

const W = 640;
const H = 300;
const L = 56;
const R = 20;
const T = 20;
const B = 50;
const COLORS = [C.prism, C.sky, C.hint];
const DASH = [undefined, "10 6", "2 7"];

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/** Graphique en barres ou courbe ; une valeur null = « ? » à trouver. */
export function Chart({ spec }: { spec: ChartVisual }) {
  const all = spec.series.flatMap((s) => s.values.filter((v) => v !== null));
  const minV = Math.min(0, ...(all as number[]));
  const maxV = niceMax(Math.max(1, ...(all as number[])) * 1.1);
  const y = (v: number) => T + (1 - (v - minV) / (maxV - minV)) * (H - T - B);
  const n = spec.x_labels.length;
  const slot = (W - L - R) / n;
  const cx = (i: number) => L + slot * i + slot / 2;
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => minV + f * (maxV - minV));
  // Valeur cherchée : la ligne de l'axe reste, son nombre n'est jamais écrit
  // (comparaison à la précision d'affichage, arrondi au centième).
  const isMasked = (t: number) =>
    (spec.masked ?? []).some(
      (m) => Math.abs(Math.round(t * 100) / 100 - m) < 0.005,
    );
  const ns = spec.series.length;
  const bw = Math.min(46, (slot * 0.7) / ns);
  return (
    <svg
      viewBox={`0 0 ${W} ${H + (ns > 1 ? 26 : 0)}`}
      width="100%"
      aria-hidden="true"
    >
      {ticks.map((t, i) => (
        <g key={i}>
          <path
            d={`M${L} ${y(t)} H${W - R}`}
            style={{ stroke: C.grid }}
            strokeWidth={1.5}
          />
          {!isMasked(t) && (
            <text
              x={L - 8}
              y={y(t) + 5}
              textAnchor="end"
              fontFamily={FONT}
              fontSize={15}
              style={{ fill: C.muted }}
            >
              {fmt(Math.round(t * 100) / 100)}
            </text>
          )}
        </g>
      ))}
      <path
        d={`M${L} ${T - 6} V${y(minV)} H${W - R}`}
        fill="none"
        style={{ stroke: C.ink }}
        strokeWidth={2.5}
      />
      {spec.x_labels.map((lab, i) => (
        <text
          key={i}
          x={cx(i)}
          y={H - B + 24}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={16}
          style={{ fill: C.ink }}
        >
          {lab}
        </text>
      ))}
      {spec.chart_type === "bar"
        ? spec.series.map((s, si) =>
            s.values.map((v, i) => {
              const bx = cx(i) - (ns * bw) / 2 + si * bw;
              if (v === null) {
                const top = y(maxV * 0.6);
                return (
                  <g key={`${si}-${i}`}>
                    <rect
                      x={bx + 2}
                      y={top}
                      width={bw - 4}
                      height={y(minV) - top}
                      rx={4}
                      style={{ fill: C.sunBg, stroke: C.sun }}
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                    />
                    <UnknownBox
                      x={bx + bw / 2}
                      y={(top + y(minV)) / 2}
                      w={Math.min(40, bw - 8)}
                    />
                  </g>
                );
              }
              return (
                <rect
                  key={`${si}-${i}`}
                  x={bx + 2}
                  y={Math.min(y(v), y(0))}
                  width={bw - 4}
                  height={Math.abs(y(0) - y(v))}
                  rx={4}
                  style={{ fill: COLORS[si] }}
                />
              );
            }),
          )
        : spec.series.map((s, si) => {
            const pts = s.values.map((v, i) =>
              v === null ? null : `${cx(i)},${y(v)}`,
            );
            const segs: string[][] = [[]];
            pts.forEach((p) =>
              p ? segs[segs.length - 1].push(p) : segs.push([]),
            );
            return (
              <g key={si}>
                {segs
                  .filter((sg) => sg.length > 1)
                  .map((sg, k) => (
                    <polyline
                      key={k}
                      points={sg.join(" ")}
                      fill="none"
                      style={{ stroke: COLORS[si] }}
                      strokeWidth={4}
                      strokeLinejoin="round"
                      strokeDasharray={DASH[si]}
                    />
                  ))}
                {s.values.map((v, i) =>
                  v === null ? (
                    <UnknownBox key={i} x={cx(i)} y={y(maxV * 0.5)} />
                  ) : (
                    <circle
                      key={i}
                      cx={cx(i)}
                      cy={y(v)}
                      r={5}
                      style={{ fill: COLORS[si] }}
                    />
                  ),
                )}
              </g>
            );
          })}
      {ns > 1 &&
        spec.series.map((s, si) => (
          <g key={`lg${si}`} transform={`translate(${L + si * 170} ${H + 12})`}>
            <path
              d="M0 0 H26"
              style={{ stroke: COLORS[si] }}
              strokeWidth={4}
              strokeDasharray={DASH[si]}
            />
            <text
              x={34}
              y={5}
              fontFamily={FONT}
              fontSize={16}
              style={{ fill: C.ink }}
            >
              {s.name}
            </text>
          </g>
        ))}
    </svg>
  );
}
