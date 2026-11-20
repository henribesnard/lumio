// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TutorMessage } from "./TutorMessage";
import { QuotaIndicator } from "./QuotaIndicator";

afterEach(cleanup);

describe("TutorMessage", () => {
  it("affiche une question avec son libellé", () => {
    render(<TutorMessage kind="question">Combien ?</TutorMessage>);
    expect(screen.getByText("Question pour toi")).toBeTruthy();
    expect(screen.getByText("Combien ?")).toBeTruthy();
  });
  it("affiche le niveau d'indice en toutes lettres", () => {
    render(
      <TutorMessage kind="hint" hintLevel={2}>
        Regarde la boîte
      </TutorMessage>,
    );
    expect(screen.getByText("Indice 2 sur 3")).toBeTruthy();
  });
  it("ignore un niveau d'indice invalide", () => {
    render(
      <TutorMessage kind="hint" hintLevel={9}>
        Indice
      </TutorMessage>,
    );
    expect(screen.getByRole("heading", { name: "Indice" })).toBeTruthy();
  });
  it("affiche un exemple et une réussite", () => {
    render(
      <>
        <TutorMessage kind="example">Après le bain…</TutorMessage>
        <TutorMessage kind="success">Bravo pour ta méthode</TutorMessage>
      </>,
    );
    expect(screen.getByText("Un exemple que tu connais")).toBeTruthy();
    expect(screen.getByText("Tu as trouvé !")).toBeTruthy();
  });
  it("message de sécurité : sobre, avec les numéros d'aide", () => {
    const { container } = render(
      <TutorMessage kind="safety">Je suis là pour toi.</TutorMessage>,
    );
    expect(screen.getByText("119")).toBeTruthy();
    expect(screen.getByText("3018")).toBeTruthy();
    // aucune animation festive
    expect(container.querySelector(".prism-rays")).toBeNull();
  });
  it("repli : type absent ou inconnu → bulle normale", () => {
    render(
      <>
        <TutorMessage>Bonjour</TutorMessage>
        <TutorMessage kind="reponse">Salut</TutorMessage>
      </>,
    );
    expect(screen.getByText("Bonjour")).toBeTruthy();
    expect(screen.getByText("Salut")).toBeTruthy();
    expect(screen.queryByText("Question pour toi")).toBeNull();
  });
});

describe("QuotaIndicator", () => {
  it("présente le quota positivement", () => {
    render(<QuotaIndicator remaining={3} total={50} />);
    expect(screen.getByText("Encore 3 messages aujourd'hui")).toBeTruthy();
  });
  it("à zéro : à demain", () => {
    render(<QuotaIndicator remaining={0} total={50} />);
    expect(
      screen.getByText("À demain pour de nouvelles questions !"),
    ).toBeTruthy();
  });
});
