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
          setError("Cet appareil n'est pas reconnu comme appareil familial. Demande à un parent de l'activer.");
        } else {
          setError("Impossible de charger les profils.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function getAgeBracket(profile: ProfilePublic): string {
    // We don't have age in ProfilePublic, default to 9-14
    return "9-14";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-foreground-muted text-heading">
          Chargement...
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
