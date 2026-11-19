import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, disabled, className = "", id: externalId, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-small font-medium text-foreground">
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
          "w-full rounded-input border bg-surface px-3 py-2",
          "text-body text-foreground placeholder:text-foreground-muted",
          "min-h-[var(--size-touch-target)]",
          "transition-colors duration-fast ease-out focus:outline-none focus-visible:shadow-focus",
          error
            ? "border-danger focus:border-danger"
            : "border-border hover:border-foreground-muted focus:border-primary",
          disabled ? "opacity-50 cursor-not-allowed bg-surface-alt" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-small text-danger flex items-center gap-1" role="alert">
          <svg viewBox="0 0 24 24" className="h-[var(--size-icon)] w-[var(--size-icon)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});
