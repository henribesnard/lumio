import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ApiError } from "@/api/client";
import { PinPad } from "@/components/PinPad";
import { Logo } from "@/components/Logo";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <button
        onClick={() => navigate("/select")}
        className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-button px-3 py-2 text-small text-foreground-muted transition-colors duration-fast hover:bg-surface-alt hover:text-foreground focus:outline-none focus-visible:shadow-focus min-h-[var(--size-touch-target)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path
            d="M19 12H5m7-7-7 7 7 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Retour
      </button>

      <Logo height={48} className="mb-6" />

      <Mascot
        state={loading ? "reflechit" : locked ? "pause" : "ecoute"}
        size={88}
        className="mb-4"
      />

      <h1 className="mb-1 text-center text-heading font-bold text-foreground">
        Entre ton code secret
      </h1>
      <p className="mb-8 text-center text-small text-foreground-muted">
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
