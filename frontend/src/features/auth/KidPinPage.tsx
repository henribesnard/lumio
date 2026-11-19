import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ApiError } from "@/api/client";

export function KidPinPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const { kidLogin } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleDigit(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      if (newPin.length === 4) {
        submitPin(newPin);
      }
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  async function submitPin(code: string) {
    if (!profileId) return;
    setLoading(true);
    try {
      await kidLogin(profileId, code);
      navigate("/chat", { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      setPin("");
      setError(apiErr?.error?.message || "Code incorrect.");
    } finally {
      setLoading(false);
    }
  }

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <button
        onClick={() => navigate("/select")}
        className="mb-8 text-small text-foreground-muted hover:text-foreground"
      >
        ← Retour
      </button>

      <h1 className="mb-6 text-heading font-bold text-foreground">
        Entre ton code secret
      </h1>

      {/* PIN dots */}
      <div className="mb-8 flex gap-4">
        {dots.map((filled, i) => (
          <div
            key={i}
            className={`h-5 w-5 rounded-full border-2 transition-colors ${
              filled
                ? "border-primary bg-primary"
                : "border-border bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-input bg-danger/10 px-4 py-2 text-small text-danger">
          {error}
        </div>
      )}

      {/* Number pad */}
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {digits.map((digit, i) => {
          if (digit === "") return <div key={i} />;
          if (digit === "←") {
            return (
              <button
                key={i}
                onClick={handleBackspace}
                disabled={loading || pin.length === 0}
                className="flex items-center justify-center rounded-button bg-surface-alt text-heading font-medium text-foreground shadow-card transition-colors hover:bg-border active:bg-primary-light disabled:opacity-30"
                style={{ minHeight: "var(--size-touch-target)" }}
              >
                ←
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(digit)}
              disabled={loading || pin.length >= 4}
              className="flex items-center justify-center rounded-button bg-surface text-heading font-medium text-foreground shadow-card transition-colors hover:bg-surface-alt active:bg-primary-light disabled:opacity-30"
              style={{ minHeight: "var(--size-touch-target)" }}
            >
              {digit}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="mt-6 text-body text-foreground-muted">
          Vérification...
        </div>
      )}
    </div>
  );
}
