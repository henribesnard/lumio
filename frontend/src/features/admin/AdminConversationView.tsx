import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { apiGet } from "@/api/client";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";

import type { MessageResponse } from "@/api/types";

import { AdminLayout } from "./AdminLayout";
import { VisualAid } from "@/components/visual/VisualAid";

function roleMeta(role: MessageResponse["role"]): {
  label: string;
  badge: "info" | "success" | "warning";
} {
  if (role === "child") return { label: "Enfant", badge: "info" };
  if (role === "assistant") return { label: "Lumio", badge: "success" };
  return { label: "Avis système", badge: "warning" };
}

export function AdminConversationView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    apiGet<MessageResponse[]>(
      `/api/admin/conversations/${conversationId}/messages`,
    )
      .then(setMessages)
      .catch(() => navigate("/admin", { replace: true }))
      .finally(() => setLoading(false));
  }, [conversationId, navigate]);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[var(--size-icon)] w-[var(--size-icon)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Retour
        </Button>
        <h1 className="mb-6 text-heading font-bold text-foreground">
          Conversation
        </h1>

        {loading ? (
          <p className="animate-pulse text-body text-foreground-muted">
            Chargement...
          </p>
        ) : messages.length === 0 ? (
          <EmptyState
            title="Aucun message"
            description="Cette conversation est vide."
          />
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const meta = roleMeta(msg.role);
              const hasGuard = !!(msg.moderation || msg.guard_verdict);
              return (
                <Card key={msg.id} className="!p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={meta.badge}>{meta.label}</Badge>
                    {msg.kind && (
                      <KindTag kind={msg.kind} level={msg.hint_level} />
                    )}
                    {hasGuard && (
                      <Badge variant="warning">Modération appliquée</Badge>
                    )}
                    <span className="ml-auto text-tiny text-foreground-muted">
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-small text-foreground leading-body">
                    {msg.contenu}
                  </p>

                  {msg.visual && (
                    <div className="mt-3 rounded-input bg-sheet p-4 shadow-[inset_0_0_0_1px_var(--color-border-subtle)]">
                      <p className="mb-2 text-tiny font-semibold text-sheet-muted">
                        Feuille de Lumio jointe
                      </p>
                      <VisualAid spec={msg.visual} animated={false} />
                      <details className="mt-2">
                        <summary className="cursor-pointer rounded-button text-tiny font-medium text-sheet-muted focus:outline-none focus-visible:shadow-focus">
                          Spécification du visuel
                        </summary>
                        <pre className="mt-1 overflow-x-auto rounded-input bg-surface-alt p-2 font-mono text-tiny text-foreground">
                          {JSON.stringify(msg.visual, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  {/* Détails modération & garde-fou */}
                  {hasGuard && (
                    <details className="mt-3 border-t border-border pt-2">
                      <summary className="cursor-pointer rounded-button text-tiny font-medium text-foreground-muted hover:text-foreground focus:outline-none focus-visible:shadow-focus">
                        Détails de modération et de garde-fou
                      </summary>
                      <div className="mt-2 space-y-2">
                        {msg.moderation && (
                          <div>
                            <p className="mb-1 text-tiny font-semibold text-foreground">
                              Modération
                            </p>
                            <pre className="overflow-x-auto rounded-input bg-surface-alt p-2 font-mono text-tiny text-foreground">
                              {JSON.stringify(msg.moderation, null, 2)}
                            </pre>
                          </div>
                        )}
                        {msg.guard_verdict && (
                          <div>
                            <p className="mb-1 text-tiny font-semibold text-foreground">
                              Garde-fou
                            </p>
                            <pre className="overflow-x-auto rounded-input bg-surface-alt p-2 font-mono text-tiny text-foreground">
                              {JSON.stringify(msg.guard_verdict, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {msg.tokens_in !== undefined && msg.tokens_in > 0 && (
                    <p className="mt-2 text-tiny text-foreground-muted">
                      Tokens : {msg.tokens_in} en entrée / {msg.tokens_out} en
                      sortie
                      {msg.modele ? ` — ${msg.modele}` : ""}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const KIND_LABEL: Record<string, string> = {
  question: "Question",
  hint: "Indice",
  example: "Exemple analogue",
  success: "Réussite",
  explanation: "Explication",
  safety: "Réponse de sécurité",
};

const KIND_DOT: Record<string, string> = {
  question: "bg-ray-sun",
  hint: "bg-ray-mint",
  example: "bg-ray-sky",
  success: "bg-primary",
  explanation: "bg-border",
  safety: "bg-mascot-calm",
};

/** Type pédagogique du message de Lumio (libellé + pastille du spectre). */
function KindTag({ kind, level }: { kind: string; level?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-0.5 text-tiny font-medium text-foreground">
      <span
        className={`h-2 w-2 rounded-full ${KIND_DOT[kind] ?? "bg-border"}`}
        aria-hidden="true"
      />
      {KIND_LABEL[kind] ?? kind}
      {kind === "hint" && level ? ` ${level}/3` : ""}
    </span>
  );
}
