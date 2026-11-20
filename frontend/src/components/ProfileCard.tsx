import { Avatar } from "./Avatar";

interface ProfileCardProps {
  prenom: string;
  avatar: string;
  status?: "active" | "locked" | "inactive";
  onClick?: () => void;
}

export function ProfileCard({
  prenom,
  avatar,
  status = "active",
  onClick,
}: ProfileCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={status === "inactive"}
      className={`flex flex-col items-center gap-2 rounded-card bg-surface p-6 shadow-card transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 ${status === "locked" ? "ring-2 ring-warning" : ""}`}
    >
      <Avatar avatarKey={avatar} size="lg" />
      <span className="text-subheading font-semibold text-foreground">
        {prenom}
      </span>
      {status === "locked" && (
        <span className="text-tiny text-warning">Verrouillé</span>
      )}
    </button>
  );
}
