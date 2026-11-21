import type { ShapeVisual } from "@/api/types";
import { C, Label } from "./shared";

const W = 640;
const H = 360;

/** Figure simple (rectangle, triangle rectangle, cercle) avec cotes. */
export function Shape({ spec }: { spec: ShapeVisual }) {
  if (spec.figure === "circle") {
    const r = 120;
    const cx = 220;
    const cy = 180;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          style={{ fill: C.prismSoft, stroke: C.prism }}
          strokeWidth={4}
        />
        <circle cx={cx} cy={cy} r={4} style={{ fill: C.ink }} />
        <path
          d={`M${cx} ${cy} H${cx + r}`}
          style={{ stroke: C.ink }}
          strokeWidth={3}
        />
        {spec.radius_label && (
          <Label
            x={cx + r / 2}
            y={cy - 14}
            text={spec.radius_label}
            weight={700}
          />
        )}
        {spec.inside_label && (
          <Label
            x={cx + r + 120}
            y={cy + 6}
            text={spec.inside_label}
            weight={700}
          />
        )}
      </svg>
    );
  }
  const w0 = spec.width ?? 1;
  const h0 = spec.height ?? 1;
  const scale = Math.min(420 / w0, 260 / h0);
  const w = w0 * scale;
  const h = h0 * scale;
  const x0 = 40;
  const y0 = 30;
  const x1 = x0 + w;
  const y1 = y0 + h;
  const gridLines = [];
  if (spec.grid) {
    for (let i = 1; i < w0; i++)
      gridLines.push(`M${x0 + i * scale} ${y0} V${y1}`);
    for (let j = 1; j < h0; j++)
      gridLines.push(`M${x0} ${y0 + j * scale} H${x1}`);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%" aria-hidden="true">
      {gridLines.length > 0 && (
        <path
          d={gridLines.join(" ")}
          style={{ stroke: C.grid }}
          strokeWidth={1.5}
        />
      )}
      {spec.figure === "rectangle" ? (
        <rect
          x={x0}
          y={y0}
          width={w}
          height={h}
          style={{ fill: C.prismSoft, stroke: C.prism }}
          strokeWidth={4}
        />
      ) : (
        <>
          <path
            d={`M${x0} ${y1} L${x1} ${y1} L${x1} ${y0} Z`}
            style={{ fill: C.prismSoft, stroke: C.prism }}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <path
            d={`M${x1 - 20} ${y1} V${y1 - 20} H${x1}`}
            fill="none"
            style={{ stroke: C.prism }}
            strokeWidth={2.5}
          />
          {spec.twin && (
            <path
              d={`M${x0} ${y1} L${x0} ${y0} L${x1} ${y0} Z`}
              style={{ fill: C.hintSoft, stroke: C.hint }}
              strokeWidth={4}
              strokeDasharray="10 8"
              strokeLinejoin="round"
            />
          )}
        </>
      )}
      {spec.base_label && (
        <g>
          <path
            d={`M${x0} ${y1 + 22} H${x1} M${x0} ${y1 + 14} V${y1 + 30} M${x1} ${y1 + 14} V${y1 + 30}`}
            style={{ stroke: C.ink }}
            strokeWidth={2}
          />
          <Label
            x={(x0 + x1) / 2}
            y={y1 + 50}
            text={spec.base_label}
            weight={700}
          />
        </g>
      )}
      {spec.height_label && (
        <g>
          <path
            d={`M${x1 + 22} ${y0} V${y1} M${x1 + 14} ${y0} H${x1 + 30} M${x1 + 14} ${y1} H${x1 + 30}`}
            style={{ stroke: C.ink }}
            strokeWidth={2}
          />
          <Label
            x={x1 + 40}
            y={(y0 + y1) / 2 + 5}
            text={spec.height_label}
            anchor="start"
            weight={700}
          />
        </g>
      )}
      {spec.inside_label && (
        <Label
          x={spec.figure === "triangle" ? x0 + w * 0.68 : (x0 + x1) / 2}
          y={spec.figure === "triangle" ? y0 + h * 0.75 : (y0 + y1) / 2 + 5}
          text={spec.inside_label}
          weight={700}
          color={C.prism}
        />
      )}
    </svg>
  );
}
