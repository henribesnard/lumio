import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import type { ConversationResponse, KidMeResponse } from "@/api/types";
import { Avatar } from "@/components/Avatar";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { EmptyState } from "@/components/EmptyState";

const SUGGESTIONS_BY_AGE: Record<string, string[]> = {
  "6-8": [
    "Aide-moi avec les additions",
    "Raconte-moi les dinosaures",
    "Comment on lit l'heure ?",
    "C'est quoi les saisons ?",
  ],
  "9-14": [
    "Aide-moi avec mes fractions",
    "Explique-moi la photosynthèse",
    "Je voudrais comprendre l'histoire de France",
    "Comment on fait une rédaction ?",
  ],
};


export function KidConversationsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [me, setMe] = useState<KidMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const ageBracket = me ? (me.age <= 8 ? "6-8" : "9-14") : "9-14";
  const canChat = !me?.hors_plage_horaire && (me?.quota_messages_restant ?? 0) > 0;

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
        <div className="flex flex-col items-center gap-4">
          <Mascot state="ecoute" size={88} />
          <div className="animate-pulse text-foreground-muted text-heading">Chargement…</div>
        </div>
      </div>
    );
  }

  const quotaTotal = me?.quota_messages_jour ?? 50;
  const quotaRestant = me?.quota_messages_restant ?? 0;
  const quotaPercent = Math.round((quotaRestant / quotaTotal) * 100);
  const quotaLow = quotaRestant > 0 && quotaPercent <= 25;

  return (
    <div data-age={ageBracket} className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          {me && <Avatar avatarKey={me.avatar} size="sm" alt={me.prenom} />}
          <div>
            <h1 className="text-subheading font-bold text-foreground">Salut {me?.prenom} !</h1>
            {/* Quota présenté positivement : jauge + message encourageant, jamais de compte à rebours rouge */}
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-24 overflow-hidden rounded-full bg-surface-alt border border-border"
                role="progressbar"
                aria-label="Messages restants aujourd'hui"
                aria-valuemin={0}
                aria-valuemax={quotaTotal}
                aria-valuenow={quotaRestant}
              >
                <div
                  className={`h-full rounded-full transition-all duration-med ease-out ${
                    quotaRestant === 0 ? "bg-border" : quotaLow ? "bg-warning" : "bg-primary"
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <p className="text-tiny text-foreground-muted">
                {quotaRestant > 0
                  ? `Encore ${quotaRestant} message${quotaRestant > 1 ? "s" : ""} aujourd'hui`
                  : "À demain pour de nouvelles questions !"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-button border border-border px-3 py-1.5 text-small text-foreground-muted transition-colors duration-fast hover:bg-surface-alt hover:text-foreground focus:outline-none focus-visible:shadow-focus min-h-[var(--size-touch-target)]"
        >
          Quitter
        </button>
      </header>

      {/* Notices */}
      {me?.hors_plage_horaire && (
        <div className="px-4 pt-3">
          <Notice variant="warning">
            Ce n'est pas le moment de discuter avec Lumio. Reviens pendant les heures autorisées !
          </Notice>
        </div>
      )}
      {me && me.quota_messages_restant <= 0 && (
        <div className="px-4 pt-3">
          <Notice variant="info">
            Tu as utilisé tous tes messages pour aujourd'hui. On se retrouve demain !
          </Notice>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-lg">
          <Button
            variant="primary"
            size="lg"
            onClick={handleNewConversation}
            disabled={!canChat}
            className="mb-6 w-full"
          >
            <svg viewBox="0 0 24 24" className="h-[var(--size-icon)] w-[var(--size-icon)]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nouvelle conversation
          </Button>

          {/* Suggestions — shown when no conversations yet */}
          {conversations.length === 0 && canChat && (
            <div className="mb-6">
              <p className="mb-3 text-center text-small text-foreground-muted">
                Des idées pour commencer :
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(SUGGESTIONS_BY_AGE[ageBracket] ?? SUGGESTIONS_BY_AGE["9-14"]).map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={handleNewConversation}
                      className="flex items-start gap-2 rounded-card border border-border bg-surface px-3 py-3 text-left text-small font-medium text-foreground transition-all duration-fast ease-out hover:border-primary hover:bg-primary-light/60 focus:outline-none focus-visible:shadow-focus active:scale-[0.98]"
                      style={{ minHeight: "var(--size-touch-target)" }}
                    >
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" strokeLinejoin="round" />
                      </svg>
                      {suggestion}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {conversations.length === 0 ? (
            <EmptyState
              title="Pas encore de conversation"
              description="Commence-en une avec le bouton ci-dessus !"
            />
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-card bg-surface px-4 py-3 text-left shadow-card transition-all duration-fast ease-out hover:bg-surface-alt hover:shadow-modal focus:outline-none focus-visible:shadow-focus active:scale-[0.99]"
                  style={{ minHeight: "var(--size-touch-target)" }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-foreground">{conv.titre}</p>
                    <p className="text-tiny text-foreground-muted">
                      {new Date(conv.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-foreground-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
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
