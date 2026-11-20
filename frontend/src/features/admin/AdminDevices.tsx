import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "@/api/client";
import type { DeviceResponse } from "@/api/types";
import { AdminLayout } from "./AdminLayout";

export function AdminDevices() {
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");

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
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setMessage(apiErr?.error?.message || "Erreur.");
    }
  }

  async function handleRevoke(deviceId: string) {
    if (!confirm("Révoquer cet appareil de confiance ?")) return;
    try {
      await apiDelete(`/api/admin/devices/${deviceId}`);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      setMessage("Appareil révoqué.");
    } catch {
      setMessage("Erreur lors de la révocation.");
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-heading font-bold text-foreground">
          Appareils de confiance
        </h2>

        <p className="mb-4 text-small text-foreground-muted">
          Seuls les appareils de confiance peuvent afficher la liste des profils
          enfants. Activez cet appareil comme « appareil familial » pour
          permettre aux enfants de se connecter.
        </p>

        {message && (
          <div className="mb-4 rounded-input bg-success/10 px-3 py-2 text-small text-success">
            {message}
          </div>
        )}

        {/* Add device form */}
        <form onSubmit={handleCreate} className="mb-6 flex gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nom de l'appareil (ex: Tablette salon)"
            maxLength={100}
            className="flex-1 rounded-input border border-border px-3 py-2 text-body outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!label.trim()}
            className="rounded-button bg-primary px-4 py-2 text-small font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Activer cet appareil
          </button>
        </form>

        {/* Devices list */}
        {loading ? (
          <div className="animate-pulse text-foreground-muted">
            Chargement...
          </div>
        ) : devices.length === 0 ? (
          <div className="py-8 text-center text-body text-foreground-muted">
            Aucun appareil de confiance.
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card"
              >
                <div>
                  <p className="text-body font-medium text-foreground">
                    {device.label}
                  </p>
                  <p className="text-tiny text-foreground-muted">
                    Créé le{" "}
                    {new Date(device.created_at).toLocaleDateString("fr-FR")}
                    {device.last_seen_at && (
                      <>
                        {" — Vu le "}
                        {new Date(device.last_seen_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </>
                    )}
                  </p>
                  <p className="text-tiny text-foreground-muted">
                    Expire le{" "}
                    {new Date(device.expires_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(device.id)}
                  className="rounded-button border border-danger/30 px-3 py-1.5 text-tiny text-danger hover:bg-danger/5"
                >
                  Révoquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
