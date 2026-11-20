import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet } from "@/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import type { KidMeResponse, MessageResponse } from "@/api/types";

export function KidChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [me, setMe] = useState<KidMeResponse | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [inputText, setInputText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ageBracket = me ? (me.age <= 8 ? "6-8" : "9-14") : "9-14";

  useEffect(() => {
    if (!conversationId) return;
    Promise.all([
      apiGet<MessageResponse[]>(
        `/api/kid/conversations/${conversationId}/messages`,
      ),
      apiGet<KidMeResponse>("/api/kid/me"),
    ])
      .then(([msgs, meData]) => {
        setMessages(msgs);
        setMe(meData);
      })
      .catch(() => navigate("/chat", { replace: true }))
      .finally(() => setLoading(false));
  }, [conversationId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || streaming) return;

      // Add child message optimistically
      const tempMsg: MessageResponse = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        role: "child",
        contenu: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);
      setStreaming(true);
      setStreamText("");
      setNotice("");

      try {
        // Get CSRF token
        const csrfMatch = document.cookie
          .split("; ")
          .find((r) => r.startsWith("lumio_csrf="));
        const csrf = csrfMatch ? csrfMatch.split("=")[1] : "";

        const response = await fetch(
          `/api/kid/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrf,
            },
            credentials: "same-origin",
            body: JSON.stringify({ contenu: text }),
          },
        );

        if (!response.ok || !response.body) {
          throw new Error("SSE connection failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));

              if (eventType === "token") {
                fullText += data.text;
                setStreamText(fullText);
              } else if (eventType === "notice") {
                setNotice(data.message);
              } else if (eventType === "error") {
                setNotice(data.message);
              } else if (eventType === "done") {
                // Add the complete assistant message
                if (data.full_text) {
                  const assistantMsg: MessageResponse = {
                    id: data.message_id || `assistant-${Date.now()}`,
                    conversation_id: conversationId,
                    role: "assistant",
                    contenu: data.full_text,
                    created_at: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, assistantMsg]);
                }
                setStreamText("");
              }
              eventType = "";
            }
          }
        }
      } catch {
        setNotice("Oups, un problème est survenu. Réessaie !");
      } finally {
        setStreaming(false);
      }
    },
    [conversationId, streaming],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (trimmed && !streaming) {
      sendMessage(trimmed);
      setInputText("");
    }
  }

  if (loading) {
    return (
      <div
        data-age={ageBracket}
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <div className="animate-pulse text-foreground-muted text-heading">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div data-age={ageBracket} className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <button
          onClick={() => navigate("/chat")}
          className="text-small text-foreground-muted hover:text-foreground"
        >
          ← Retour
        </button>
        <div className="flex items-center gap-2">
          {me && (
            <img
              src={`/avatars/${me.avatar}.svg`}
              alt={me.prenom}
              className="h-[var(--size-avatar-sm)] w-[var(--size-avatar-sm)]"
            />
          )}
          <span className="text-small font-medium text-foreground">
            {me?.prenom}
          </span>
        </div>
        <button
          onClick={async () => {
            await logout();
            navigate("/select", { replace: true });
          }}
          className="text-small text-foreground-muted hover:text-foreground"
        >
          Quitter
        </button>
      </header>

      {/* Notice */}
      {notice && (
        <div className="bg-warning/10 px-4 py-2 text-center text-small text-warning">
          {notice}
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-1">
          {messages.length === 0 && !streaming && (
            <div className="py-12 text-center text-body text-foreground-muted">
              Pose ta question pour commencer !
            </div>
          )}

          {messages.map((msg) => {
            if (msg.role === "system_notice") {
              return (
                <div
                  key={msg.id}
                  className="mx-auto my-2 max-w-md rounded-input bg-[var(--color-bubble-notice)] px-4 py-2 text-center text-small text-[var(--color-bubble-notice-text)]"
                >
                  {msg.contenu}
                </div>
              );
            }
            const isChild = msg.role === "child";
            return (
              <div
                key={msg.id}
                className={`flex ${isChild ? "justify-end" : "justify-start"} my-1`}
              >
                <div
                  className={`max-w-[80%] rounded-card px-4 py-3 text-body whitespace-pre-wrap ${
                    isChild
                      ? "bg-[var(--color-bubble-child)] text-[var(--color-bubble-child-text)]"
                      : "bg-[var(--color-bubble-assistant)] text-[var(--color-bubble-assistant-text)] shadow-card"
                  }`}
                >
                  {msg.contenu}
                </div>
              </div>
            );
          })}

          {/* Streaming text */}
          {streaming && streamText && (
            <div className="flex justify-start my-1">
              <div className="max-w-[80%] rounded-card bg-[var(--color-bubble-assistant)] px-4 py-3 text-body text-[var(--color-bubble-assistant-text)] shadow-card whitespace-pre-wrap">
                {streamText}
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {streaming && !streamText && (
            <div className="flex justify-start my-1">
              <div className="flex items-center gap-1 rounded-card bg-[var(--color-bubble-assistant)] px-4 py-3 shadow-card">
                <span
                  className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border bg-surface p-3"
      >
        <div className="relative flex-1">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
            disabled={
              streaming ||
              me?.hors_plage_horaire ||
              (me?.quota_messages_restant ?? 0) <= 0
            }
            placeholder="Écris ton message..."
            rows={1}
            className="w-full resize-none rounded-input border border-border bg-surface-alt px-3 py-2 text-body text-foreground outline-none focus:border-primary disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <span className="absolute bottom-1 right-2 text-tiny text-foreground-muted">
            {inputText.length}/1000
          </span>
        </div>
        <button
          type="submit"
          disabled={streaming || !inputText.trim()}
          className="flex items-center justify-center rounded-button bg-primary px-4 text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          style={{
            minHeight: "var(--size-touch-target)",
            minWidth: "var(--size-touch-target)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </form>

      {/* Footer */}
      <div className="border-t border-border bg-surface-alt px-4 py-1 text-center text-tiny text-foreground-muted">
        Tes parents peuvent lire tes conversations.
      </div>
    </div>
  );
}
