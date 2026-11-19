/**
 * Point d'entrée de la page /__design/components (prévisualisation des composants).
 *
 * Monté uniquement en mode maquette + dev (voir main.tsx) : jamais dans le
 * build de production. La prévisualisation des pistes de la phase 1 a été
 * retirée après validation de la piste retenue (voir docs/design/DIRECTION.md).
 */
import ReactDOM from "react-dom/client";

import { ComponentsPage } from "./ComponentsPage";

import "./preview.css";

export function renderDesignPreview() {
  ReactDOM.createRoot(document.getElementById("root")!).render(<ComponentsPage />);
}
