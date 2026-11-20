type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  avatarKey: string;
  size?: AvatarSize;
  alt?: string;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-[var(--size-avatar-sm)] h-[var(--size-avatar-sm)]",
  md: "w-[var(--size-avatar-md)] h-[var(--size-avatar-md)]",
  lg: "w-[var(--size-avatar-lg)] h-[var(--size-avatar-lg)]",
};

export function Avatar({
  avatarKey,
  size = "md",
  alt = "",
  className = "",
}: AvatarProps) {
  return (
    <img
      src={`/avatars/${avatarKey}.svg`}
      alt={alt}
      className={[
        "rounded-full object-cover shrink-0 ring-2 ring-border/40",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
