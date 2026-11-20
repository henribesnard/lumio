interface BadgeProps {
  variant?: "info" | "warning" | "critical" | "success";
  children: React.ReactNode;
}

const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  critical: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
};

/** Forme par variante : l'information ne repose jamais sur la seule couleur. */
const icons: Record<NonNullable<BadgeProps["variant"]>, string> = {
  info: "M12 8h.01M12 12v4",
  warning:
    "M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  critical: "M12 9v2m0 4h.01M12 3l10 18H2L12 3z",
  success: "M5 13l4 4L19 7",
};

export function Badge({ variant = "info", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-tiny font-medium ${styles[variant]}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={icons[variant]} />
      </svg>
      {children}
    </span>
  );
}
