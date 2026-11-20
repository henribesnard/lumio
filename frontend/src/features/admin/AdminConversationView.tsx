import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet } from "@/api/client";
import type { MessageResponse } from "@/api/types";
import { AdminLayout } from "./AdminLayout";

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
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-small text-foreground-muted hover:text-foreground"
        >
          ← Retour
        </button>
        <h2 className="mb-6 text-heading font-bold text-foreground">
          Conversation
        </h2>

        {loading ? (
          <div className="animate-pulse text-foreground-muted">
            Chargement...
          </div>
        ) : messages.length === 0 ? (
          <p className="text-foreground-muted">Aucun message.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-card border p-4 ${
                  msg.role === "child"
                    ? "border-info/20 bg-info/5"
                    : msg.role === "system_notice"
                      ? "border-warning/20 bg-warning/5"
                      : "border-border bg-surface"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`text-tiny font-semibold ${
                      msg.role === "child"
                        ? "text-info"
                        : msg.role === "system_notice"
                          ? "text-warning"
                          : "text-foreground-muted"
                    }`}
                  >
                    {msg.role === "child"
                      ? "Enfant"
                      : msg.role === "assistant"
                        ? "Lumio"
                        : "Système"}
                  </span>
                  <span className="text-tiny text-foreground-muted">
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-small text-foreground">
                  {msg.contenu}
                </p>

                {/* Moderation & guard details */}
                {(msg.moderation || msg.guard_verdict) && (
                  <details className="mt-2 border-t border-border pt-2">
                    <summary className="cursor-pointer text-tiny text-foreground-muted">
                      Détails modération
                    </summary>
                    <div className="mt-1 space-y-1 text-tiny text-foreground-muted">
                      {msg.moderation && (
                        <pre className="overflow-x-auto rounded bg-surface-alt p-2">
                          {JSON.stringify(msg.moderation, null, 2)}
                        </pre>
                      )}
                      {msg.guard_verdict && (
                        <pre className="overflow-x-auto rounded bg-surface-alt p-2">
                          {JSON.stringify(msg.guard_verdict, null, 2)}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                {msg.tokens_in !== undefined && msg.tokens_in > 0 && (
                  <p className="mt-1 text-tiny text-foreground-muted">
                    Tokens: {msg.tokens_in} in / {msg.tokens_out} out
                    {msg.modele && ` — ${msg.modele}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
