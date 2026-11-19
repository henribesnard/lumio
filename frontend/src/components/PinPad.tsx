import { useCallback } from "react";

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "back"],
] as const;

export function PinPad({
  value,
  onChange,
  maxLength = 4,
  disabled = false,
  error,
  loading = false,
}: PinPadProps) {
  const handlePress = useCallback(
    (key: string) => {
      if (disabled || loading) return;
      if (key === "back") {
        onChange(value.slice(0, -1));
      } else if (value.length < maxLength) {
        onChange(value + key);
      }
    },
    [disabled, loading, value, maxLength, onChange]
  );

  const isDisabled = disabled || loading;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dots */}
      <div
        className="flex gap-3"
        role="status"
        aria-label={`${value.length} sur ${maxLength} chiffres saisis`}
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={[
              "rounded-full transition-colors duration-fast ease-out",
              "w-[var(--size-pin-dot)] h-[var(--size-pin-dot)] border-2",
              i < value.length
                ? error
                  ? "bg-danger border-danger"
                  : "bg-primary border-primary"
                : "bg-transparent border-border",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-small text-danger flex items-center gap-1" role="alert">
          <svg viewBox="0 0 24 24" className="h-[var(--size-icon)] w-[var(--size-icon)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          {error}
        </p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.flat().map((key, i) => {
          if (key === "") {
            return <div key={i} className="min-w-touch min-h-touch" />;
          }

          if (key === "back") {
            return (
              <button
                key={i}
                type="button"
                disabled={isDisabled || value.length === 0}
                onClick={() => handlePress("back")}
                aria-label="Effacer le dernier chiffre"
                className={[
                  "flex items-center justify-center min-w-touch min-h-touch",
                  "rounded-button bg-surface-alt text-foreground border border-border",
                  "text-body font-medium transition-colors duration-fast ease-out",
                  "hover:bg-surface active:bg-primary-light focus:outline-none",
                  isDisabled || value.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer",
                ].join(" ")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            );
          }

          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled || value.length >= maxLength}
              onClick={() => handlePress(key)}
              aria-label={key}
              className={[
                "flex items-center justify-center min-w-touch min-h-touch",
                "rounded-button bg-surface text-foreground border border-border shadow-card",
                "text-subheading font-semibold transition-all duration-fast ease-out",
                "hover:bg-surface-alt hover:-translate-y-0.5 active:bg-primary-light active:translate-y-0",
                "focus:outline-none",
                isDisabled || value.length >= maxLength
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer",
              ].join(" ")}
            >
              {loading && value.length >= maxLength ? (
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                key
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
