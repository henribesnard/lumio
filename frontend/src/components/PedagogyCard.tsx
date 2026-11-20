import type { ReactNode } from "react";

export type PedagogyTone = "question" | "hint" | "example";

const TONE: Record<PedagogyTone, string> = {
  question:
    "bg-question-bg shadow-[inset_0_0_0_var(--ring-width)_var(--color-question-ring)]",
  hint: "bg-hint-bg shadow-[inset_0_0_0_var(--ring-width)_var(--color-hint-ring)]",
  example:
    "bg-example-bg shadow-[inset_0_0_0_var(--ring-width)_var(--color-example-ring)]",
};

const LABEL: Record<PedagogyTone, string> = {
  question: "text-question-text",
  hint: "text-hint-text",
  example: "text-example-text",
};

interface PedagogyCardProps {
  tone: PedagogyTone;
  label: ReactNode;
  /** élément aligné à droite du libellé (segments d'indice…) */
  aside?: ReactNode;
  children: ReactNode;
  /** pied de carte : lien vers la feuille, etc. */
  footer?: ReactNode;
}

/**
 * Carte « signature » de Lumio dans le chat (design Prisme) : halo coloré du
 * spectre — soleil = question, menthe = indice, ciel = exemple. Le libellé
 * texte porte toujours l'information (jamais la couleur seule).
 */
export function PedagogyCard({
  tone,
  label,
  aside,
  children,
  footer,
}: PedagogyCardProps) {
  return (
    <article
      className={`flex max-w-[40rem] flex-col gap-[0.3em] rounded-card px-[1.1em] py-[0.75em] text-foreground ${TONE[tone]}`}
    >
      <header className="flex items-center justify-between gap-3">
        <h3
          className={`font-sans text-label font-bold tracking-label [text-transform:var(--label-case)] ${LABEL[tone]}`}
        >
          {label}
        </h3>
        {aside}
      </header>
      <div className="whitespace-pre-wrap text-body leading-body">
        {children}
      </div>
      {footer}
    </article>
  );
}
