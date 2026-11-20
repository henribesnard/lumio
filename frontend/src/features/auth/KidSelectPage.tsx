import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/api/client";
import type { ProfilePublic } from "@/api/types";
import { useAuth } from "./AuthContext";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { ProfileCard } from "@/components/ProfileCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Mascot state="ecoute" size={88} />
        <div className="animate-pulse text-foreground-muted text-heading">
          Chargement…
        </div>
      </div>
    );
  }

  if (isUntrusted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-card bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-warning"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-heading font-bold text-foreground">
            Appareil non reconnu
          </h2>
          <p className="mb-2 text-body text-foreground-muted leading-body">
            Cet appareil n'est pas encore activé comme appareil familial.
          </p>
          <p className="mb-6 text-small text-foreground-muted leading-body">
            Demande à un parent de l'activer depuis l'espace administration, sur
            cet appareil.
          </p>
          <Button variant="secondary" onClick={() => navigate("/admin/login")}>
            Espace parents
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-card bg-surface p-8 text-center shadow-card">
          <p className="mb-6 text-body text-foreground-muted">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const actifs = profiles.filter((p) => p.actif);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Logo height={56} className="mb-2" />
      <p className="mb-6 text-body text-foreground-muted">Qui es-tu ?</p>

      <p className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-small text-foreground-muted">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-foreground-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
          />
        </svg>
        Tes parents peuvent lire tes conversations.
      </p>

      {actifs.length === 0 ? (
        <EmptyState
          title="Aucun profil actif"
          description="Demande à un parent de créer ton profil depuis l'espace administration."
          action={
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/login")}
            >
              Espace parents
            </Button>
          }
        />
      ) : (
        <div className="grid w-full max-w-lg grid-cols-2 gap-4 sm:grid-cols-3">
          {actifs.map((profile) => (
            <ProfileCard
              key={profile.id}
              prenom={profile.prenom}
              avatar={profile.avatar}
              status="active"
              onClick={() => navigate(`/pin/${profile.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
