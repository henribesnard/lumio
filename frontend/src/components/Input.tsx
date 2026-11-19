import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, disabled, className = "", id: externalId, ...rest },
  ref
) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-small font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={[
          "w-full rounded-input border border-border bg-surface px-3 py-2",
          "text-body text-foreground placeholder:text-foreground-muted",
          "min-h-[var(--size-touch-target)]",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "transition-colors duration-150",
          error ? "border-danger focus:ring-danger/50 focus:border-danger" : "",
          disabled ? "opacity-50 cursor-not-allowed bg-surface-alt" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-small text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
