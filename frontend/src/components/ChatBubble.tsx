interface ChatBubbleProps {
  role: "child" | "assistant" | "system_notice";
  children: React.ReactNode;
  /** état « sécurité » : sobre, aucune animation festive */
  calm?: boolean;
}

/**
 * Bulle de chat « Prisme » : l'enfant écrit en violet prisme (à droite, coin
 * bas-droit pincé) ; Lumio sur surface neutre (à gauche). Les messages typés
 * de Lumio (question, indice, exemple, réussite) utilisent TutorMessage.
 */
export function ChatBubble({ role, children, calm = false }: ChatBubbleProps) {
  if (role === "system_notice") {
    return (
      <div className="mx-auto my-2 max-w-md rounded-input bg-bubble-notice px-4 py-2 text-center text-small text-bubble-notice-text">
        {children}
      </div>
    );
  }

  const isChild = role === "child";
  return (
    <div className={`flex ${isChild ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-bubble px-[1.25em] py-[0.65em] text-body leading-body",
          isChild
            ? "rounded-br-bubble-tail bg-bubble-child text-bubble-child-text"
            : calm
              ? "border border-border-subtle bg-bubble-assistant text-bubble-assistant-text"
              : "rounded-bl-bubble-tail bg-bubble-assistant text-bubble-assistant-text shadow-card",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
