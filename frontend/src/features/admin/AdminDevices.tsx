import { useEffect, useState } from "react";

import { apiDelete, apiGet, apiPost } from "@/api/client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

import type { DeviceResponse } from "@/api/types";

import { AdminLayout } from "./AdminLayout";

export function AdminDevices() {
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">(
    "success",
  );
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DeviceResponse[]>("/api/admin/devices")
      .then(setDevices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    try {
      const device = await apiPost<DeviceResponse>("/api/admin/devices", {
        label: label.trim(),
      });
      setDevices((prev) => [device, ...prev]);
      setLabel("");
      setMessage("Appareil ajouté. Le cookie a été posé sur cet appareil.");
      setMessageKind("success");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setMessage(apiErr?.error?.message || "Erreur.");
      setMessageKind("error");
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    try {
      await apiDelete(`/api/admin/devices/${revokeTarget}`);
      setDevices((prev) => prev.filter((d) => d.id !== revokeTarget));
      setMessage("Appareil révoqué.");
      setMessageKind("success");
    } catch {
      setMessage("Erreur lors de la révocation.");
      setMessageKind("error");
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-heading font-bold text-foreground">
          Appareils de confiance
        </h2>

        <p className="mb-4 text-small leading-body text-foreground-muted">
          Seuls les appareils de confiance peuvent afficher la liste des profils
          enfants. Activez cet appareil comme « appareil familial » pour
          permettre aux enfants de se connecter.
        </p>

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

        {/* Formulaire d'ajout */}
        <Card className="mb-6 !p-4">
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
            <div className="min-w-0 flex-1 sm:min-w-64">
              <Input
                label="Nom de l'appareil"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ex : Tablette du salon"
                maxLength={100}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={!label.trim()}>
                Activer cet appareil
              </Button>
            </div>
          </form>
        </Card>

        {/* Liste des appareils */}
        {loading ? (
          <p className="animate-pulse text-body text-foreground-muted">
            Chargement...
          </p>
        ) : devices.length === 0 ? (
          <EmptyState
            title="Aucun appareil de confiance"
            description="Activez cet appareil pour que les enfants puissent s'y connecter."
          />
        ) : (
          <ul className="space-y-3">
            {devices.map((device) => (
              <li key={device.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 !p-4">
                  <div className="flex items-center gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[var(--size-icon)] w-[var(--size-icon)] shrink-0 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm-1 3v2m18-2v2M7 19h10" />
                    </svg>
                    <div>
                      <p className="text-body font-medium text-foreground">
                        {device.label}
                      </p>
                      <p className="text-tiny text-foreground-muted">
                        Créé le{" "}
                        {new Date(device.created_at).toLocaleDateString(
                          "fr-FR",
                        )}
                        {device.last_seen_at &&
                          ` — vu le ${new Date(device.last_seen_at).toLocaleDateString("fr-FR")}`}
                        {" — expire le "}
                        {new Date(device.expires_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setRevokeTarget(device.id)}
                  >
                    Révoquer
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Révoquer cet appareil ?"
        message="Cet appareil ne pourra plus afficher la liste des profils enfants. Les sessions en cours sur cet appareil seront progressivement invalidées."
        confirmLabel="Révoquer l'appareil"
        danger
      />
    </AdminLayout>
  );
}
