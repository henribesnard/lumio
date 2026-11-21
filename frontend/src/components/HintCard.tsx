import type { ReactNode } from "react";
import { PedagogyCard } from "./PedagogyCard";

export type HintLevel = 1 | 2 | 3;

interface HintCardProps {
  /** niveau d'indice (1 = léger, 3 = fort) ; absent = indice sans niveau */
  level?: HintLevel | null;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Indice progressif — halo menthe, segments remplis selon le niveau.
 * Le niveau est aussi écrit en toutes lettres (« Indice 2 sur 3 »).
 */
export function HintCard({ level, children, footer }: HintCardProps) {
  const label = level ? `Indice ${level} sur 3` : "Indice";
  return (
    <PedagogyCard
      tone="hint"
      label={label}
      footer={footer}
      aside={
        level ? (
          <span className="flex gap-[0.3em]" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-[0.36em] w-[1.25em] rounded-full ${i <= level ? "bg-hint-ring" : "bg-hint-track"}`}
              />
            ))}
          </span>
        ) : undefined
      }
    >
      {children}
    </PedagogyCard>
  );
}
