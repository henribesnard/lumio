interface ChatBubbleProps {
  role: "child" | "assistant" | "system_notice";
  children: React.ReactNode;
  /** état « sécurité » : sobre, aucune animation festive */
  calm?: boolean;
}

export function ChatBubble({ role, children, calm = false }: ChatBubbleProps) {
  if (role === "system_notice") {
    return (
      <div className="mx-auto my-2 max-w-md rounded-input border border-warning/30 bg-[var(--color-bubble-notice)] px-4 py-2 text-center text-small text-[var(--color-bubble-notice-text)]">
        {children}
      </div>
    );
  }

  const isChild = role === "child";
  return (
    <div className={`flex ${isChild ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={`max-w-[80%] rounded-card px-4 py-3 text-body whitespace-pre-wrap leading-body ${
          isChild
            ? "bg-[var(--color-bubble-child)] text-[var(--color-bubble-child-text)] rounded-br-sm"
            : calm
              ? "border border-border bg-[var(--color-bubble-assistant)] text-[var(--color-bubble-assistant-text)] rounded-bl-sm"
              : "bg-[var(--color-bubble-assistant)] text-[var(--color-bubble-assistant-text)] shadow-card border border-border/60 rounded-bl-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
