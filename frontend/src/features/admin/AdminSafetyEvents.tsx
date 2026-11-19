import { useEffect, useState } from "react";

import { apiGet, apiPost } from "@/api/client";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";

import type { SafetyEventResponse } from "@/api/types";

import { AdminLayout } from "./AdminLayout";

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

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critique",
  warning: "Avertissement",
  info: "Information",
};

const FILTERS = [
  { key: "pending" as const, label: "En attente" },
  { key: "acknowledged" as const, label: "Acquittées" },
  { key: "all" as const, label: "Toutes" },
];

export function AdminSafetyEvents() {
  const [events, setEvents] = useState<SafetyEventResponse[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "acknowledged">("pending");
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
          e.id === eventId ? { ...e, acknowledged_at: new Date().toISOString() } : e,
        ),
      );
    } catch {
      // silent
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-heading font-bold text-foreground">Alertes de sécurité</h2>

        {/* Filtres */}
        <div role="group" aria-label="Filtrer les alertes" className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setLoading(true);
              }}
              aria-pressed={filter === f.key}
              className={`rounded-button px-3 py-1.5 text-small font-medium transition-colors duration-fast ease-out focus:outline-none focus-visible:shadow-focus min-h-[var(--size-touch-target)] ${
                filter === f.key
                  ? "bg-primary text-on-dark"
                  : "border border-border bg-surface text-foreground-muted hover:bg-surface-alt hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="animate-pulse text-body text-foreground-muted">Chargement...</p>
        ) : events.length === 0 ? (
          <EmptyState
            title="Aucune alerte"
            description={
              filter === "pending"
                ? "Toutes les alertes ont été traitées."
                : "Aucune alerte ne correspond à ce filtre."
            }
          />
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <Card
                  className={`!p-4 ${event.severity === "critical" ? "!border-danger/40" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            event.severity === "critical"
                              ? "critical"
                              : event.severity === "warning"
                                ? "warning"
                                : "info"
                          }
                        >
                          {SEVERITY_LABELS[event.severity] ?? event.severity}
                        </Badge>
                        <span className="text-small font-medium text-foreground">
                          {TYPE_LABELS[event.type] || event.type}
                        </span>
                      </div>
                      {event.extrait && (
                        <p className="mt-1 text-small italic text-foreground-muted">
                          « {event.extrait} »
                        </p>
                      )}
                      <p className="mt-1 text-tiny text-foreground-muted">
                        {new Date(event.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.acknowledged_at ? (
                        <Badge variant="success">
                          Traitée le{" "}
                          {new Date(event.acknowledged_at).toLocaleDateString("fr-FR")}
                        </Badge>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handleAck(event.id)}>
                          Marquer comme traitée
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
