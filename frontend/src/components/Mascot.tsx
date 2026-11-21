/**
 * Lumio, le prisme — mascotte, 6 états :
 * ecoute / reflechit / indice / bravo (« se réjouit ») / pause / reconfort.
 * SVG inline (viewBox 0 0 120 120) repris du design « Prisme » ; couleurs via
 * les tokens --color-mascot-* et --color-ray-* pour suivre le thème.
 * Règles : le prisme ne s'irise (rayons du spectre) qu'au moment du déclic
 * (« bravo ») ; en « reconfort » : couleurs désaturées, aucun rayon, aucune
 * animation. Asset statique de référence : public/brand/mascot.svg.
 */
export type MascotState =
  "ecoute" | "reflechit" | "indice" | "bravo" | "pause" | "reconfort";

export const MASCOT_STATES: MascotState[] = [
  "ecoute",
  "reflechit",
  "indice",
  "bravo",
  "pause",
  "reconfort",
];

export const MASCOT_LABEL: Record<MascotState, string> = {
  ecoute: "Écoute",
  reflechit: "Réfléchit",
  indice: "Indice",
  bravo: "Se réjouit",
  pause: "Pause",
  reconfort: "Réconfort",
};

interface MascotProps {
  state: MascotState;
  size?: number;
  className?: string;
  /** animation des rayons (désactivée si prefers-reduced-motion et en réconfort) */
  animated?: boolean;
  /** texte alternatif ; vide = décoratif (aria-hidden) */
  label?: string;
}

const PRISM_DARK =
  "M56 14 Q60 10 64 14 L100 86 Q104 96 94 96 H26 Q16 96 20 86 Z";
const PRISM_LIGHT = "M60 13 Q62 12 64 14 L100 86 Q104 96 94 96 H60 Z";

const v = (name: string) => ({ fill: `var(${name})` });
const s = (name: string) => ({ stroke: `var(${name})` });

export function Mascot({
  state,
  size = 96,
  className = "",
  animated = true,
  label,
}: MascotProps) {
  const alt = label ?? `Lumio, ${MASCOT_LABEL[state].toLowerCase()}`;
  const body =
    state === "pause"
      ? "--color-mascot-dim"
      : state === "reconfort"
        ? "--color-mascot-calm"
        : "--color-mascot-body";
  const head =
    state === "pause"
      ? "--color-mascot-dim-soft"
      : state === "reconfort"
        ? "--color-mascot-calm-soft"
        : "--color-mascot-head";
  const tilt = state === "reflechit" ? "rotate(-6 60 60)" : undefined;
  const a11y =
    alt === ""
      ? { "aria-hidden": true as const }
      : { role: "img", "aria-label": alt };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      {...a11y}
    >
      {/* rayons */}
      {state === "indice" && (
        <path
          d="M98 64 L118 64"
          style={s("--color-ray-mint")}
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {state === "bravo" && (
        <g
          strokeWidth="6"
          strokeLinecap="round"
          className={animated ? "prism-rays" : undefined}
        >
          <path d="M96 54 L116 44" style={s("--color-ray-sun")} />
          <path d="M100 64 L118 64" style={s("--color-ray-mint")} />
          <path d="M96 74 L116 84" style={s("--color-ray-sky")} />
          <path d="M24 54 L4 44" style={s("--color-ray-coral")} />
        </g>
      )}

      {/* prisme */}
      <path d={PRISM_DARK} style={v(body)} transform={tilt} />
      <path d={PRISM_LIGHT} style={v(head)} transform={tilt} />

      {/* visage */}
      {state === "ecoute" && (
        <g>
          <Eyes px={50} py={67} />
          <Mouth d="M53 80 Q60 85 67 80" />
        </g>
      )}
      {state === "reflechit" && (
        <g>
          <circle cx="48" cy="66" r="7" style={v("--color-mascot-wing")} />
          <circle cx="68" cy="64" r="7" style={v("--color-mascot-wing")} />
          <circle cx="50" cy="63" r="3.5" style={v("--color-mascot-face")} />
          <circle cx="70" cy="61" r="3.5" style={v("--color-mascot-face")} />
          <path
            d="M53 81 H64"
            style={s("--color-mascot-wing")}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="98" cy="22" r="4" style={v("--color-mascot-body")} />
          <circle cx="108" cy="12" r="5" style={v("--color-mascot-body")} />
        </g>
      )}
      {state === "indice" && (
        <g>
          <Eyes px={52} py={66} />
          <circle cx="60" cy="82" r="4" style={v("--color-mascot-wing")} />
        </g>
      )}
      {state === "bravo" && (
        <g>
          <Mouth d="M43 67 Q50 59 57 67" w={4} />
          <Mouth d="M63 67 Q70 59 77 67" w={4} />
          <path d="M50 76 Q60 90 70 76 Z" style={v("--color-mascot-wing")} />
        </g>
      )}
      {state === "pause" && (
        <g>
          <Mouth d="M43 67 H57" w={4} />
          <Mouth d="M63 67 H77" w={4} />
          <Mouth d="M55 81 Q60 84 65 81" />
          <text
            x="94"
            y="28"
            fontFamily="var(--font-display)"
            fontWeight="800"
            fontSize="20"
            style={v("--color-mascot-body")}
          >
            z
          </text>
        </g>
      )}
      {state === "reconfort" && (
        <g>
          <Mouth d="M43 65 Q50 71 57 65" w={4} />
          <Mouth d="M63 65 Q70 71 77 65" w={4} />
          <Mouth d="M55 81 Q60 83 65 81" />
        </g>
      )}
    </svg>
  );
}

function Eyes({ px, py }: { px: number; py: number }) {
  return (
    <g>
      <circle cx="50" cy="66" r="7" style={v("--color-mascot-wing")} />
      <circle cx="70" cy="66" r="7" style={v("--color-mascot-wing")} />
      <circle cx={px} cy={py} r="3.5" style={v("--color-mascot-face")} />
      <circle cx={px + 20} cy={py} r="3.5" style={v("--color-mascot-face")} />
    </g>
  );
}

function Mouth({ d, w = 3.5 }: { d: string; w?: number }) {
  return (
    <path
      d={d}
      fill="none"
      style={s("--color-mascot-wing")}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
}
