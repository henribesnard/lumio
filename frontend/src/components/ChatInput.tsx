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
          className="w-full resize-none rounded-input border border-border bg-surface-alt px-3 py-2 text-body text-foreground outline-none focus:border-primary disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <span className="absolute bottom-1 right-2 text-tiny text-foreground-muted">
          {text.length}/{maxLength}
        </span>
      </div>
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="flex h-touch w-touch items-center justify-center rounded-button bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
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
  );
}
