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
import { Logo } from "@/components/Logo";
import { QuotaIndicator } from "@/components/QuotaIndicator";
import { ExitIcon, ParentsNotice } from "@/components/KidChrome";

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
  const [conversations, setConversations] = useState<ConversationResponse[]>(
    [],
  );
  const [me, setMe] = useState<KidMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const ageBracket = me ? (me.age <= 8 ? "6-8" : "9-14") : "9-14";
  const canChat =
    !me?.hors_plage_horaire && (me?.quota_messages_restant ?? 0) > 0;

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
      const conv = await apiPost<ConversationResponse>(
        "/api/kid/conversations",
        {},
      );
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
      <div
        data-age={ageBracket}
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <div className="flex flex-col items-center gap-4">
          <Mascot state="ecoute" size={88} />
          <div className="animate-pulse text-foreground-muted text-heading">
            Chargement…
          </div>
        </div>
      </div>
    );
  }

  const quotaTotal = me?.quota_messages_jour ?? 50;
  const quotaRestant = me?.quota_messages_restant ?? 0;
  const suggestions =
    SUGGESTIONS_BY_AGE[ageBracket] ?? SUGGESTIONS_BY_AGE["9-14"];

  return (
    <div
      data-age={ageBracket}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Logo height={40} onDark={ageBracket === "9-14"} />
        <div className="flex items-center gap-3">
          {me && (
            <div className="flex min-h-[var(--size-touch-target)] items-center gap-3 rounded-full bg-surface py-1 pl-1 pr-5 shadow-card">
              <Avatar avatarKey={me.avatar} size="sm" alt="" />
              <span className="font-display text-body font-bold">
                {me.prenom}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex min-h-[var(--size-touch-target)] items-center gap-2 rounded-full px-5 text-body font-medium text-foreground shadow-[inset_0_0_0_2px_var(--color-border-subtle)] transition-colors duration-fast hover:bg-surface-alt focus:outline-none focus-visible:shadow-focus"
          >
            <ExitIcon />
            Quitter
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-6 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <section className="flex items-center gap-5 pt-2">
            <Mascot
              state={canChat ? "ecoute" : "pause"}
              size={96}
              label=""
              className="shrink-0"
            />
            <div className="flex flex-col gap-2">
              <h1 className="text-heading font-bold">Salut {me?.prenom} !</h1>
              {me && (
                <QuotaIndicator remaining={quotaRestant} total={quotaTotal} />
              )}
            </div>
          </section>

          {/* Notices */}
          {me?.hors_plage_horaire && (
            <Notice variant="warning">
              Ce n'est pas le moment de discuter avec Lumio. Reviens pendant les
              heures autorisées !
            </Notice>
          )}
          {me && me.quota_messages_restant <= 0 && (
            <Notice variant="info">
              Tu as utilisé tous tes messages pour aujourd'hui. On se retrouve
              demain !
            </Notice>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleNewConversation}
            disabled={!canChat}
            className="w-full"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[var(--size-icon)] w-[var(--size-icon)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nouvelle conversation
          </Button>

          {/* Suggestions — quand il n'y a pas encore de conversation */}
          {conversations.length === 0 && canChat && (
            <section aria-labelledby="idees">
              <h2
                id="idees"
                className="mb-3 font-sans text-label font-bold tracking-label text-foreground-muted [text-transform:var(--label-case)]"
              >
                Des idées pour commencer
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={suggestion}
                    onClick={handleNewConversation}
                    className={`flex min-h-[var(--size-touch-target)] items-center gap-3 rounded-card px-4 py-3 text-left text-body font-medium text-foreground transition-all duration-fast ease-out hover:-translate-y-0.5 focus:outline-none focus-visible:shadow-focus active:scale-[0.98] ${SUGGESTION_TONES[i % SUGGESTION_TONES.length]}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>
          )}

          {conversations.length === 0 ? (
            <EmptyState
              illustration="conversations"
              title="Pas encore de conversation"
              description="Commence-en une avec le bouton ci-dessus !"
            />
          ) : (
            <section aria-labelledby="mes-conversations">
              <h2
                id="mes-conversations"
                className="mb-3 font-sans text-label font-bold tracking-label text-foreground-muted [text-transform:var(--label-case)]"
              >
                Mes conversations
              </h2>
              <ul className="flex flex-col gap-3">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      className="flex min-h-[var(--size-touch-target)] w-full items-center justify-between gap-3 rounded-card bg-surface px-5 py-3 text-left shadow-card transition-all duration-fast ease-out hover:bg-surface-alt focus:outline-none focus-visible:shadow-focus active:scale-[0.99]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-body font-medium text-foreground">
                          {conv.titre}
                        </p>
                        <p className="text-tiny text-foreground-muted">
                          {new Date(conv.updated_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-[var(--size-icon)] w-[var(--size-icon)] shrink-0 text-link"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        aria-hidden="true"
                      >
                        <path
                          d="M9 6l6 6-6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      <ParentsNotice />
    </div>
  );
}

/** Suggestions aux couleurs du spectre (soleil, menthe, ciel). */
const SUGGESTION_TONES = [
  "bg-question-bg shadow-[inset_0_0_0_var(--ring-width)_var(--color-question-ring)]",
  "bg-hint-bg shadow-[inset_0_0_0_var(--ring-width)_var(--color-hint-ring)]",
  "bg-example-bg shadow-[inset_0_0_0_var(--ring-width)_var(--color-example-ring)]",
  "bg-surface shadow-[inset_0_0_0_var(--ring-width)_var(--color-primary)]",
];
