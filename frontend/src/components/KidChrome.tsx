/** Éléments d'habillage partagés des écrans enfant (design « Prisme »). */

export function ExitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[var(--size-icon)] w-[var(--size-icon)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[var(--size-icon)] w-[var(--size-icon)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.1em] w-[1.1em] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** « Tes parents peuvent lire tes conversations. » — toujours visible. */
export function ParentsNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-center justify-center gap-2 px-4 py-3 text-tiny text-foreground-muted ${className}`}
    >
      <EyeIcon />
      Tes parents peuvent lire tes conversations.
    </p>
  );
}

/** Marque prisme + rayons, inline (rail de navigation sombre 9-14). */
export function PrismMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Lumio"
    >
      <g strokeWidth="7" strokeLinecap="round">
        <path d="M96 54 L116 44" style={{ stroke: "var(--color-ray-sun)" }} />
        <path d="M100 64 L118 64" style={{ stroke: "var(--color-ray-mint)" }} />
        <path d="M96 74 L116 84" style={{ stroke: "var(--color-ray-sky)" }} />
      </g>
      <path
        d="M56 14 Q60 10 64 14 L100 86 Q104 96 94 96 H26 Q16 96 20 86 Z"
        style={{ fill: "var(--color-mascot-body)" }}
      />
      <path
        d="M60 13 Q62 12 64 14 L100 86 Q104 96 94 96 H60 Z"
        style={{ fill: "var(--color-mascot-head)" }}
      />
    </svg>
  );
}
