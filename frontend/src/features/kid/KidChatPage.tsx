import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost } from "@/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import type {
  ConversationResponse,
  KidMeResponse,
  MessageResponse,
} from "@/api/types";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { Notice } from "@/components/Notice";
import { Avatar } from "@/components/Avatar";
import { Mascot } from "@/components/Mascot";
import { TutorMessage } from "@/components/TutorMessage";
import {
  BackIcon,
  ExitIcon,
  EyeIcon,
  ParentsNotice,
  PrismMark,
} from "@/components/KidChrome";

interface StreamedMessage extends MessageResponse {
  calm?: boolean;
  /** reçu pendant cette session (animations autorisées) */
  fresh?: boolean;
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
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
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
    // Titre de la conversation (en-tête 9-14) : lecture seule, non bloquant.
    apiGet<ConversationResponse[]>("/api/kid/conversations")
      .then((convs) =>
        setTitle(convs.find((c) => c.id === conversationId)?.titre ?? ""),
      )
      .catch(() => {});
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
                  // Réponse de sécurité : uniquement sur événement critique
                  // (détresse, auto-agression, maltraitance).
                  const isSafety =
                    data.kind === "safety" ||
                    (Array.isArray(data.safety_events) &&
                      data.safety_events.some(
                        (e: { severity?: string }) => e.severity === "critical",
                      ));
                  const assistantMsg: StreamedMessage = {
                    id: data.message_id || `assistant-${Date.now()}`,
                    conversation_id: conversationId,
                    role: "assistant",
                    contenu: data.full_text,
                    created_at: new Date().toISOString(),
                    kind: isSafety ? "safety" : (data.kind ?? null),
                    hint_level: data.hint_level ?? null,
                    calm: isSafety,
                    fresh: true,
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

  async function handleNewConversation() {
    try {
      const conv = await apiPost<ConversationResponse>(
        "/api/kid/conversations",
        {},
      );
      navigate(`/chat/${conv.id}`);
    } catch {
      // silencieux : le bouton reste disponible
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
          <div className="animate-pulse text-heading text-foreground-muted">
            Chargement…
          </div>
        </div>
      </div>
    );
  }

  const outOfHours = !!me?.hors_plage_horaire;
  const quotaEmpty = !!me && me.quota_messages_restant <= 0;
  const inputDisabled = streaming || outOfHours || quotaEmpty;
  const isYoung = ageBracket === "6-8";
  const thread = (
    <div className="flex flex-col gap-[0.9rem]">
      {messages.length === 0 && !streaming && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Mascot state="ecoute" size={104} />
          <p className="text-body text-foreground-muted">
            Pose ta question pour commencer !
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className="msg-in">
          {msg.role === "assistant" ? (
            <AssistantRow msg={msg} />
          ) : (
            <ChatBubble role={msg.role}>{msg.contenu}</ChatBubble>
          )}
        </div>
      ))}

      {/* Texte en cours de réception */}
      {streaming && streamText && (
        <div className="msg-in flex items-end gap-2">
          <Mascot state="reflechit" size={44} label="" className="shrink-0" />
          <ChatBubble role="assistant">{streamText}</ChatBubble>
        </div>
      )}

      {/* Lumio réfléchit */}
      {streaming && !streamText && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );

  const notices = (
    <>
      {notice && (
        <Notice variant="warning" onDismiss={() => setNotice("")}>
          {notice}
        </Notice>
      )}
      {outOfHours && (
        <Notice variant="warning">
          Ce n'est pas le moment de discuter avec Lumio. Reviens pendant les
          heures autorisées !
        </Notice>
      )}
      {quotaEmpty && (
        <Notice variant="info">
          Tu as utilisé tous tes messages pour aujourd'hui. On se retrouve
          demain !
        </Notice>
      )}
    </>
  );

  const input = (
    <ChatInput
      onSend={sendMessage}
      disabled={inputDisabled}
      maxLength={1000}
      showSendLabel={false}
      placeholder={
        outOfHours
          ? "Lumio fait une pause pour l'instant…"
          : quotaEmpty
            ? "On se retrouve demain !"
            : isYoung
              ? "Ta réponse…"
              : "Écris à Lumio…"
      }
    />
  );

  /* ---------- 6-8 : clair, gros boutons, chat pleine largeur ---------- */
  if (isYoung) {
    return (
      <div
        data-age="6-8"
        className="flex h-screen flex-col bg-background text-foreground"
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex min-h-[var(--size-touch-target)] items-center gap-2 rounded-full bg-surface py-2 pl-3 pr-5 text-body font-medium shadow-card transition-colors duration-fast hover:bg-surface-alt focus:outline-none focus-visible:shadow-focus"
          >
            <BackIcon />
            Retour
          </button>
          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden min-h-[var(--size-touch-target)] items-center gap-3 rounded-full bg-surface py-1 pl-1 pr-5 shadow-card sm:flex">
                <Avatar avatarKey={me.avatar} size="sm" alt="" />
                <span className="font-display text-body font-bold">
                  {me.prenom}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex min-h-[var(--size-touch-target)] items-center gap-2 rounded-full px-5 text-body font-medium shadow-[inset_0_0_0_2px_var(--color-border-subtle)] transition-colors duration-fast hover:bg-surface-alt focus:outline-none focus-visible:shadow-focus"
            >
              <ExitIcon />
              Quitter
            </button>
          </div>
        </header>

        <main
          tabIndex={0}
          aria-label="Fil de la conversation"
          className="flex-1 overflow-y-auto px-4 pb-2 focus-visible:shadow-[inset_0_0_0_3px_var(--color-focus)] sm:px-8"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-3">{thread}</div>
        </main>

        <footer className="px-4 pb-2 pt-2 sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {notices}
            {input}
          </div>
          <ParentsNotice className="!justify-start sm:!justify-center" />
        </footer>
      </div>
    );
  }

  /* ---------- 9-14 : sombre « étude », rail de navigation ---------- */
  return (
    <div
      data-age="9-14"
      className="grid h-screen grid-cols-[4.5rem_minmax(0,1fr)] bg-background text-foreground"
    >
      <nav
        aria-label="Navigation"
        className="flex flex-col items-center gap-3 bg-nav px-3 py-4"
      >
        <PrismMark size={36} />
        <button
          type="button"
          onClick={handleNewConversation}
          aria-label="Nouvelle conversation"
          disabled={outOfHours || quotaEmpty}
          className="mt-3 flex h-12 w-12 items-center justify-center rounded-button bg-primary text-on-primary transition-colors duration-fast hover:bg-primary-hover focus:outline-none focus-visible:shadow-focus disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[var(--size-icon)] w-[var(--size-icon)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => navigate("/chat")}
          aria-label="Mes conversations"
          className="flex h-12 w-12 items-center justify-center rounded-button text-foreground-muted shadow-[inset_0_0_0_1.5px_var(--color-border-subtle)] transition-colors duration-fast hover:text-foreground focus:outline-none focus-visible:shadow-focus"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[var(--size-icon)] w-[var(--size-icon)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
        <div className="flex-1" />
        {me && <Avatar avatarKey={me.avatar} size="sm" alt={me.prenom} />}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Quitter"
          className="flex h-12 w-12 items-center justify-center rounded-button text-foreground shadow-[inset_0_0_0_1.5px_var(--color-border-subtle)] transition-colors duration-fast hover:bg-surface focus:outline-none focus-visible:shadow-focus"
        >
          <ExitIcon />
        </button>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3 sm:px-7">
          <h1 className="truncate text-subheading font-bold">
            {title || "Conversation avec Lumio"}
          </h1>
          <div className="flex-1" />
          <span className="hidden items-center gap-1.5 text-tiny text-foreground-muted sm:flex">
            <EyeIcon />
            Tes parents peuvent lire tes conversations
          </span>
        </header>

        <main
          tabIndex={0}
          aria-label="Fil de la conversation"
          className="flex-1 overflow-y-auto px-4 py-4 focus-visible:shadow-[inset_0_0_0_3px_var(--color-focus)] sm:px-7"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-3">{thread}</div>
        </main>

        <footer className="px-4 pb-4 sm:px-7">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {notices}
            {input}
          </div>
          <ParentsNotice className="sm:hidden" />
        </footer>
      </div>
    </div>
  );
}

/** Message de Lumio : carte typée (question, indice, exemple…) ou bulle. */
function AssistantRow({ msg }: { msg: StreamedMessage }) {
  return (
    <TutorMessage
      kind={msg.calm ? "safety" : msg.kind}
      hintLevel={msg.hint_level}
      animated={!!msg.fresh}
    >
      {msg.contenu}
    </TutorMessage>
  );
}
