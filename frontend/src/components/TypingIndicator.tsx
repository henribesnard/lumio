export function TypingIndicator() {
  return (
    <div
      className="my-1 flex justify-start"
      role="status"
      aria-label="Lumio réfléchit"
    >
      <div className="flex items-center gap-1.5 rounded-card border border-border/60 bg-[var(--color-bubble-assistant)] px-4 py-3 shadow-card">
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:0ms]" />
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:150ms]" />
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:300ms]" />
      </div>
    </div>
  );
}
