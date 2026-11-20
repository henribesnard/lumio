import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ApiError } from "@/api/client";
import { PinPad } from "@/components/PinPad";
import { Mascot } from "@/components/Mascot";

export function KidPinPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const { kidLogin } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitPin(code: string) {
    if (!profileId || loading) return;
    setLoading(true);
    setError("");
    setErrorCode("");
    try {
      await kidLogin(profileId, code);
      navigate("/chat", { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      setPin("");
      setError(apiErr?.error?.message || "Code incorrect.");
      setErrorCode(apiErr?.error?.code || "");
    } finally {
      setLoading(false);
    }
  }

  // Soumission automatique au 4e chiffre (comportement existant, inchangé)
  useEffect(() => {
    if (pin.length === 4 && !loading) {
      void submitPin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const locked = errorCode === "profile_locked";

  return (
    <div
      data-age="6-8"
      className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6"
    >
      <button
        onClick={() => navigate("/select")}
        className="absolute left-6 top-5 inline-flex min-h-[var(--size-touch-target)] items-center gap-2 rounded-full bg-surface py-2 pl-3 pr-5 text-body font-medium text-foreground shadow-card transition-colors duration-fast hover:bg-surface-alt focus:outline-none focus-visible:shadow-focus"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[var(--size-icon)] w-[var(--size-icon)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          aria-hidden="true"
        >
          <path
            d="M15 18l-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Retour
      </button>

      <Mascot
        state={loading ? "reflechit" : locked ? "pause" : "ecoute"}
        size={104}
        className="mb-4"
      />

      <h1 className="mb-1 text-center text-heading font-bold text-foreground">
        Entre ton code secret
      </h1>
      <p className="mb-8 text-center text-body text-foreground-muted">
        4 chiffres, personne ne les voit.
      </p>

      <PinPad
        value={pin}
        onChange={(v) => {
          setPin(v);
          setError("");
          setErrorCode("");
        }}
        loading={loading}
        error={error}
      />

      {locked && (
        <p className="mt-6 max-w-xs text-center text-small text-foreground-muted">
          Demande à un parent de déverrouiller ton profil depuis l'espace
          administration.
        </p>
      )}

      {loading && (
        <p className="mt-6 text-body text-foreground-muted" role="status">
          Vérification…
        </p>
      )}
    </div>
  );
}
