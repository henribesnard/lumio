/**
 * Point d'entrée des pages /__design* (prévisualisation design).
 * Monté uniquement en mode maquette + dev (voir main.tsx) : jamais dans le
 * build de production.
 */
import ReactDOM from "react-dom/client";
import { PistesPage } from "./PistesPage";
import { ComponentsPage } from "./ComponentsPage";
import "./preview.css";

export function renderDesignPreview() {
  const path = window.location.pathname;
  const page = path.startsWith("/__design/components") ? <ComponentsPage /> : <PistesPage />;
  ReactDOM.createRoot(document.getElementById("root")!).render(page);
}
