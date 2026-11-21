import { useState } from "react";
import type { VisualSpec } from "@/api/types";
import { Modal } from "./Modal";
import { VisualAid } from "./visual/VisualAid";

export interface SheetPage {
  id: string;
  visual: VisualSpec;
}

interface LumioSheetProps {
  pages: SheetPage[];
  active: number;
  onSelect: (index: number) => void;
  /** registre : pastilles numérotées (6-8) ou onglets « n · titre » (9-14) */
  variant?: "young" | "older";
  /** portrait / mobile : la feuille peut se replier */
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  className?: string;
}

function SheetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.6em] w-[1.6em] shrink-0"
      fill="none"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ stroke: "var(--color-sheet-prism)" }}
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

const iconBtn =
  "flex h-[var(--size-touch-target)] min-w-[var(--size-touch-target)] items-center justify-center gap-2 rounded-button px-3 font-medium text-sheet-ink shadow-[inset_0_0_0_2px_var(--color-sheet-grid)] transition-colors duration-fast hover:bg-sheet-tab focus:outline-none focus-visible:shadow-focus";

/**
 * « Feuille de Lumio » (design Prisme) : page blanche où Lumio dessine, même
 * en mode sombre. Une page par message illustré ; onglets numérotés ;
 * « Agrandir » ouvre une modale large. Jamais de feuille sur un message de
 * sécurité (filtré en amont).
 */
export function LumioSheet({
  pages,
  active,
  onSelect,
  variant = "young",
  collapsible = false,
  collapsed = false,
  onToggleCollapsed,
  className = "",
}: LumioSheetProps) {
  const [zoom, setZoom] = useState(false);
  if (pages.length === 0) return null;
  const index = Math.min(Math.max(active, 0), pages.length - 1);
  const page = pages[index];
  const tabsGroup = (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label="Pages de la feuille"
    >
      {pages.map((p, i) => {
        const current = i === index;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              onSelect(i);
              if (collapsed) onToggleCollapsed?.();
            }}
            aria-current={current || undefined}
            aria-label={
              variant === "young"
                ? `Feuille ${i + 1}${current ? ", affichée" : ""}`
                : undefined
            }
            className={[
              "flex h-[var(--size-touch-target)] items-center justify-center font-bold transition-colors duration-fast focus:outline-none focus-visible:shadow-focus",
              variant === "young"
                ? `w-[var(--size-touch-target)] rounded-full ${current ? "bg-sheet-prism text-on-dark" : "bg-sheet-tab text-sheet-ink"}`
                : `max-w-[14rem] truncate rounded-input px-3 ${current ? "bg-sheet-tab-active text-sheet-tab-active-text" : "font-medium text-sheet-muted hover:bg-sheet-tab"}`,
            ].join(" ")}
          >
            {variant === "young" ? i + 1 : `${i + 1} · ${p.visual.title}`}
          </button>
        );
      })}
    </div>
  );
  return (
    <section
      aria-label={`Feuille de Lumio, page ${index + 1} sur ${pages.length}`}
      className={`flex min-h-0 flex-col overflow-hidden rounded-sheet bg-sheet text-sheet-ink shadow-sheet ${className}`}
    >
      <div className="flex min-h-[4.25rem] flex-wrap items-center gap-2 border-b-[1.5px] border-sheet-rule px-4 py-2 text-small">
        {variant === "young" && <SheetIcon />}
        <h2 className="mr-2 text-[1.05rem] font-bold">Feuille de Lumio</h2>
        {variant === "young" && tabsGroup}
        <div className="flex-1" />
        {collapsible && (
          <button
            type="button"
            className={iconBtn}
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d={collapsed ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"} />
            </svg>
            {collapsed ? "Voir" : "Réduire"}
          </button>
        )}
        <button
          type="button"
          className={iconBtn}
          aria-label="Agrandir la feuille"
          onClick={() => setZoom(true)}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>
      {variant === "older" && (
        <div className="overflow-x-auto border-b-[1.5px] border-sheet-rule px-3 py-1.5 text-small">
          {tabsGroup}
        </div>
      )}
      {!collapsed && (
        <div
          tabIndex={0}
          aria-label="Dessin de la feuille"
          className="min-h-0 flex-1 overflow-y-auto focus-visible:shadow-[inset_0_0_0_3px_var(--color-focus)] px-6 py-5 [background-image:radial-gradient(var(--color-sheet-grid)_1.2px,transparent_1.2px)] [background-size:24px_24px]"
        >
          <VisualAid key={page.id} spec={page.visual} />
        </div>
      )}
      <Modal
        open={zoom}
        onClose={() => setZoom(false)}
        title="Feuille de Lumio"
        size="wide"
      >
        <div className="rounded-input bg-sheet p-4">
          <VisualAid spec={page.visual} animated={false} />
        </div>
      </Modal>
    </section>
  );
}
