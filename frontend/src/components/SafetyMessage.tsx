import type { ReactNode } from "react";
import { Mascot } from "./Mascot";

interface SafetyMessageProps {
  children: ReactNode;
  /** rappel des numéros d'aide gratuits (119, 3018) */
  showHelplines?: boolean;
}

/**
 * Réponse de sécurité : sobre et calme. Mascotte « réconfort » (désaturée,
 * sans rayon), aucune animation, aucune couleur d'alerte, aucune feuille.
 * Les numéros d'aide sont grands et lisibles.
 */
export function SafetyMessage({
  children,
  showHelplines = true,
}: SafetyMessageProps) {
  return (
    <article
      aria-label="Message de Lumio"
      className="flex max-w-[40rem] flex-col gap-[0.6em] rounded-card bg-safety-bg px-[1.1em] py-[0.9em] text-foreground shadow-[inset_0_0_0_var(--ring-width)_var(--color-safety-ring)]"
    >
      <div className="flex items-start gap-[0.8em]">
        <Mascot
          state="reconfort"
          size={56}
          animated={false}
          label=""
          className="shrink-0"
        />
        <div className="whitespace-pre-wrap text-body leading-body">
          {children}
        </div>
      </div>
      {showHelplines && (
        <div className="flex flex-col gap-[0.4em] border-t border-border-subtle pt-[0.6em] text-small text-foreground">
          <p>
            Tes parents ont été prévenus. Tu peux aussi appeler, gratuitement et
            à toute heure :
          </p>
          <ul className="flex flex-wrap gap-x-[1.5em] gap-y-[0.3em]">
            <li>
              <a
                href="tel:119"
                className="font-display text-subheading font-bold text-foreground no-underline"
              >
                119
              </a>{" "}
              enfance en danger
            </li>
            <li>
              <a
                href="tel:3018"
                className="font-display text-subheading font-bold text-foreground no-underline"
              >
                3018
              </a>{" "}
              harcèlement
            </li>
          </ul>
        </div>
      )}
    </article>
  );
}
