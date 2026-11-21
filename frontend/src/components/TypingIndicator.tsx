import { Mascot } from "./Mascot";

/** « Lumio réfléchit » : prisme incliné + 3 points (statiques si mouvement réduit). */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" role="status">
      <Mascot state="reflechit" size={44} label="" />
      <div className="flex items-center gap-1.5 rounded-bubble rounded-bl-bubble-tail bg-bubble-assistant px-4 py-3 shadow-card">
        <span className="sr-only">Lumio réfléchit…</span>
        <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
        <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
        <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
      </div>
    </div>
  );
}
