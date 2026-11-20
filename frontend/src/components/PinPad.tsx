import { useCallback } from "react";

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  error?: string;
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
}: PinPadProps) {
  const handlePress = useCallback(
    (key: string) => {
      if (disabled) return;
      if (key === "back") {
        onChange(value.slice(0, -1));
      } else if (value.length < maxLength) {
        onChange(value + key);
      }
    },
    [disabled, value, maxLength, onChange],
  );

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
            className={[
              "w-4 h-4 rounded-full transition-colors duration-150",
              i < value.length ? "bg-primary" : "bg-border",
              error ? "bg-danger" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-small text-danger" role="alert">
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
                disabled={disabled || value.length === 0}
                onClick={() => handlePress("back")}
                aria-label="Effacer"
                className={[
                  "flex items-center justify-center min-w-touch min-h-touch",
                  "rounded-button bg-surface-alt text-foreground",
                  "text-body font-medium transition-colors duration-150",
                  "hover:bg-border focus:outline-none focus:ring-2 focus:ring-primary/50",
                  disabled || value.length === 0
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
              disabled={disabled}
              onClick={() => handlePress(key)}
              aria-label={key}
              className={[
                "flex items-center justify-center min-w-touch min-h-touch",
                "rounded-button bg-surface text-foreground border border-border",
                "text-subheading font-medium transition-colors duration-150",
                "hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/50",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
