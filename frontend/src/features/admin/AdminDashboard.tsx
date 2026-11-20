import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { apiGet } from "@/api/client";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";

import type { SafetyEventResponse, StatsResponse } from "@/api/types";

import { AdminLayout } from "./AdminLayout";

const RACCOURCIS = [
  {
    to: "/admin/profiles",
    label: "Gérer les profils",
    description: "Créer, modifier ou verrouiller un profil enfant.",
    icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0",
  },
  {
    to: "/admin/safety",
    label: "Alertes de sécurité",
    description: "Consulter et acquitter les alertes en attente.",
    icon: "M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  },
  {
    to: "/admin/devices",
    label: "Appareils de confiance",
    description: "Activer ou révoquer les appareils autorisés.",
    icon: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm-1 3v2m18-2v2M7 19h10",
  },
  {
    to: "/admin/security",
    label: "Sécurité du compte",
    description: "Activer la double authentification (TOTP).",
    icon: "M12 3l8 3v6c0 4.5-3.2 7.7-8 9-4.8-1.3-8-4.5-8-9V6l8-3zm-3 9l2 2 4-4",
  },
];

function ShortcutIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[var(--size-icon)] w-[var(--size-icon)] text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [criticalEvents, setCriticalEvents] = useState<SafetyEventResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<StatsResponse>("/api/admin/stats?days=7"),
      apiGet<SafetyEventResponse[]>("/api/admin/safety-events?status=pending"),
    ])
      .then(([s, events]) => {
        setStats(s);
        setCriticalEvents(events.filter((e) => e.severity === "critical"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const alertCount =
    (stats?.safety_events_by_severity.critical || 0) +
    (stats?.safety_events_by_severity.warning || 0);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 text-heading font-bold text-foreground">
          Tableau de bord
        </h2>

        {/* Alertes critiques — visibles en tête, sans être anxiogènes */}
        {criticalEvents.length > 0 && (
          <section
            aria-label="Alertes critiques"
            className="mb-6 rounded-card border border-danger/30 bg-surface p-5 shadow-card"
          >
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="critical">
                {criticalEvents.length} alerte
                {criticalEvents.length > 1 ? "s" : ""} critique
                {criticalEvents.length > 1 ? "s" : ""} non traitée
                {criticalEvents.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <ul className="space-y-2">
              {criticalEvents.slice(0, 3).map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-4 text-small"
                >
                  <span className="truncate text-foreground">
                    {event.type} — {event.extrait?.slice(0, 60)}
                    {event.extrait && event.extrait.length > 60 ? "…" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin/safety")}
                  >
                    Voir
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {loading ? (
          <p className="animate-pulse text-body text-foreground-muted">
            Chargement...
          </p>
        ) : stats ? (
          <>
            {/* Statistiques */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Messages (7 jours)"
                value={stats.total_messages}
              />
              <StatCard label="Profils actifs" value={stats.active_profiles} />
              <StatCard
                label="Alertes (7 jours)"
                value={alertCount}
                highlight={(stats.safety_events_by_severity.critical || 0) > 0}
              />
              <StatCard
                label="Tokens (7 jours)"
                value={Math.round(
                  (stats.total_tokens_in + stats.total_tokens_out) / 1000,
                )}
                suffix="k"
              />
            </div>

            {/* Raccourcis */}
            <h3 className="mb-3 text-subheading font-semibold text-foreground">
              Raccourcis
            </h3>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {RACCOURCIS.map((r) => (
                <Card
                  key={r.to}
                  onClick={() => navigate(r.to)}
                  className="flex flex-col gap-1 !p-4"
                >
                  <span className="mb-1">
                    <ShortcutIcon path={r.icon} />
                  </span>
                  <span className="text-small font-semibold text-foreground">
                    {r.label}
                  </span>
                  <span className="text-tiny text-foreground-muted leading-body">
                    {r.description}
                  </span>
                </Card>
              ))}
            </div>

            {/* Utilisation par profil */}
            <h3 className="mb-3 text-subheading font-semibold text-foreground">
              Utilisation par profil (7 jours)
            </h3>
            <Table
              headers={["Prénom", "Messages", "Tokens"]}
              emptyMessage="Aucune activité sur les 7 derniers jours."
              rows={stats.usage_by_profile.map((u) => [
                u.prenom,
                String(u.messages),
                `${Math.round((u.tokens_in + u.tokens_out) / 1000)}k`,
              ])}
            />
          </>
        ) : (
          <p className="text-body text-foreground-muted">
            Impossible de charger les statistiques.
          </p>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <Card className="!p-4">
      <p className="text-tiny text-foreground-muted">{label}</p>
      <p
        className={`mt-1 text-heading font-bold ${highlight ? "text-danger" : "text-foreground"}`}
      >
        {value}
        {suffix}
      </p>
      {highlight && <Badge variant="critical">À traiter</Badge>}
    </Card>
  );
}
