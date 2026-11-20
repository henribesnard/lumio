import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiGet, apiPost } from "@/api/client";
import { AlertCard } from "@/components/AlertCard";
import { EmptyState } from "@/components/EmptyState";

import type { SafetyEventResponse } from "@/api/types";

import { AdminLayout } from "./AdminLayout";

const FILTERS = [
  { key: "pending" as const, label: "En attente" },
  { key: "acknowledged" as const, label: "Acquittées" },
  { key: "all" as const, label: "Toutes" },
];

export function AdminSafetyEvents() {
  const navigate = useNavigate();
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
        <h1 className="mb-6 text-heading font-bold text-foreground">
          Alertes de sécurité
        </h1>

        {/* Filtres */}
        <div
          role="group"
          aria-label="Filtrer les alertes"
          className="mb-4 flex flex-wrap gap-2"
        >
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
                  ? "bg-primary text-on-primary"
                  : "border border-border bg-surface text-foreground-muted hover:bg-surface-alt hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="animate-pulse text-body text-foreground-muted">
            Chargement...
          </p>
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
                <AlertCard
                  event={event}
                  onAcknowledge={handleAck}
                  onOpenConversation={(id) =>
                    navigate(`/admin/conversations/${id}`)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
