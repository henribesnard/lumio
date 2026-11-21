import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/api/client";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";
import { Tabs } from "@/components/Tabs";
import { TagInput } from "@/components/TagInput";
import { Toggle } from "@/components/Toggle";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import {
  toEditorSchedule,
  validateSchedule,
  type Schedule,
} from "@/components/schedule";

import type {
  ConversationResponse,
  LearnerNotesResponse,
  ProfileResponse,
} from "@/api/types";

import { AdminLayout } from "./AdminLayout";

const NIVEAUX = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"];
const AVATARS = Array.from(
  { length: 12 },
  (_, i) => `avatar-${String(i + 1).padStart(2, "0")}`,
);

const TABS = [
  { key: "identite", label: "Identité" },
  { key: "comportement", label: "Comportement de l'agent" },
  { key: "limites", label: "Limites" },
  { key: "notes", label: "Notes d'apprentissage" },
  { key: "prompt", label: "Aperçu du prompt" },
  { key: "conversations", label: "Conversations" },
  { key: "danger", label: "Zone dangereuse" },
];

const fieldClass =
  "w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-foreground min-h-[var(--size-touch-target)] transition-colors duration-fast ease-out placeholder:text-foreground-muted focus:outline-none focus-visible:shadow-focus focus:border-primary hover:border-foreground-muted";

const textareaClass = `${fieldClass} resize-y leading-body`;

export function AdminProfileDetail() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [conversations, setConversations] = useState<ConversationResponse[]>(
    [],
  );
  const [notes, setNotes] = useState<LearnerNotesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("identite");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ProfileResponse>>({});
  const [sujetsInput, setSujetsInput] = useState("");
  const [pinForm, setPinForm] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">(
    "success",
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    Promise.all([
      apiGet<ProfileResponse>(`/api/admin/profiles/${profileId}`),
      apiGet<ConversationResponse[]>(
        `/api/admin/profiles/${profileId}/conversations`,
      ),
      apiGet<LearnerNotesResponse[]>(
        `/api/admin/profiles/${profileId}/learner-notes`,
      ),
    ])
      .then(([p, c, n]) => {
        setProfile(p);
        setConversations(c);
        setNotes(n);
        // Clés de jour héritées (« lun », « mon »…) ramenées aux noms français.
        setForm({
          ...p,
          // {} ou null = aucune restriction ; clés héritées normalisées
          plages_horaires: toEditorSchedule(p.plages_horaires),
        });
        setSujetsInput(p.sujets_interdits.join(", "));
      })
      .catch(() => navigate("/admin/profiles", { replace: true }))
      .finally(() => setLoading(false));
  }, [profileId, navigate]);

  // Aperçu du prompt : chargé à la demande (endpoint existant, lecture seule)
  useEffect(() => {
    if (
      activeTab !== "prompt" ||
      !profileId ||
      promptPreview !== null ||
      promptLoading
    )
      return;
    setPromptLoading(true);
    apiGet<{ prompt: string }>(
      `/api/admin/profiles/${profileId}/prompt-preview`,
    )
      .then((d) => setPromptPreview(d.prompt))
      .catch(() => setPromptPreview(""))
      .finally(() => setPromptLoading(false));
  }, [activeTab, profileId, promptPreview, promptLoading]);

  async function handleSave() {
    if (!profileId) return;
    setSaving(true);
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

      const updated = await apiPatch<ProfileResponse>(
        `/api/admin/profiles/${profileId}`,
        update,
      );
      setProfile(updated);
      setMessage("Profil mis à jour.");
      setMessageKind("success");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setMessage(apiErr?.error?.message || "Erreur.");
      setMessageKind("error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePinChange() {
    if (!profileId || pinForm.length !== 4) return;
    try {
      await apiPut(`/api/admin/profiles/${profileId}/pin`, { pin: pinForm });
      setPinForm("");
      setMessage("PIN mis à jour.");
      setMessageKind("success");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setMessage(apiErr?.error?.message || "Erreur.");
      setMessageKind("error");
    }
  }

  async function handleUnlock() {
    if (!profileId) return;
    await apiPost(`/api/admin/profiles/${profileId}/unlock`);
    setProfile((p) =>
      p ? { ...p, failed_pin_count: 0, locked_until: null } : p,
    );
    setMessage("Profil déverrouillé.");
    setMessageKind("success");
  }

  async function handleDelete() {
    if (!profileId) return;
    await apiDelete(`/api/admin/profiles/${profileId}`);
    navigate("/admin/profiles", { replace: true });
  }

  if (loading || !profile) {
    return (
      <AdminLayout>
        <p className="animate-pulse text-body text-foreground-muted">
          Chargement...
        </p>
      </AdminLayout>
    );
  }

  const isLocked = !!(
    profile.locked_until && new Date(profile.locked_until) > new Date()
  );
  const sujetsTags = sujetsInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const scheduleInvalid =
    !!form.plages_horaires &&
    Object.keys(validateSchedule(form.plages_horaires as Schedule)).length > 0;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/profiles")}
          className="mb-4"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[var(--size-icon)] w-[var(--size-icon)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Retour aux profils
        </Button>

        <div className="mb-6 flex items-center gap-4">
          <Avatar
            avatarKey={profile.avatar}
            size="lg"
            alt={`Avatar de ${profile.prenom}`}
            className="!h-16 !w-16"
          />
          <div>
            <h1 className="text-heading font-bold text-foreground">
              {profile.prenom}
            </h1>
            <p className="text-small text-foreground-muted">
              {profile.age} ans — {profile.niveau}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {!profile.actif && <Badge variant="info">Désactivé</Badge>}
              {isLocked && <Badge variant="warning">Verrouillé</Badge>}
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4">
            <Notice
              variant={messageKind === "success" ? "success" : "error"}
              onDismiss={() => setMessage("")}
            >
              {message}
            </Notice>
          </div>
        )}

        <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {/* Identité */}
          {activeTab === "identite" && (
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Prénom"
                  value={form.prenom || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, prenom: e.target.value }))
                  }
                />
                <Input
                  label="Âge"
                  type="number"
                  min={6}
                  max={14}
                  value={form.age || 8}
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
                    value={form.niveau || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, niveau: e.target.value }))
                    }
                    className={fieldClass}
                  >
                    {NIVEAUX.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <fieldset className="mt-4">
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
              <Button onClick={handleSave} loading={saving} className="mt-6">
                Enregistrer les modifications
              </Button>
            </Card>
          )}

          {/* Comportement de l'agent */}
          {activeTab === "comportement" && (
            <Card>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="consignes"
                  className="text-small font-medium text-foreground"
                >
                  Consignes personnalisées pour l'agent
                </label>
                <textarea
                  id="consignes"
                  value={form.consignes_admin || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, consignes_admin: e.target.value }))
                  }
                  rows={5}
                  className={textareaClass}
                  placeholder="Ex : toujours féliciter l'enfant quand il trouve seul..."
                />
              </div>
              <div className="mt-4">
                <p
                  id="sujets-label"
                  className="mb-2 text-small font-medium text-foreground"
                >
                  Sujets interdits
                </p>
                <div role="group" aria-labelledby="sujets-label">
                  <TagInput
                    tags={sujetsTags}
                    onChange={(tags) => setSujetsInput(tags.join(", "))}
                    placeholder="Ajouter un sujet..."
                  />
                </div>
                <p className="mt-1 text-tiny text-foreground-muted">
                  Appuyez sur Entrée ou « , » pour ajouter une étiquette.
                </p>
              </div>
              <div className="mt-6 border-t border-border-subtle pt-4">
                <Toggle
                  checked={form.supports_visuels ?? false}
                  onChange={(checked) =>
                    setForm((f) => ({ ...f, supports_visuels: checked }))
                  }
                  label="Supports visuels (feuille de Lumio)"
                />
                <p className="mt-1 text-tiny text-foreground-muted">
                  Lumio peut joindre un dessin simple (droite graduée,
                  fractions, graphique, figure, frise) qui ne contient jamais la
                  réponse. Nécessite aussi l'activation globale
                  (VISUAL_AIDS_ENABLED) sur le serveur.
                </p>
              </div>
              <Button onClick={handleSave} loading={saving} className="mt-6">
                Enregistrer les modifications
              </Button>
            </Card>
          )}

          {/* Limites */}
          {activeTab === "limites" && (
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Quota de messages par jour"
                  type="number"
                  min={0}
                  value={form.quota_messages_jour || 0}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quota_messages_jour: Number(e.target.value),
                    }))
                  }
                />
                <Input
                  label="Quota de tokens par jour"
                  type="number"
                  min={0}
                  value={form.quota_tokens_jour || 0}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quota_tokens_jour: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <section className="mt-6" aria-labelledby="horaires-titre">
                <h3
                  id="horaires-titre"
                  className="mb-3 text-subheading font-semibold text-foreground"
                >
                  Horaires autorisés
                </h3>
                <ScheduleEditor
                  value={(form.plages_horaires as Schedule | null) ?? null}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, plages_horaires: v }))
                  }
                />
              </section>

              <div className="mt-6 border-t border-border pt-4">
                <Toggle
                  checked={form.actif ?? true}
                  onChange={(checked) =>
                    setForm((f) => ({ ...f, actif: checked }))
                  }
                  label="Profil actif (autorise la connexion)"
                />
              </div>

              <Button
                onClick={handleSave}
                loading={saving}
                disabled={scheduleInvalid}
                className="mt-6"
              >
                Enregistrer les modifications
              </Button>
              {scheduleInvalid && (
                <p className="mt-2 text-small text-danger" role="status">
                  Corrigez les horaires avant d'enregistrer.
                </p>
              )}
            </Card>
          )}

          {/* Notes d'apprentissage */}
          {activeTab === "notes" &&
            (notes.length === 0 ? (
              <EmptyState
                title="Aucune note d'apprentissage"
                description="Les notes prises par l'agent sur les progrès de l'enfant apparaîtront ici."
              />
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <Card key={n.id} className="!p-4">
                    <p className="text-small font-semibold text-link">
                      {n.matiere}
                    </p>
                    <p className="mt-1 text-small text-foreground leading-body">
                      {n.notes}
                    </p>
                    <p className="mt-2 text-tiny text-foreground-muted">
                      Mise à jour le{" "}
                      {new Date(n.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </Card>
                ))}
              </div>
            ))}

          {/* Aperçu du prompt */}
          {activeTab === "prompt" && (
            <Card>
              <h3 className="mb-2 text-subheading font-semibold text-foreground">
                Prompt système envoyé à l'agent pour ce profil
              </h3>
              <p className="mb-4 text-small text-foreground-muted leading-body">
                Lecture seule — le prompt est composé côté serveur à partir de
                l'âge, du niveau, des consignes et des sujets interdits.
              </p>
              {promptLoading ? (
                <p className="animate-pulse text-small text-foreground-muted">
                  Chargement...
                </p>
              ) : (
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-input border border-border bg-surface-alt p-4 font-mono text-tiny text-foreground leading-body">
                  {promptPreview ?? "Aperçu indisponible."}
                </pre>
              )}
            </Card>
          )}

          {/* Conversations */}
          {activeTab === "conversations" &&
            (conversations.length === 0 ? (
              <EmptyState
                title="Aucune conversation"
                description="Les conversations de cet enfant apparaîtront ici."
              />
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/admin/conversations/${c.id}`)}
                    className="flex w-full items-center justify-between gap-4 rounded-input border border-border bg-surface p-4 text-left shadow-card transition-all duration-fast ease-out hover:-translate-y-0.5 hover:shadow-modal focus:outline-none focus-visible:shadow-focus"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-small font-medium text-foreground">
                        {c.titre}
                      </p>
                      <p className="text-tiny text-foreground-muted">
                        {new Date(c.updated_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[var(--size-icon)] w-[var(--size-icon)] shrink-0 text-foreground-muted"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            ))}

          {/* Zone dangereuse */}
          {activeTab === "danger" && (
            <div className="space-y-4">
              <Card className="border-danger">
                <h3 className="mb-1 text-subheading font-semibold text-danger">
                  Zone dangereuse
                </h3>
                <p className="mb-4 text-small text-foreground-muted leading-body">
                  Ces actions sont sensibles. Le déverrouillage efface le
                  compteur d'échecs PIN ; la suppression efface définitivement
                  le profil et toutes ses données.
                </p>

                <div className="space-y-4">
                  {isLocked && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-input border border-warning bg-warning-bg p-4">
                      <p className="text-small text-warning">
                        Ce profil est actuellement verrouillé après des
                        tentatives de PIN erronées.
                      </p>
                      <Button variant="secondary" onClick={handleUnlock}>
                        Déverrouiller le profil
                      </Button>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-2 text-small font-medium text-foreground">
                      Changer le code PIN
                    </h4>
                    <div className="flex flex-wrap items-end gap-3">
                      <Input
                        label="Nouveau PIN (4 chiffres)"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinForm}
                        onChange={(e) =>
                          setPinForm(
                            e.target.value.replace(/\D/g, "").slice(0, 4),
                          )
                        }
                        className="sm:max-w-56"
                      />
                      <Button
                        onClick={handlePinChange}
                        disabled={pinForm.length !== 4}
                      >
                        Mettre à jour le PIN
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <Button
                      variant="danger"
                      onClick={() => setConfirmDeleteOpen(true)}
                    >
                      Supprimer le profil
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ce profil ?"
        message="Cette action supprimera définitivement le profil et toutes ses conversations. Elle est irréversible."
        confirmLabel="Supprimer définitivement"
        danger
      />
    </AdminLayout>
  );
}
