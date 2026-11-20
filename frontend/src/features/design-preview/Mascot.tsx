/**
 * Prévisualisation des deux principes de mascotte (phase 1).
 * La version retenue sera retravaillée en phase 3 dans public/ + composant dédié.
 */

export type MascotState = "ecoute" | "reflechit" | "indice" | "bravo" | "pause";

const STATE_LABEL: Record<MascotState, string> = {
  ecoute: "Écoute",
  reflechit: "Réfléchit",
  indice: "Indice",
  bravo: "Bravo",
  pause: "Pause",
};

function Sparkle({
  x,
  y,
  s,
  fill,
}: {
  x: number;
  y: number;
  s: number;
  fill: string;
}) {
  const d = `M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`;
  return <path d={d} fill={fill} />;
}

/** Piste A — « Lumi la braise » : grosse goutte chaude avec halo. */
export function MascotA({
  state,
  size = 96,
}: {
  state: MascotState;
  size?: number;
}) {
  const dim = state === "pause";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Lumi, état ${STATE_LABEL[state]}`}
    >
      {/* halo */}
      {state === "ecoute" && (
        <circle
          className="dp-halo"
          cx="60"
          cy="60"
          r="53"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
        />
      )}
      {state === "bravo" && (
        <circle
          className="dp-halo"
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          opacity="0.7"
        />
      )}
      {/* ondes d'écoute */}
      {state === "ecoute" && (
        <g
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.8"
        >
          <path d="M13 52 q -7 10 0 20" />
          <path d="M107 52 q 7 10 0 20" />
        </g>
      )}
      {/* corps */}
      <g opacity={dim ? 0.45 : 1}>
        <path
          d="M60 20 C 80 20 94 36 94 60 C 94 84 79 98 60 98 C 41 98 26 84 26 60 C 26 36 40 20 60 20 Z"
          fill="var(--mascot-body)"
          stroke="var(--mascot-outline)"
          strokeWidth="3.5"
        />
        {/* visage */}
        <circle
          cx="47"
          cy={state === "reflechit" ? 54 : 58}
          r="5.5"
          fill="var(--mascot-face)"
        />
        <circle
          cx="73"
          cy={state === "reflechit" ? 54 : 58}
          r="5.5"
          fill="var(--mascot-face)"
        />
        {state === "bravo" ? (
          <path
            d="M45 70 Q 60 86 75 70"
            fill="none"
            stroke="var(--mascot-face)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        ) : state === "pause" ? (
          <path
            d="M50 78 h 20"
            stroke="var(--mascot-face)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M48 73 Q 60 83 72 73"
            fill="none"
            stroke="var(--mascot-face)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
      </g>
      {/* points de réflexion */}
      {state === "reflechit" && (
        <g fill="var(--mascot-outline)">
          <circle cx="86" cy="34" r="3.6" />
          <circle cx="95" cy="24" r="3" />
          <circle cx="102" cy="13" r="2.4" />
        </g>
      )}
      {/* étincelle indice */}
      {state === "indice" && (
        <Sparkle x={95} y={17} s={11} fill="var(--color-accent)" />
      )}
      {/* bravo : plusieurs étincelles */}
      {state === "bravo" && (
        <g>
          <Sparkle x={97} y={16} s={10} fill="var(--color-accent)" />
          <Sparkle x={24} y={24} s={7} fill="var(--color-accent)" />
          <Sparkle x={104} y={48} s={6} fill="var(--color-accent)" />
        </g>
      )}
      {/* pause : deux barres */}
      {state === "pause" && (
        <g fill="var(--mascot-face)">
          <rect x="49" y="46" width="7" height="26" rx="3.5" />
          <rect x="64" y="46" width="7" height="26" rx="3.5" />
        </g>
      )}
    </svg>
  );
}

/** Piste B — « Lumi la luciole » : luciole géométrique à queue lumineuse. */
export function MascotB({
  state,
  size = 96,
}: {
  state: MascotState;
  size?: number;
}) {
  const dim = state === "pause";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Lumi, état ${STATE_LABEL[state]}`}
    >
      {/* queue lumineuse */}
      {state !== "pause" && (
        <circle
          className="dp-halo"
          cx="60"
          cy="95"
          r="16"
          fill="var(--color-accent)"
          opacity="0.35"
        />
      )}
      <circle cx="60" cy="95" r="8" fill={dim ? "#98a5c0" : "#fbbf24"} />
      {/* ailes */}
      <g opacity={dim ? 0.4 : 0.9}>
        <ellipse
          cx="41"
          cy={state === "bravo" ? 48 : 58}
          rx="14"
          ry="8"
          fill="#c7d2fe"
          stroke="var(--mascot-outline)"
          strokeWidth="2"
          transform={`rotate(${state === "bravo" ? -48 : -28} 41 ${state === "bravo" ? 48 : 58})`}
        />
        <ellipse
          cx="79"
          cy={state === "bravo" ? 48 : 58}
          rx="14"
          ry="8"
          fill="#c7d2fe"
          stroke="var(--mascot-outline)"
          strokeWidth="2"
          transform={`rotate(${state === "bravo" ? 48 : 28} 79 ${state === "bravo" ? 48 : 58})`}
        />
      </g>
      {/* corps */}
      <ellipse
        cx="60"
        cy="68"
        rx="19"
        ry="24"
        fill="var(--mascot-body)"
        opacity={dim ? 0.45 : 1}
      />
      {/* tête */}
      <circle cx="60" cy="38" r="13" fill={dim ? "#6e7a94" : "#4338ca"} />
      {/* antennes */}
      <g
        stroke={dim ? "#6e7a94" : "#4338ca"}
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <line x1="54" y1="27" x2="48" y2="16" />
        <line x1="66" y1="27" x2="72" y2="16" />
      </g>
      <circle cx="48" cy="15" r="2.6" fill={dim ? "#6e7a94" : "#4338ca"} />
      <circle cx="72" cy="15" r="2.6" fill={dim ? "#6e7a94" : "#4338ca"} />
      {/* visage */}
      {state !== "pause" && (
        <g>
          <circle cx="55" cy="36" r="3.4" fill="#fff" />
          <circle cx="65" cy="36" r="3.4" fill="#fff" />
          <circle cx="55.8" cy="36.8" r="1.7" fill="var(--mascot-face)" />
          <circle cx="65.8" cy="36.8" r="1.7" fill="var(--mascot-face)" />
          {state === "bravo" ? (
            <path
              d="M53 43 Q 60 50 67 43"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M54 44 Q 60 49 66 44"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}
        </g>
      )}
      {/* ondes d'écoute */}
      {state === "ecoute" && (
        <g
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.8"
        >
          <path d="M28 32 q -6 8 0 16" />
          <path d="M92 32 q 6 8 0 16" />
        </g>
      )}
      {/* points de réflexion */}
      {state === "reflechit" && (
        <g fill="var(--color-primary)">
          <circle cx="60" cy="8" r="2.6" />
          <circle cx="52" cy="14" r="3" />
          <circle cx="68" cy="14" r="3" />
        </g>
      )}
      {/* étincelles */}
      {state === "indice" && (
        <Sparkle x={93} y={22} s={10} fill="var(--color-accent)" />
      )}
      {state === "bravo" && (
        <g>
          <Sparkle x={94} y={18} s={9} fill="var(--color-accent)" />
          <Sparkle x={26} y={26} s={6.5} fill="var(--color-accent)" />
        </g>
      )}
      {/* pause */}
      {state === "pause" && (
        <g fill="#1c2333">
          <rect x="50" y="52" width="6.5" height="24" rx="3.25" />
          <rect x="63.5" y="52" width="6.5" height="24" rx="3.25" />
        </g>
      )}
    </svg>
  );
}

export const MASCOT_STATES: MascotState[] = [
  "ecoute",
  "reflechit",
  "indice",
  "bravo",
  "pause",
];
