import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/api/client";
import type { ProfilePublic } from "@/api/types";
import { useAuth } from "./AuthContext";

export function KidSelectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfilePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUntrusted, setIsUntrusted] = useState(false);

  // If already a kid, redirect to chat
  useEffect(() => {
    if (user?.role === "kid") {
      navigate("/chat", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    apiGet<ProfilePublic[]>("/api/kid/profiles")
      .then(setProfiles)
      .catch((err) => {
        const code = err?.error?.code;
        if (code === "untrusted_device") {
          setIsUntrusted(true);
          setError("untrusted");
        } else {
          setError("Impossible de charger les profils.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-foreground-muted text-heading">
          Chargement...
        </div>
      </div>
    );
  }

  if (isUntrusted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-card bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-warning" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <h2 className="mb-2 text-heading font-bold text-foreground">
            Appareil non reconnu
          </h2>
          <p className="mb-4 text-body text-foreground-muted">
            Cet appareil n'est pas encore activ&eacute; comme appareil familial.
          </p>
          <p className="text-small text-foreground-muted">
            Demande &agrave; un parent d'aller dans l'espace administration pour ajouter cet appareil.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-card bg-surface p-8 text-center shadow-card">
          <p className="text-body text-foreground-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <h1 className="mb-2 text-display font-bold text-foreground">Lumio</h1>
      <p className="mb-8 text-body text-foreground-muted">Qui es-tu ?</p>

      <p className="mb-6 text-small text-foreground-muted">
        Tes parents peuvent lire tes conversations.
      </p>

      <div className="grid w-full max-w-lg grid-cols-2 gap-4 sm:grid-cols-3">
        {profiles
          .filter((p) => p.actif)
          .map((profile) => (
            <button
              key={profile.id}
              onClick={() => navigate(`/pin/${profile.id}`)}
              className="flex flex-col items-center gap-2 rounded-card bg-surface p-6 shadow-card transition-transform hover:scale-105 active:scale-95"
              style={{ minHeight: "var(--size-touch-target)" }}
            >
              <img
                src={`/avatars/${profile.avatar}.svg`}
                alt={profile.prenom}
                className="h-[var(--size-avatar-lg)] w-[var(--size-avatar-lg)]"
              />
              <span className="text-subheading font-semibold text-foreground">
                {profile.prenom}
              </span>
            </button>
          ))}
      </div>

      {profiles.filter((p) => p.actif).length === 0 && (
        <div className="mt-8 text-center text-body text-foreground-muted">
          Aucun profil actif. Demande à un parent de créer ton profil.
        </div>
      )}
    </div>
  );
}
