import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/api/client";
import type { SafetyEventResponse, StatsResponse } from "@/api/types";
import { AdminLayout } from "./AdminLayout";

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

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-heading font-bold text-foreground">
          Tableau de bord
        </h2>

        {/* Critical alerts */}
        {criticalEvents.length > 0 && (
          <div className="mb-6 rounded-card border border-danger/30 bg-danger/5 p-4">
            <h3 className="mb-2 text-body font-semibold text-danger">
              Alertes critiques non acquittées ({criticalEvents.length})
            </h3>
            <div className="space-y-2">
              {criticalEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-small"
                >
                  <span className="text-foreground">
                    {event.type} — {event.extrait?.slice(0, 60)}...
                  </span>
                  <button
                    onClick={() => navigate("/admin/safety")}
                    className="text-danger underline"
                  >
                    Voir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse text-foreground-muted">
            Chargement...
          </div>
        ) : stats ? (
          <>
            {/* Stats cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Messages (7j)" value={stats.total_messages} />
              <StatCard label="Profils actifs" value={stats.active_profiles} />
              <StatCard
                label="Alertes"
                value={
                  (stats.safety_events_by_severity.critical || 0) +
                  (stats.safety_events_by_severity.warning || 0)
                }
                highlight={(stats.safety_events_by_severity.critical || 0) > 0}
              />
              <StatCard
                label="Tokens utilisés"
                value={Math.round(
                  (stats.total_tokens_in + stats.total_tokens_out) / 1000,
                )}
                suffix="k"
              />
            </div>

            {/* Usage by profile */}
            {stats.usage_by_profile.length > 0 && (
              <div className="rounded-card bg-surface p-6 shadow-card">
                <h3 className="mb-4 text-subheading font-semibold text-foreground">
                  Utilisation par profil
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-small">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="pb-2 font-semibold text-foreground">
                          Prénom
                        </th>
                        <th className="pb-2 font-semibold text-foreground">
                          Messages
                        </th>
                        <th className="pb-2 font-semibold text-foreground">
                          Tokens
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.usage_by_profile.map((u) => (
                        <tr key={u.profile_id} className="hover:bg-surface-alt">
                          <td className="py-2 text-foreground">{u.prenom}</td>
                          <td className="py-2 text-foreground">{u.messages}</td>
                          <td className="py-2 text-foreground">
                            {Math.round((u.tokens_in + u.tokens_out) / 1000)}k
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-foreground-muted">
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
    <div
      className={`rounded-card bg-surface p-4 shadow-card ${
        highlight ? "ring-2 ring-danger" : ""
      }`}
    >
      <p className="text-tiny text-foreground-muted">{label}</p>
      <p
        className={`text-heading font-bold ${highlight ? "text-danger" : "text-foreground"}`}
      >
        {value}
        {suffix}
      </p>
    </div>
  );
}
