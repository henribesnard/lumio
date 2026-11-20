import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  maxLength = 1000,
  placeholder = "Écris ton message...",
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
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-border bg-surface p-3"
    >
      <div className="relative flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxLength))}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          aria-label={placeholder}
          className="w-full resize-none rounded-input border border-border bg-surface-alt px-3 py-2 pr-16 text-body text-foreground leading-body transition-colors duration-fast ease-out placeholder:text-foreground-muted focus:outline-none focus-visible:shadow-focus focus:border-primary disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <span
          className={`absolute bottom-1 right-2 text-tiny ${nearLimit ? "text-warning font-semibold" : "text-foreground-muted"}`}
          aria-hidden="true"
        >
          {text.length}/{maxLength}
        </span>
      </div>
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Envoyer le message"
        className="flex h-touch w-touch shrink-0 items-center justify-center rounded-button bg-primary text-on-dark transition-all duration-fast ease-out hover:bg-primary-hover active:scale-95 focus:outline-none focus-visible:shadow-focus disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-[var(--size-icon)] w-[var(--size-icon)]"
          aria-hidden="true"
        >
          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
        </svg>
      </button>
    </form>
  );
}
