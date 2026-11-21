/**
 * Illustrations des états vides (identité « Prisme ») : formes géométriques
 * simples aux couleurs du spectre, toujours décoratives (le texte de l'état
 * vide porte l'information). Couleurs 100 % tokens.
 */
export type IllustrationName =
  "conversations" | "alerts-clear" | "profiles" | "devices" | "notes" | "error";

export const ILLUSTRATIONS: IllustrationName[] = [
  "conversations",
  "alerts-clear",
  "profiles",
  "devices",
  "notes",
  "error",
];

const f = (n: string) => ({ fill: `var(${n})` });
const st = (n: string) => ({ stroke: `var(${n})` });
const PRISM_DARK =
  "M56 14 Q60 10 64 14 L100 86 Q104 96 94 96 H26 Q16 96 20 86 Z";
const PRISM_LIGHT = "M60 13 Q62 12 64 14 L100 86 Q104 96 94 96 H60 Z";

function Prism({
  x,
  y,
  s,
  calm = false,
}: {
  x: number;
  y: number;
  s: number;
  calm?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d={PRISM_DARK}
        style={f(calm ? "--color-mascot-calm" : "--color-mascot-body")}
      />
      <path
        d={PRISM_LIGHT}
        style={f(calm ? "--color-mascot-calm-soft" : "--color-mascot-head")}
      />
      <circle cx="50" cy="66" r="6" style={f("--color-mascot-wing")} />
      <circle cx="70" cy="66" r="6" style={f("--color-mascot-wing")} />
      <circle cx="51" cy="67" r="3" style={f("--color-mascot-face")} />
      <circle cx="71" cy="67" r="3" style={f("--color-mascot-face")} />
    </g>
  );
}

export function Illustration({
  name,
  size = 160,
}: {
  name: IllustrationName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={(size * 3) / 4}
      viewBox="0 0 160 120"
      aria-hidden="true"
    >
      <ellipse
        cx="80"
        cy="110"
        rx="56"
        ry="6"
        style={f("--color-surface-alt")}
      />
      {name === "conversations" && (
        <g>
          <rect
            x="88"
            y="14"
            width="56"
            height="30"
            rx="15"
            style={f("--color-question-bg")}
          />
          <rect
            x="88"
            y="14"
            width="56"
            height="30"
            rx="15"
            fill="none"
            strokeWidth="3"
            style={st("--color-question-ring")}
          />
          <text
            x="116"
            y="36"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontWeight="700"
            fontSize="18"
            style={f("--color-question-text")}
          >
            ?
          </text>
          <rect
            x="96"
            y="52"
            width="44"
            height="24"
            rx="12"
            style={f("--color-hint-bg")}
          />
          <rect
            x="96"
            y="52"
            width="44"
            height="24"
            rx="12"
            fill="none"
            strokeWidth="3"
            style={st("--color-hint-ring")}
          />
          <Prism x={10} y={14} s={0.85} />
        </g>
      )}
      {name === "alerts-clear" && (
        <g>
          <Prism x={30} y={12} s={0.85} calm />
          <circle cx="122" cy="36" r="18" style={f("--color-success-bg")} />
          <path
            d="M113 36 l6 6 l12 -12"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={st("--color-success")}
          />
        </g>
      )}
      {name === "profiles" && (
        <g>
          <circle cx="44" cy="62" r="24" style={f("--color-ray-sun")} />
          <path d="M44 46 L57 70 H31 Z" style={f("--color-foreground")} />
          <circle cx="80" cy="54" r="28" style={f("--color-ray-sky")} />
          <rect
            x="68"
            y="42"
            width="24"
            height="24"
            rx="4"
            transform="rotate(12 80 54)"
            style={f("--color-foreground")}
          />
          <circle cx="118" cy="62" r="24" style={f("--color-ray-mint")} />
          <circle cx="118" cy="62" r="10" style={f("--color-foreground")} />
        </g>
      )}
      {name === "devices" && (
        <g>
          <rect
            x="34"
            y="16"
            width="92"
            height="84"
            rx="12"
            style={f("--color-surface")}
          />
          <rect
            x="34"
            y="16"
            width="92"
            height="84"
            rx="12"
            fill="none"
            strokeWidth="4"
            style={st("--color-foreground")}
          />
          <Prism x={50} y={26} s={0.5} />
          <circle cx="80" cy="92" r="3" style={f("--color-foreground")} />
        </g>
      )}
      {name === "notes" && (
        <g>
          <rect
            x="40"
            y="10"
            width="80"
            height="94"
            rx="10"
            style={f("--color-sheet")}
          />
          <rect
            x="40"
            y="10"
            width="80"
            height="94"
            rx="10"
            fill="none"
            strokeWidth="3"
            style={st("--color-border-subtle")}
          />
          <g strokeWidth="5" strokeLinecap="round">
            <path d="M54 32 H104" style={st("--color-ray-sun")} />
            <path d="M54 50 H96" style={st("--color-ray-mint")} />
            <path d="M54 68 H100" style={st("--color-ray-sky")} />
            <path d="M54 86 H82" style={st("--color-border-subtle")} />
          </g>
        </g>
      )}
      {name === "error" && (
        <g>
          <g transform="translate(30 12) scale(0.85)">
            <path d={PRISM_DARK} style={f("--color-mascot-dim")} />
            <path d={PRISM_LIGHT} style={f("--color-mascot-dim-soft")} />
            <path
              d="M43 67 H57 M63 67 H77"
              strokeWidth="4"
              strokeLinecap="round"
              style={st("--color-mascot-wing")}
            />
          </g>
          <text
            x="124"
            y="40"
            fontFamily="var(--font-display)"
            fontWeight="800"
            fontSize="22"
            style={f("--color-mascot-body")}
          >
            z
          </text>
        </g>
      )}
    </svg>
  );
}
