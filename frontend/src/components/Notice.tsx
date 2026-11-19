interface NoticeProps {
  variant?: "info" | "warning" | "success" | "error";
  children: React.ReactNode;
  onDismiss?: () => void;
}

const styles: Record<NonNullable<NoticeProps["variant"]>, string> = {
  info: "bg-info/10 text-info border-info/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  success: "bg-success/10 text-success border-success/30",
  error: "bg-danger/10 text-danger border-danger/30",
};

const icons: Record<NonNullable<NoticeProps["variant"]>, string> = {
  info: "M12 8h.01M12 12v4m9-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  warning: "M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  success: "M5 13l4 4L19 7",
  error: "M6 18L18 6M6 6l12 12",
};

export function Notice({ variant = "info", children, onDismiss }: NoticeProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-input border px-4 py-3 text-small ${styles[variant]}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-[var(--size-icon)] w-[var(--size-icon)] shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={icons[variant]} />
      </svg>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Fermer l'avis"
          className="ml-2 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
