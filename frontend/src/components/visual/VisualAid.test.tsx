// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VisualSpec } from "@/api/types";
import { VisualAid } from "./VisualAid";
import { VISUAL_SAMPLES } from "./samples";
import { LumioSheet } from "../LumioSheet";

afterEach(cleanup);

describe("VisualAid", () => {
  it.each(VISUAL_SAMPLES.map((v) => [v.kind, v] as const))(
    "rend %s avec son texte alternatif",
    (_kind, spec) => {
      const { container } = render(<VisualAid spec={spec} />);
      expect(screen.getByRole("img", { name: spec.alt })).toBeTruthy();
      expect(container.querySelector("svg")).toBeTruthy();
      // aucun contenu actif : ni script, ni objet étranger, ni image externe
      expect(
        container.querySelector("script, foreignObject, image"),
      ).toBeNull();
    },
  );

  it("marque les valeurs à trouver d'une case « ? »", () => {
    const { container } = render(<VisualAid spec={VISUAL_SAMPLES[2]} />);
    const texts = [...container.querySelectorAll("text")].map(
      (t) => t.textContent,
    );
    expect(texts).toContain("?");
  });

  it("droite graduée : la graduation masquée garde son trait mais pas son nombre", () => {
    const spec: VisualSpec = {
      kind: "number_line",
      title: "7 + 5",
      min: 10,
      max: 15,
      step: 1,
      masked: [12],
    };
    const { container } = render(<VisualAid spec={spec} />);
    const texts = [...container.querySelectorAll("text")].map(
      (t) => t.textContent,
    );
    expect(texts).toContain("11");
    expect(texts).toContain("13");
    expect(texts).not.toContain("12");
    // 6 graduations dessinées (10 → 15), dont celle de 12
    expect(container.querySelectorAll("svg > g > path")).toHaveLength(6);
  });

  it("pas fractionnaire : la graduation masquée (2/3) n'est pas écrite", () => {
    const spec: VisualSpec = {
      kind: "number_line",
      title: "1/3 + 1/3",
      min: 0,
      max: 1,
      step: 1 / 3,
      masked: [2 / 3],
    };
    const { container } = render(<VisualAid spec={spec} />);
    const texts = [...container.querySelectorAll("text")].map(
      (t) => t.textContent ?? "",
    );
    expect(texts.some((t) => t.startsWith("0,6"))).toBe(false);
    expect(texts).toContain("0,333333");
  });

  it("graphique : la graduation de l'axe égale à la valeur cherchée n'est pas écrite", () => {
    const spec: VisualSpec = {
      kind: "chart",
      title: "Points",
      chart_type: "bar",
      x_labels: ["a", "b"],
      series: [{ name: "s", values: [5, 11] }],
      masked: [12],
    };
    const { container } = render(<VisualAid spec={spec} />);
    const texts = [...container.querySelectorAll("text")].map(
      (t) => t.textContent,
    );
    // axe 0 → 20 gradué de 4 en 4 : 12 est masqué, les autres restent
    expect(texts).toEqual(expect.arrayContaining(["0", "4", "8", "16", "20"]));
    expect(texts).not.toContain("12");
  });

  it("graphique : graduation à mi-chemin (−3,595) masquée malgré l'arrondi flottant", () => {
    // 1,5 − 5,095 = −3,595 ; valeurs [−4,99375 ; 1] → graduation calculée −3,595
    const spec: VisualSpec = {
      kind: "chart",
      title: "Écarts",
      chart_type: "bar",
      x_labels: ["a", "b"],
      series: [{ name: "s", values: [-4.99375, 1] }],
      masked: [-3.595],
    };
    const { container } = render(<VisualAid spec={spec} />);
    const texts = [...container.querySelectorAll("text")].map(
      (t) => t.textContent ?? "",
    );
    expect(
      texts.some((t) => t.startsWith("-3,59") || t.startsWith("-3,6")),
    ).toBe(false);
  });

  it("repli lisible si le type est inconnu", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <VisualAid
        spec={
          {
            kind: "svg",
            title: "x",
            alt: "Description en clair",
          } as unknown as VisualSpec
        }
      />,
    );
    expect(screen.getByText("Ce dessin n'a pas pu s'afficher.")).toBeTruthy();
    expect(screen.getByText("Description en clair")).toBeTruthy();
    spy.mockRestore();
  });

  it("affiche les étiquettes comme du texte (jamais du HTML)", () => {
    const spec: VisualSpec = {
      kind: "timeline",
      title: "<b>Titre</b>",
      events: [
        { year: 1, label: "<img src=x>" },
        { year: 2, label: "b" },
      ],
    };
    const { container } = render(<VisualAid spec={spec} />);
    expect(container.querySelector("b, img")).toBeNull();
    expect(screen.getByText("<b>Titre</b>")).toBeTruthy();
  });
});

describe("LumioSheet", () => {
  it("affiche la page active et ses onglets", () => {
    const pages = VISUAL_SAMPLES.slice(0, 2).map((v, i) => ({
      id: String(i),
      visual: v,
    }));
    render(<LumioSheet pages={pages} active={1} onSelect={() => {}} />);
    expect(
      screen.getByRole("region", { name: "Feuille de Lumio, page 2 sur 2" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Feuille 2, affichée" }),
    ).toBeTruthy();
    expect(screen.getByText(VISUAL_SAMPLES[1].title)).toBeTruthy();
  });
  it("ne rend rien sans page", () => {
    const { container } = render(
      <LumioSheet pages={[]} active={0} onSelect={() => {}} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
