import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover focus:outline-none focus-visible:shadow-focus",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-alt active:bg-primary-light focus:outline-none focus-visible:shadow-focus",
  danger:
    "bg-danger text-on-danger hover:opacity-90 active:opacity-80 focus:outline-none focus-visible:shadow-focus",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-alt active:bg-primary-light focus:outline-none focus-visible:shadow-focus",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-small px-3 py-1.5 min-h-[var(--size-touch-target)]",
  md: "text-body px-4 py-2 min-h-[var(--size-touch-target)]",
  lg: "text-subheading px-6 py-3 min-h-[var(--size-touch-target)]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center gap-2 font-sans font-medium",
        "rounded-button transition-colors duration-fast ease-out",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer active:scale-[0.98]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-[var(--size-icon)] w-[var(--size-icon)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
