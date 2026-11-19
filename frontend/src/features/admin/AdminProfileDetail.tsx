import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/api/client";
import type { ConversationResponse, LearnerNotesResponse, ProfileResponse } from "@/api/types";
import { AdminLayout } from "./AdminLayout";

const NIVEAUX = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"];

export function AdminProfileDetail() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [notes, setNotes] = useState<LearnerNotesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<ProfileResponse>>({});
  const [sujetsInput, setSujetsInput] = useState("");
  const [pinForm, setPinForm] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!profileId) return;
    Promise.all([
      apiGet<ProfileResponse>(`/api/admin/profiles/${profileId}`),
      apiGet<ConversationResponse[]>(`/api/admin/profiles/${profileId}/conversations`),
      apiGet<LearnerNotesResponse[]>(`/api/admin/profiles/${profileId}/learner-notes`),
    ])
      .then(([p, c, n]) => {
        setProfile(p);
        setConversations(c);
        setNotes(n);
        setForm(p);
        setSujetsInput(p.sujets_interdits.join(", "));
      })
      .catch(() => navigate("/admin/profiles", { replace: true }))
      .finally(() => setLoading(false));
  }, [profileId, navigate]);

  async function handleSave() {
    if (!profileId) return;
    try {
      const update: Record<string, unknown> = { ...form };
      update.sujets_interdits = sujetsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      delete update.id;
      delete update.created_at;
      delete update.updated_at;
      delete update.failed_pin_count;
      delete update.locked_until;
      delete update.pin_hash;

      const updated = await apiPatch<ProfileResponse>(`/api/admin/profiles/${profileId}`, update);
      setProfile(updated);
      setEditing(false);
      setMessage("Profil mis à jour.");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setMessage(apiErr?.error?.message || "Erreur.");
    }
  }

  async function handlePinChange() {
    if (!profileId || pinForm.length !== 4) return;
    try {
      await apiPut(`/api/admin/profiles/${profileId}/pin`, { pin: pinForm });
      setPinForm("");
      setMessage("PIN mis à jour.");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setMessage(apiErr?.error?.message || "Erreur.");
    }
  }

  async function handleUnlock() {
    if (!profileId) return;
    await apiPost(`/api/admin/profiles/${profileId}/unlock`);
    setProfile((p) => p ? { ...p, failed_pin_count: 0, locked_until: null } : p);
    setMessage("Profil déverrouillé.");
  }

  async function handleDelete() {
    if (!profileId || !confirm("Supprimer ce profil et toutes ses données ?")) return;
    await apiDelete(`/api/admin/profiles/${profileId}`);
    navigate("/admin/profiles", { replace: true });
  }

  if (loading || !profile) {
    return (
      <AdminLayout>
        <div className="animate-pulse text-foreground-muted">Chargement...</div>
      </AdminLayout>
    );
  }

  const isLocked = profile.locked_until && new Date(profile.locked_until) > new Date();

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate("/admin/profiles")} className="mb-4 text-small text-foreground-muted hover:text-foreground">
          ← Retour aux profils
        </button>

        <div className="mb-6 flex items-center gap-4">
          <img src={`/avatars/${profile.avatar}.svg`} alt={profile.prenom} className="h-16 w-16" />
          <div>
            <h2 className="text-heading font-bold text-foreground">{profile.prenom}</h2>
            <p className="text-small text-foreground-muted">{profile.age} ans — {profile.niveau}</p>
            {!profile.actif && (
              <span className="text-tiny text-foreground-muted">Désactivé</span>
            )}
            {isLocked && (
              <span className="ml-2 text-tiny text-warning">Verrouillé</span>
            )}
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-input bg-success/10 px-3 py-2 text-small text-success">
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setEditing(!editing)} className="rounded-button border border-border px-3 py-1.5 text-small hover:bg-surface-alt">
            {editing ? "Annuler" : "Modifier"}
          </button>
          {isLocked && (
            <button onClick={handleUnlock} className="rounded-button bg-warning/10 px-3 py-1.5 text-small text-warning hover:bg-warning/20">
              Déverrouiller
            </button>
          )}
          <button onClick={handleDelete} className="rounded-button bg-danger/10 px-3 py-1.5 text-small text-danger hover:bg-danger/20">
            Supprimer
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mb-6 rounded-card bg-surface p-6 shadow-card">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-small font-medium">Prénom</label>
                <input
                  value={form.prenom || ""}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                  className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-small font-medium">Âge</label>
                <input
                  type="number"
                  min={6}
                  max={14}
                  value={form.age || 8}
                  onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
                  className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-small font-medium">Niveau</label>
                <select
                  value={form.niveau || ""}
                  onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value }))}
                  className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
                >
                  {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-small font-medium">Quota messages/jour</label>
                <input
                  type="number"
                  value={form.quota_messages_jour || 50}
                  onChange={(e) => setForm((f) => ({ ...f, quota_messages_jour: Number(e.target.value) }))}
                  className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-small font-medium">Consignes personnalisées</label>
              <textarea
                value={form.consignes_admin || ""}
                onChange={(e) => setForm((f) => ({ ...f, consignes_admin: e.target.value }))}
                rows={3}
                className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
              />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-small font-medium">Sujets interdits (séparés par des virgules)</label>
              <input
                value={sujetsInput}
                onChange={(e) => setSujetsInput(e.target.value)}
                className="w-full rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2 text-small">
                <input
                  type="checkbox"
                  checked={form.actif ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
                />
                Profil actif
              </label>
            </div>
            <button onClick={handleSave} className="mt-4 rounded-button bg-primary px-6 py-2 text-small font-medium text-white hover:bg-primary-hover">
              Enregistrer
            </button>
          </div>
        )}

        {/* PIN change */}
        <div className="mb-6 rounded-card bg-surface p-6 shadow-card">
          <h3 className="mb-3 text-subheading font-semibold">Changer le code PIN</h3>
          <div className="flex items-end gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pinForm}
              onChange={(e) => setPinForm(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Nouveau PIN (4 chiffres)"
              className="rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
            />
            <button
              onClick={handlePinChange}
              disabled={pinForm.length !== 4}
              className="rounded-button bg-primary px-4 py-2 text-small font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Mettre à jour
            </button>
          </div>
        </div>

        {/* Learner notes */}
        {notes.length > 0 && (
          <div className="mb-6 rounded-card bg-surface p-6 shadow-card">
            <h3 className="mb-3 text-subheading font-semibold">Notes d'apprentissage</h3>
            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="rounded-input border border-border p-3">
                  <p className="text-small font-semibold text-primary">{n.matiere}</p>
                  <p className="mt-1 text-small text-foreground">{n.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversations */}
        <div className="rounded-card bg-surface p-6 shadow-card">
          <h3 className="mb-3 text-subheading font-semibold">Conversations</h3>
          {conversations.length === 0 ? (
            <p className="text-small text-foreground-muted">Aucune conversation.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/admin/conversations/${c.id}`)}
                  className="flex w-full items-center justify-between rounded-input border border-border p-3 text-left hover:bg-surface-alt"
                >
                  <div>
                    <p className="text-small font-medium text-foreground">{c.titre}</p>
                    <p className="text-tiny text-foreground-muted">
                      {new Date(c.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-foreground-muted">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
