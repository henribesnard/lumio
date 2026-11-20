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
