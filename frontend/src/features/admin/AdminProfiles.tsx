import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { apiGet, apiPost } from "@/api/client";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

import type { ProfileResponse } from "@/api/types";

import { AdminLayout } from "./AdminLayout";

const NIVEAUX = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"];

const AVATARS = Array.from(
  { length: 12 },
  (_, i) => `avatar-${String(i + 1).padStart(2, "0")}`,
);

const selectClass =
  "w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-foreground min-h-[var(--size-touch-target)] transition-colors duration-fast ease-out focus:outline-none focus-visible:shadow-focus focus:border-primary hover:border-foreground-muted";

export function AdminProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    prenom: "",
    age: 8,
    niveau: "CE2",
    avatar: "avatar-01",
    pin: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<ProfileResponse[]>("/api/admin/profiles")
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const profile = await apiPost<ProfileResponse>(
        "/api/admin/profiles",
        form,
      );
      setProfiles((prev) => [...prev, profile]);
      setShowCreate(false);
      setForm({
        prenom: "",
        age: 8,
        niveau: "CE2",
        avatar: "avatar-01",
        pin: "",
      });
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || "Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-heading font-bold text-foreground">
            Profils enfants
          </h2>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            variant={showCreate ? "secondary" : "primary"}
          >
            {showCreate ? "Annuler" : "Nouveau profil"}
          </Button>
        </div>

        {/* Formulaire de création */}
        {showCreate && (
          <Card className="mb-6">
            <h3 className="mb-4 text-subheading font-semibold text-foreground">
              Créer un profil enfant
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Prénom"
                  value={form.prenom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, prenom: e.target.value }))
                  }
                  required
                  maxLength={50}
                />
                <Input
                  label="Âge"
                  type="number"
                  min={6}
                  max={14}
                  value={form.age}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, age: Number(e.target.value) }))
                  }
                />
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="niveau"
                    className="text-small font-medium text-foreground"
                  >
                    Niveau
                  </label>
                  <select
                    id="niveau"
                    value={form.niveau}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, niveau: e.target.value }))
                    }
                    className={selectClass}
                  >
                    {NIVEAUX.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Code PIN (4 chiffres)"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  required
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-small font-medium text-foreground">
                  Avatar
                </legend>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((a) => {
                    const selected = form.avatar === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, avatar: a }))}
                        aria-pressed={selected}
                        aria-label={`Avatar ${a}${selected ? " (sélectionné)" : ""}`}
                        className={`rounded-full transition-all duration-fast ease-out focus:outline-none focus-visible:shadow-focus ${
                          selected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-surface"
                            : "ring-2 ring-transparent hover:ring-border"
                        }`}
                      >
                        <Avatar
                          avatarKey={a}
                          size="sm"
                          alt=""
                          className="!ring-0"
                        />
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {error && <Notice variant="error">{error}</Notice>}

              <Button type="submit" loading={creating}>
                Créer le profil
              </Button>
            </form>
          </Card>
        )}

        {/* Liste des profils */}
        {loading ? (
          <p className="animate-pulse text-body text-foreground-muted">
            Chargement...
          </p>
        ) : profiles.length === 0 ? (
          <EmptyState
            title="Aucun profil"
            description="Créez le premier profil enfant pour permettre la connexion sur un appareil familial."
            action={
              <Button onClick={() => setShowCreate(true)}>
                Créer un profil
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => {
              const isLocked =
                p.locked_until && new Date(p.locked_until) > new Date();
              return (
                <Card
                  key={p.id}
                  onClick={() => navigate(`/admin/profiles/${p.id}`)}
                  className="flex items-center gap-4 !p-4"
                >
                  <Avatar
                    avatarKey={p.avatar}
                    size="lg"
                    alt={`Avatar de ${p.prenom}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold text-foreground">
                      {p.prenom}
                    </p>
                    <p className="text-tiny text-foreground-muted">
                      {p.age} ans — {p.niveau}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {!p.actif && <Badge variant="info">Désactivé</Badge>}
                      {isLocked && <Badge variant="warning">Verrouillé</Badge>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
