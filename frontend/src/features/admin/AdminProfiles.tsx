import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/api/client";
import type { ProfileResponse } from "@/api/types";
import { AdminLayout } from "./AdminLayout";

const NIVEAUX = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"];
const AVATARS = Array.from({ length: 12 }, (_, i) => `avatar-${String(i + 1).padStart(2, "0")}`);

export function AdminProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
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
    try {
      const profile = await apiPost<ProfileResponse>("/api/admin/profiles", form);
      setProfiles((prev) => [...prev, profile]);
      setShowCreate(false);
      setForm({ prenom: "", age: 8, niveau: "CE2", avatar: "avatar-01", pin: "" });
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || "Erreur lors de la création.");
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-heading font-bold text-foreground">Profils enfants</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-button bg-primary px-4 py-2 text-small font-medium text-white hover:bg-primary-hover"
          >
            {showCreate ? "Annuler" : "Nouveau profil"}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-6 rounded-card bg-surface p-6 shadow-card">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-small font-medium text-foreground">Prénom</label>
                  <input
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    required
                    maxLength={50}
                    className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-small font-medium text-foreground">Âge</label>
                  <input
                    type="number"
                    min={6}
                    max={14}
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
                    className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-small font-medium text-foreground">Niveau</label>
                  <select
                    value={form.niveau}
                    onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value }))}
                    className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
                  >
                    {NIVEAUX.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-small font-medium text-foreground">Code PIN (4 chiffres)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.pin}
                    onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    required
                    className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-small font-medium text-foreground">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, avatar: a }))}
                      className={`rounded-full p-1 ${form.avatar === a ? "ring-2 ring-accent" : ""}`}
                    >
                      <img src={`/avatars/${a}.svg`} alt={a} className="h-10 w-10" />
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-input bg-danger/10 px-3 py-2 text-small text-danger">{error}</div>
              )}

              <button
                type="submit"
                className="rounded-button bg-primary px-6 py-2 text-small font-medium text-white hover:bg-primary-hover"
              >
                Créer le profil
              </button>
            </form>
          </div>
        )}

        {/* Profiles list */}
        {loading ? (
          <div className="animate-pulse text-foreground-muted">Chargement...</div>
        ) : profiles.length === 0 ? (
          <div className="py-12 text-center text-body text-foreground-muted">
            Aucun profil. Créez le premier profil enfant.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/admin/profiles/${p.id}`)}
                className="flex items-center gap-4 rounded-card bg-surface p-4 text-left shadow-card transition-colors hover:bg-surface-alt"
              >
                <img src={`/avatars/${p.avatar}.svg`} alt={p.prenom} className="h-12 w-12" />
                <div className="flex-1">
                  <p className="text-body font-semibold text-foreground">{p.prenom}</p>
                  <p className="text-tiny text-foreground-muted">
                    {p.age} ans — {p.niveau}
                  </p>
                  <div className="mt-1 flex gap-2">
                    {!p.actif && (
                      <span className="rounded-full bg-foreground-muted/10 px-2 py-0.5 text-tiny text-foreground-muted">
                        Désactivé
                      </span>
                    )}
                    {p.locked_until && new Date(p.locked_until) > new Date() && (
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-tiny text-warning">
                        Verrouillé
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
