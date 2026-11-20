import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/api/client";
import type { SafetyEventResponse } from "@/api/types";
import { AdminLayout } from "./AdminLayout";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

const TYPE_LABELS: Record<string, string> = {
  distress: "Détresse",
  self_harm: "Auto-agression",
  abuse_disclosure: "Révélation de maltraitance",
  inappropriate_content: "Contenu inapproprié",
  personal_info_shared: "Info personnelle partagée",
  jailbreak_attempt: "Tentative de jailbreak",
  forbidden_topic: "Sujet interdit",
  pin_lockout: "Verrouillage PIN",
  quota_reached: "Quota atteint",
};

export function AdminSafetyEvents() {
  const [events, setEvents] = useState<SafetyEventResponse[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "acknowledged">(
    "pending",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter === "all" ? "" : `?status=${filter}`;
    apiGet<SafetyEventResponse[]>(`/api/admin/safety-events${params}`)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleAck(eventId: string) {
    try {
      await apiPost(`/api/admin/safety-events/${eventId}/ack`);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, acknowledged_at: new Date().toISOString() }
            : e,
        ),
      );
    } catch {
      // silent
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-heading font-bold text-foreground">
          Alertes de sécurité
        </h2>

        {/* Filters */}
        <div className="mb-4 flex gap-2">
          {(["pending", "acknowledged", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setLoading(true);
              }}
              className={`rounded-button px-3 py-1.5 text-small font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "border border-border text-foreground-muted hover:bg-surface-alt"
              }`}
            >
              {f === "pending"
                ? "En attente"
                : f === "acknowledged"
                  ? "Acquittées"
                  : "Toutes"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse text-foreground-muted">
            Chargement...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-body text-foreground-muted">
            Aucune alerte.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className={`rounded-card border p-4 ${
                  event.severity === "critical"
                    ? "border-danger/30"
                    : event.severity === "warning"
                      ? "border-warning/30"
                      : "border-border"
                } bg-surface shadow-card`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-tiny font-medium ${
                          SEVERITY_STYLES[event.severity] || ""
                        }`}
                      >
                        {event.severity}
                      </span>
                      <span className="text-small font-medium text-foreground">
                        {TYPE_LABELS[event.type] || event.type}
                      </span>
                    </div>
                    {event.extrait && (
                      <p className="mt-1 text-small text-foreground-muted italic">
                        « {event.extrait} »
                      </p>
                    )}
                    <p className="mt-1 text-tiny text-foreground-muted">
                      {new Date(event.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.acknowledged_at ? (
                      <span className="text-tiny text-success">Acquittée</span>
                    ) : (
                      <button
                        onClick={() => handleAck(event.id)}
                        className="rounded-button border border-border px-3 py-1.5 text-tiny font-medium text-foreground-muted hover:bg-surface-alt"
                      >
                        Acquitter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
