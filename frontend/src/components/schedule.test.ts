import { describe, expect, it } from "vitest";
import {
  canonicalizeDays,
  toEditorSchedule,
  defaultSchedule,
  normalizeSchedule,
  validateSchedule,
} from "./schedule";

describe("validateSchedule", () => {
  it("accepte le planning par défaut", () => {
    expect(validateSchedule(defaultSchedule())).toEqual({});
  });
  it("refuse une fin avant le début", () => {
    const errors = validateSchedule({
      lundi: [{ debut: "18:00", fin: "17:00" }],
    });
    expect(errors.lundi).toMatch(/après le début/);
  });
  it("refuse les chevauchements", () => {
    const errors = validateSchedule({
      mardi: [
        { debut: "10:00", fin: "12:00" },
        { debut: "11:30", fin: "13:00" },
      ],
    });
    expect(errors.mardi).toMatch(/chevauchent/);
  });
  it("refuse plus de 4 plages", () => {
    const slots = [0, 1, 2, 3, 4].map((i) => ({
      debut: `0${i}:00`,
      fin: `0${i}:30`,
    }));
    expect(validateSchedule({ mercredi: slots }).mercredi).toMatch(/4 plages/);
  });
  it("refuse un format d'heure invalide", () => {
    expect(
      validateSchedule({ jeudi: [{ debut: "9h", fin: "10:00" }] }).jeudi,
    ).toMatch(/HH:MM/);
  });
});

describe("normalizeSchedule", () => {
  it("trie les plages et garde les 7 jours", () => {
    const out = normalizeSchedule({
      lundi: [
        { debut: "14:00", fin: "15:00" },
        { debut: "08:00", fin: "09:00" },
      ],
    });
    expect(Object.keys(out)).toHaveLength(7);
    expect(out.lundi[0].debut).toBe("08:00");
    expect(out.dimanche).toEqual([]);
  });
});

describe("canonicalizeDays", () => {
  it("convertit les clés héritées et fusionne les plages", () => {
    expect(
      canonicalizeDays({
        mon: [{ debut: "08:00", fin: "09:00" }],
        lundi: [{ debut: "17:00", fin: "18:00" }],
        sam: [],
      }),
    ).toEqual({
      lundi: [
        { debut: "08:00", fin: "09:00" },
        { debut: "17:00", fin: "18:00" },
      ],
      samedi: [],
    });
  });
});

describe("toEditorSchedule", () => {
  it("{} ou null = aucune restriction (éditeur désactivé)", () => {
    expect(toEditorSchedule({})).toBeNull();
    expect(toEditorSchedule(null)).toBeNull();
  });
  it("normalise les clés héritées", () => {
    expect(
      toEditorSchedule({ mon: [{ debut: "08:00", fin: "09:00" }] }),
    ).toEqual({
      lundi: [{ debut: "08:00", fin: "09:00" }],
    });
  });
});
