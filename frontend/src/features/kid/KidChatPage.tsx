import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet } from "@/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import type { KidMeResponse, MessageResponse } from "@/api/types";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { Notice } from "@/components/Notice";
import { Avatar } from "@/components/Avatar";
import { Mascot } from "@/components/Mascot";

interface StreamedMessage extends MessageResponse {
  calm?: boolean;
}

export function KidChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<StreamedMessage[]>([]);
  const [me, setMe] = useState<KidMeResponse | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [notice, setNotice] = useState("");
  const [safetyNotice, setSafetyNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ageBracket = me ? (me.age <= 8 ? "6-8" : "9-14") : "9-14";

  useEffect(() => {
    if (!conversationId) return;
    Promise.all([
      apiGet<MessageResponse[]>(`/api/kid/conversations/${conversationId}/messages`),
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
      setSafetyNotice(false);

      try {
        // Get CSRF token
        const csrfMatch = document.cookie.split("; ").find((r) => r.startsWith("lumio_csrf="));
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
                  const isSafety =
                    Array.isArray(data.safety_events) && data.safety_events.length > 0;
                  const assistantMsg: StreamedMessage = {
                    id: data.message_id || `assistant-${Date.now()}`,
                    conversation_id: conversationId,
                    role: "assistant",
                    contenu: data.full_text,
                    created_at: new Date().toISOString(),
                    calm: isSafety,
                  };
                  setMessages((prev) => [...prev, assistantMsg]);
                  if (isSafety) setSafetyNotice(true);
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

  const inputDisabled =
    streaming || !!me?.hors_plage_horaire || (me?.quota_messages_restant ?? 0) <= 0;

  return (
    <div data-age={ageBracket} className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
        <button
          onClick={() => navigate("/chat")}
          className="inline-flex items-center gap-1 rounded-button px-2 py-1.5 text-small text-foreground-muted transition-colors duration-fast hover:bg-surface-alt hover:text-foreground focus:outline-none focus-visible:shadow-focus min-h-[var(--size-touch-target)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M19 12H5m7-7-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </button>
        <div className="flex items-center gap-2">
          <Mascot
            state={streaming ? (streamText ? "indice" : "reflechit") : "ecoute"}
            size={40}
            animated={streaming}
          />
          {me && <Avatar avatarKey={me.avatar} size="sm" alt={me.prenom} />}
          <span className="text-small font-semibold text-foreground">{me?.prenom}</span>
        </div>
        <button
          onClick={async () => {
            await logout();
            navigate("/select", { replace: true });
          }}
          className="rounded-button px-3 py-1.5 text-small text-foreground-muted transition-colors duration-fast hover:bg-surface-alt hover:text-foreground focus:outline-none focus-visible:shadow-focus min-h-[var(--size-touch-target)]"
        >
          Quitter
        </button>
      </header>

      {/* Notices */}
      {notice && (
        <div className="px-4 pt-3">
          <Notice variant="warning" onDismiss={() => setNotice("")}>
            {notice}
          </Notice>
        </div>
      )}
      {safetyNotice && (
        <div className="px-4 pt-3">
          <Notice variant="info">
            Tes parents ont été prévenus. Tu peux aussi appeler le <strong>119</strong> (urgences)
            ou le <strong>3018</strong> (harcèlement), gratuitement et à toute heure.
          </Notice>
        </div>
      )}
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

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-1">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Mascot state="indice" size={96} />
              <p className="text-body text-foreground-muted">
                Pose ta question pour commencer !
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="msg-in">
              {msg.role === "assistant" && !msg.calm ? (
                <div className="flex items-end gap-2">
                  <Mascot state="ecoute" size={32} animated={false} className="mb-1 shrink-0" />
                  <div className="max-w-[80%]">
                    <ChatBubble role="assistant">{msg.contenu}</ChatBubble>
                  </div>
                </div>
              ) : (
                <ChatBubble role={msg.role} calm={msg.calm}>
                  {msg.contenu}
                </ChatBubble>
              )}
            </div>
          ))}

          {/* Streaming text */}
          {streaming && streamText && (
            <div className="flex items-end gap-2 msg-in">
              <Mascot state="reflechit" size={32} className="mb-1 shrink-0" />
              <div className="max-w-[80%]">
                <ChatBubble role="assistant">{streamText}</ChatBubble>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {streaming && !streamText && (
            <div className="flex items-end gap-2">
              <Mascot state="reflechit" size={32} className="mb-1 shrink-0" />
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={inputDisabled}
        maxLength={1000}
        placeholder={
          me?.hors_plage_horaire
            ? "Lumio fait une pause pour l'instant…"
            : (me?.quota_messages_restant ?? 0) <= 0
              ? "On se retrouve demain !"
              : "Écris ton message..."
        }
      />

      {/* Footer */}
      <div className="border-t border-border bg-surface-alt px-4 py-1.5 text-center text-tiny text-foreground-muted">
        Tes parents peuvent lire tes conversations.
      </div>
    </div>
  );
}
