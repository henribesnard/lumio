/** Exemples de chaque type de visuel (page /__design/components et tests). */
import type { VisualSpec } from "@/api/types";

export const VISUAL_SAMPLES: VisualSpec[] = [
  {
    kind: "number_line",
    title: "7 + 5 sur la droite",
    min: 0,
    max: 15,
    step: 1,
    marks: [{ value: 7 }],
    jumps: [
      { start: 0, end: 7, layer: "known" },
      { start: 7, end: 10, label: "+3", layer: "hint" },
    ],
    masked: [12],
    alt: "7 + 5 sur la droite. Droite graduée de 0 à 15. Repère 7. Saut de 0 à 7, connu. Saut de 7 à 10 (+3), ajouté par l'indice.",
  },
  {
    kind: "fraction_bars",
    title: "Un tiers et un quart",
    bars: [
      { parts: 3, shaded: 1, label: "1/3" },
      { parts: 4, shaded: 1, label: "1/4" },
      { parts: 12, shaded: 4, label: "?", layer: "hint" },
    ],
    alt: "Un tiers et un quart. 1/3 : barre en 3 parts, 1 coloriée. 1/4 : barre en 4 parts, 1 coloriée. Une barre en 12 parts, 4 ajoutées par l'indice.",
  },
  {
    kind: "chart",
    title: "Livres lus",
    chart_type: "bar",
    x_labels: ["lun.", "mar.", "mer.", "jeu."],
    series: [{ name: "Livres", values: [2, 4, 3, null] }],
    alt: "Livres lus. Diagramme en barres. Livres — lun. : 2, mar. : 4, mer. : 3, jeu. : à trouver.",
  },
  {
    kind: "chart",
    title: "Prix des places",
    chart_type: "line",
    x_labels: ["1", "2", "3", "4", "5"],
    series: [{ name: "Prix (€)", values: [4, 8, 12, 16, null] }],
    alt: "Prix des places. Courbe. Prix — 1 : 4, 2 : 8, 3 : 12, 4 : 16, 5 : à trouver.",
  },
  {
    kind: "shape",
    title: "Deux triangles",
    figure: "triangle",
    width: 6,
    height: 4,
    base_label: "base 6 cm",
    height_label: "hauteur 4 cm",
    inside_label: "?",
    grid: true,
    twin: true,
    alt: "Deux triangles. Triangle, base 6 cm, hauteur 4 cm ; un deuxième triangle identique ajouté par l'indice complète un rectangle.",
  },
  {
    kind: "shape",
    title: "Le cercle",
    figure: "circle",
    radius: 3,
    radius_label: "r = 3 cm",
    inside_label: "diamètre = ?",
    alt: "Le cercle. Cercle de rayon 3 cm, diamètre à trouver.",
  },
  {
    kind: "timeline",
    title: "De la Révolution à l'abolition",
    events: [
      { year: 1789, label: "Révolution" },
      { year: 1804, label: "Empire" },
      { year: null, label: "Abolition" },
    ],
    alt: "Frise : Révolution (1789), Empire (1804), Abolition (date à trouver).",
  },
];
