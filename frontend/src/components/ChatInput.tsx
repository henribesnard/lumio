import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  /** libellé du bouton (6-8 portrait : « Envoyer » visible) */
  showSendLabel?: boolean;
}

/**
 * Zone de saisie « Prisme » : champ pilule cerclé de prisme (6-8) ou boîte
 * sombre (9-14), compteur « n / 1000 » dans le champ, bouton d'envoi rond.
 * Entrée envoie, Maj+Entrée va à la ligne.
 */
export function ChatInput({
  onSend,
  disabled = false,
  maxLength = 1000,
  placeholder = "Ta réponse…",
  showSendLabel = false,
}: ChatInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setText("");
    }
  }

  const nearLimit = text.length > maxLength * 0.9;

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-[0.6em]">
      <div
        className={[
          "flex min-h-send flex-1 items-center gap-2 rounded-[var(--radius-chat-input)] bg-surface pl-[1.1em] pr-[1em]",
          "shadow-[inset_0_0_0_var(--ring-width)_var(--color-chat-input-ring)] transition-shadow duration-fast",
          "focus-within:shadow-[inset_0_0_0_var(--ring-width)_var(--color-focus)]",
          disabled ? "bg-surface-alt" : "",
        ].join(" ")}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxLength))}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          aria-label={placeholder}
          className="max-h-32 min-w-0 flex-1 resize-none bg-transparent py-3 text-body leading-body text-foreground placeholder:text-foreground-muted focus:outline-none focus-visible:shadow-none disabled:cursor-not-allowed [field-sizing:content]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <span
          className={`shrink-0 text-tiny ${nearLimit ? "font-semibold text-warning" : "text-foreground-muted"}`}
          aria-hidden="true"
        >
          {text.length} / {maxLength}
        </span>
      </div>
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label={showSendLabel ? undefined : "Envoyer"}
        className={[
          "flex h-send shrink-0 items-center justify-center gap-2 rounded-[var(--radius-chat-input)] bg-primary font-bold text-on-primary",
          "transition-all duration-fast ease-out hover:bg-primary-hover active:scale-95 focus:outline-none focus-visible:shadow-focus",
          "disabled:cursor-not-allowed disabled:opacity-50",
          showSendLabel ? "px-[1.2em] text-body" : "w-send",
        ].join(" ")}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[var(--size-icon)] w-[var(--size-icon)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
        {showSendLabel && "Envoyer"}
      </button>
    </form>
  );
}
