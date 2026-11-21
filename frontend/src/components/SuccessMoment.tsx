import type { ReactNode } from "react";
import { Mascot } from "./Mascot";

interface SuccessMomentProps {
  children: ReactNode;
  /** rayons animés (coupés automatiquement si mouvement réduit) */
  animated?: boolean;
}

/**
 * Moment de réussite : le prisme s'irise (seul moment où il le fait).
 * Félicite l'effort et le raisonnement — aucun badge, aucun score, aucune
 * série, rien à collectionner.
 */
export function SuccessMoment({
  children,
  animated = true,
}: SuccessMomentProps) {
  return (
    <article className="flex max-w-[40rem] items-center gap-[0.9em] rounded-card bg-success-moment-bg px-[1.1em] py-[0.75em] text-foreground shadow-[inset_0_0_0_var(--ring-width)_var(--color-primary)]">
      <Mascot
        state="bravo"
        size={72}
        animated={animated}
        label=""
        className="shrink-0"
      />
      <div className="flex flex-col gap-[0.3em]">
        <h3 className="font-sans text-label font-bold tracking-label text-link [text-transform:var(--label-case)]">
          Tu as trouvé !
        </h3>
        <div className="whitespace-pre-wrap text-body leading-body">
          {children}
        </div>
      </div>
    </article>
  );
}
