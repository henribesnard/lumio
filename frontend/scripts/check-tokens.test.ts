/**
 * Test vitest : les design tokens doivent être complets et conformes
 * (variables toutes définies, pas de hex en dur, contrastes AA).
 * Rend `npm test` vert et sert de garde-fou en CI.
 */
import { describe, expect, it } from "vitest";
import { formatReport, runChecks } from "./check-tokens.ts";

describe("design tokens", () => {
  it("toutes les variables utilisées sont définies et les contrastes passent AA", () => {
    const errors = runChecks();
    expect(formatReport(errors)).toBe(
      "OK: tous les tokens sont définis, sans hex en dur, contrastes AA/AA-UI respectés.",
    );
  });
});
