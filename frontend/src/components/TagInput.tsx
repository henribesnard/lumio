import { useState } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Ajouter...",
}: TagInputProps) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const tag = input.trim();
      if (!tags.includes(tag)) {
        onChange([...tags, tag]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-input border border-border bg-surface-alt px-2 py-1.5 transition-colors duration-fast focus-within:border-primary">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-tiny font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            aria-label={`Retirer ${tag}`}
            className="rounded-full p-0.5 transition-colors hover:bg-danger-bg hover:text-danger focus:outline-none focus-visible:shadow-focus"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        aria-label={placeholder}
        className="min-w-[80px] flex-1 bg-transparent py-1 text-small text-foreground placeholder:text-foreground-muted outline-none"
      />
    </div>
  );
}
