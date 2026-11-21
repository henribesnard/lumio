import { Component, type ReactNode } from "react";
import type { VisualSpec } from "@/api/types";
import { Chart } from "./Chart";
import { FractionBars } from "./FractionBars";
import { NumberLine } from "./NumberLine";
import { Shape } from "./Shape";
import { Timeline } from "./Timeline";

/** Texte alternatif : celui du serveur, sinon le titre. */
export function visualAlt(spec: VisualSpec) {
  return spec.alt || spec.title;
}

function Drawing({ spec }: { spec: VisualSpec }) {
  switch (spec.kind) {
    case "number_line":
      return <NumberLine spec={spec} />;
    case "fraction_bars":
      return <FractionBars spec={spec} />;
    case "chart":
      return <Chart spec={spec} />;
    case "shape":
      return <Shape spec={spec} />;
    case "timeline":
      return <Timeline spec={spec} />;
    default:
      throw new Error("type de visuel inconnu");
  }
}

class DrawingBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface VisualAidProps {
  spec: VisualSpec;
  /** affiche le titre au-dessus du dessin */
  showTitle?: boolean;
  animated?: boolean;
}

/**
 * Support visuel de Lumio : rendu en liste blanche à partir d'une
 * spécification validée par le serveur (jamais de SVG/HTML venant du modèle).
 * Toujours lisible par un lecteur d'écran (texte alternatif généré) ; en cas
 * d'erreur, le texte alternatif est affiché en clair.
 */
export function VisualAid({
  spec,
  showTitle = true,
  animated = true,
}: VisualAidProps) {
  const alt = visualAlt(spec);
  return (
    <figure className="m-0 flex flex-col gap-3 text-sheet-ink">
      {showTitle && (
        <figcaption className="font-display text-[1.375rem] font-bold leading-tight">
          {spec.title}
        </figcaption>
      )}
      <DrawingBoundary
        fallback={
          <div
            role="note"
            className="flex flex-col gap-1 rounded-input bg-sheet-tab p-4 text-small text-sheet-muted"
          >
            <strong className="text-sheet-ink">
              Ce dessin n'a pas pu s'afficher.
            </strong>
            {alt}
          </div>
        }
      >
        <div
          role="img"
          aria-label={alt}
          className={animated ? "sheet-draw" : undefined}
        >
          <Drawing spec={spec} />
        </div>
      </DrawingBoundary>
      {spec.caption && (
        <p className="m-0 text-small text-sheet-muted">{spec.caption}</p>
      )}
    </figure>
  );
}
