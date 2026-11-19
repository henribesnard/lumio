import { Avatar } from "./Avatar";

interface ProfileCardProps {
  prenom: string;
  avatar: string;
  status?: "active" | "locked" | "inactive";
  onClick?: () => void;
}

export function ProfileCard({ prenom, avatar, status = "active", onClick }: ProfileCardProps) {
  const locked = status === "locked";
  const inactive = status === "inactive";
  return (
    <button
      onClick={onClick}
      disabled={inactive}
      aria-disabled={inactive || undefined}
      className={[
        "flex flex-col items-center gap-2 rounded-card bg-surface p-6 shadow-card",
        "transition-all duration-fast ease-out focus:outline-none focus-visible:shadow-focus",
        "min-h-[var(--size-touch-target)]",
        inactive
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:shadow-modal hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        locked ? "ring-2 ring-warning" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Avatar avatarKey={avatar} size="lg" alt={prenom} className={inactive ? "grayscale" : ""} />
      <span className="text-subheading font-semibold text-foreground">{prenom}</span>
      {locked && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-tiny font-medium text-warning">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Verrouillé
        </span>
      )}
      {inactive && (
        <span className="rounded-full bg-foreground-muted/10 px-2.5 py-0.5 text-tiny font-medium text-foreground-muted">
          Désactivé
        </span>
      )}
    </button>
  );
}
