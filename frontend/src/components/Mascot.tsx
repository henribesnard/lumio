/**
 * Lumi la luciole — mascotte Lumio, 5 états : ecoute / reflechit / indice / bravo / pause.
 * SVG inline propre (viewBox 0 0 120 120) ; les couleurs passent par les
 * tokens CSS (--color-mascot-*) pour suivre le thème. Asset statique de
 * référence : public/brand/mascot.svg.
 */
export type MascotState = "ecoute" | "reflechit" | "indice" | "bravo" | "pause";

export const MASCOT_STATES: MascotState[] = ["ecoute", "reflechit", "indice", "bravo", "pause"];

const STATE_LABEL: Record<MascotState, string> = {
  ecoute: "Écoute",
  reflechit: "Réfléchit",
  indice: "Indice",
  bravo: "Bravo",
  pause: "Pause",
};

interface MascotProps {
  state: MascotState;
  size?: number;
  className?: string;
  /** halo animé (désactivé automatiquement si prefers-reduced-motion) */
  animated?: boolean;
}

export function Mascot({ state, size = 96, className = "", animated = true }: MascotProps) {
  const dim = state === "pause";
  const c = {
    body: "var(--color-mascot-body)",
    outline: "var(--color-mascot-outline)",
    glow: "var(--color-mascot-glow)",
    face: "var(--color-mascot-face)",
    wing: "var(--color-mascot-wing)",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Lumi, état ${STATE_LABEL[state]}`}
      className={className}
    >
      {/* halo de la queue */}
      {state !== "pause" && (
        <circle
          cx="60"
          cy="95"
          r="16"
          style={{ fill: c.glow, opacity: state === "bravo" ? 0.45 : 0.35 }}
          className={animated ? "mascot-halo" : undefined}
        />
      )}
      <circle cx="60" cy="95" r="8" style={{ fill: dim ? "var(--color-mascot-dim-soft)" : c.glow }} />

      {/* ailes */}
      <g opacity={dim ? 0.4 : 0.9}>
        <ellipse
          cx="41"
          cy={state === "bravo" ? 48 : 58}
          rx="14"
          ry="8"
          style={{ fill: c.wing, stroke: c.outline }}
          strokeWidth="2"
          transform={`rotate(${state === "bravo" ? -48 : -28} 41 ${state === "bravo" ? 48 : 58})`}
        />
        <ellipse
          cx="79"
          cy={state === "bravo" ? 48 : 58}
          rx="14"
          ry="8"
          style={{ fill: c.wing, stroke: c.outline }}
          strokeWidth="2"
          transform={`rotate(${state === "bravo" ? 48 : 28} 79 ${state === "bravo" ? 48 : 58})`}
        />
      </g>

      {/* corps + tête */}
      <ellipse cx="60" cy="68" rx="19" ry="24" style={{ fill: c.body, opacity: dim ? 0.45 : 1 }} />
      <circle cx="60" cy="38" r="13" style={{ fill: dim ? "var(--color-mascot-dim)" : "var(--color-mascot-head)" }} />
      <g stroke={dim ? "var(--color-mascot-dim)" : "var(--color-mascot-head)"} strokeWidth="2.5" strokeLinecap="round">
        <line x1="54" y1="27" x2="48" y2="16" />
        <line x1="66" y1="27" x2="72" y2="16" />
      </g>
      <circle cx="48" cy="15" r="2.6" style={{ fill: dim ? "var(--color-mascot-dim)" : "var(--color-mascot-head)" }} />
      <circle cx="72" cy="15" r="2.6" style={{ fill: dim ? "var(--color-mascot-dim)" : "var(--color-mascot-head)" }} />

      {/* visage */}
      {state !== "pause" ? (
        <g>
          <circle cx="55" cy="36" r="3.4" style={{ fill: "var(--color-on-dark)" }} />
          <circle cx="65" cy="36" r="3.4" style={{ fill: "var(--color-on-dark)" }} />
          <circle cx="55.8" cy="36.8" r="1.7" style={{ fill: c.face }} />
          <circle cx="65.8" cy="36.8" r="1.7" style={{ fill: c.face }} />
          <path
            d={state === "bravo" ? "M53 43 Q60 50 67 43" : "M54 44 Q60 49 66 44"}
            fill="none"
            style={{ stroke: "var(--color-on-dark)" }}
            strokeWidth={state === "bravo" ? 2.6 : 2.4}
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g style={{ fill: c.face }}>
          <rect x="50" y="52" width="6.5" height="24" rx="3.25" />
          <rect x="63.5" y="52" width="6.5" height="24" rx="3.25" />
        </g>
      )}

      {/* états */}
      {state === "ecoute" && (
        <g fill="none" stroke={c.body} strokeWidth="3.2" strokeLinecap="round" opacity="0.8">
          <path d="M28 32 q-6 8 0 16" />
          <path d="M92 32 q6 8 0 16" />
        </g>
      )}
      {state === "reflechit" && (
        <g style={{ fill: c.body }}>
          <circle cx="60" cy="6" r="2.6" />
          <circle cx="51" cy="12" r="3" />
          <circle cx="69" cy="12" r="3" />
        </g>
      )}
      {state === "indice" && <Sparkle x={95} y={20} s={10} color={c.glow} />}
      {state === "bravo" && (
        <g>
          <Sparkle x={96} y={16} s={9} color={c.glow} />
          <Sparkle x={24} y={24} s={6.5} color={c.glow} />
        </g>
      )}
    </svg>
  );
}

function Sparkle({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  const d = `M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`;
  return <path d={d} style={{ fill: color }} />;
}
