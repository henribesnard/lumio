import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import type { ConversationResponse, KidMeResponse } from "@/api/types";

export function KidConversationsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [me, setMe] = useState<KidMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const ageBracket = me ? (me.age <= 8 ? "6-8" : "9-14") : "9-14";

  useEffect(() => {
    Promise.all([
      apiGet<ConversationResponse[]>("/api/kid/conversations"),
      apiGet<KidMeResponse>("/api/kid/me"),
    ])
      .then(([convs, meData]) => {
        setConversations(convs);
        setMe(meData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleNewConversation() {
    try {
      const conv = await apiPost<ConversationResponse>("/api/kid/conversations", {});
      navigate(`/chat/${conv.id}`);
    } catch {
      // handled by error boundary
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/select", { replace: true });
  }

  if (loading) {
    return (
      <div data-age={ageBracket} className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-foreground-muted text-heading">Chargement...</div>
      </div>
    );
  }

  return (
    <div data-age={ageBracket} className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          {me && (
            <img
              src={`/avatars/${me.avatar}.svg`}
              alt={me.prenom}
              className="h-[var(--size-avatar-sm)] w-[var(--size-avatar-sm)]"
            />
          )}
          <div>
            <h1 className="text-subheading font-bold text-foreground">
              Salut {me?.prenom} !
            </h1>
            <p className="text-tiny text-foreground-muted">
              {me?.quota_messages_restant} messages restants aujourd'hui
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-button border border-border px-3 py-1.5 text-small text-foreground-muted hover:bg-surface-alt"
        >
          Quitter
        </button>
      </header>

      {/* Notices */}
      {me?.hors_plage_horaire && (
        <div className="bg-warning/10 px-4 py-3 text-center text-small text-warning">
          Ce n'est pas le moment de discuter avec Lumio. Reviens pendant les heures autorisées !
        </div>
      )}
      {me && me.quota_messages_restant <= 0 && (
        <div className="bg-info/10 px-4 py-3 text-center text-small text-info">
          Tu as utilisé tous tes messages pour aujourd'hui. On se retrouve demain !
        </div>
      )}

      {/* Content */}
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleNewConversation}
            disabled={me?.hors_plage_horaire || (me?.quota_messages_restant ?? 0) <= 0}
            className="mb-6 w-full rounded-button bg-primary px-4 py-3 text-body font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            style={{ minHeight: "var(--size-touch-target)" }}
          >
            Nouvelle conversation
          </button>

          {conversations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-heading">👋</p>
              <p className="mt-2 text-body text-foreground-muted">
                Pas encore de conversation. Commence-en une !
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="flex w-full items-center justify-between rounded-card bg-surface px-4 py-3 text-left shadow-card transition-colors hover:bg-surface-alt"
                >
                  <div>
                    <p className="text-body font-medium text-foreground">{conv.titre}</p>
                    <p className="text-tiny text-foreground-muted">
                      {new Date(conv.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-foreground-muted">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer notice */}
      <footer className="border-t border-border bg-surface-alt px-4 py-2 text-center text-tiny text-foreground-muted">
        Tes parents peuvent lire tes conversations.
      </footer>
    </div>
  );
}
