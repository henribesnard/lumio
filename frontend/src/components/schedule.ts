/**
 * Plages horaires d'un profil — format partagé avec le backend
 * (`profile.plages_horaires`) : { "lundi": [{ "debut": "16:30", "fin": "18:00" }], … }.
 * Sémantique (backend/app/services/quota.py) : `null` = aucune restriction ;
 * dès qu'une plage existe, un jour sans plage est un jour fermé.
 */
export interface TimeSlot {
  debut: string;
  fin: string;
}
export type Schedule = Record<string, TimeSlot[]>;

export const DAYS = [
  { key: "lundi", label: "Lundi", short: "Lun." },
  { key: "mardi", label: "Mardi", short: "Mar." },
  { key: "mercredi", label: "Mercredi", short: "Mer." },
  { key: "jeudi", label: "Jeudi", short: "Jeu." },
  { key: "vendredi", label: "Vendredi", short: "Ven." },
  { key: "samedi", label: "Samedi", short: "Sam." },
  { key: "dimanche", label: "Dimanche", short: "Dim." },
] as const;

export const MAX_SLOTS_PER_DAY = 4;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Erreurs par jour (clé = jour, valeur = message lisible). Vide = valide. */
export function validateSchedule(schedule: Schedule): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const { key, label } of DAYS) {
    const slots = schedule[key] ?? [];
    if (slots.length > MAX_SLOTS_PER_DAY) {
      errors[key] = `${label} : ${MAX_SLOTS_PER_DAY} plages au maximum.`;
      continue;
    }
    for (const s of slots) {
      if (!TIME_RE.test(s.debut) || !TIME_RE.test(s.fin)) {
        errors[key] = `${label} : heure invalide (format HH:MM).`;
        break;
      }
      if (toMinutes(s.debut) >= toMinutes(s.fin)) {
        errors[key] = `${label} : la fin doit être après le début.`;
        break;
      }
    }
    if (errors[key]) continue;
    const sorted = [...slots].sort(
      (a, b) => toMinutes(a.debut) - toMinutes(b.debut),
    );
    for (let i = 1; i < sorted.length; i++) {
      if (toMinutes(sorted[i].debut) < toMinutes(sorted[i - 1].fin)) {
        errors[key] = `${label} : deux plages se chevauchent.`;
        break;
      }
    }
  }
  return errors;
}

const ALIASES: Record<string, string> = {
  lun: "lundi",
  mar: "mardi",
  mer: "mercredi",
  jeu: "jeudi",
  ven: "vendredi",
  sam: "samedi",
  dim: "dimanche",
  mon: "lundi",
  tue: "mardi",
  wed: "mercredi",
  thu: "jeudi",
  fri: "vendredi",
  sat: "samedi",
  sun: "dimanche",
  monday: "lundi",
  tuesday: "mardi",
  wednesday: "mercredi",
  thursday: "jeudi",
  friday: "vendredi",
  saturday: "samedi",
  sunday: "dimanche",
};

/**
 * Ramène les clés héritées de l'ancienne page admin (« lun », « mon »,
 * « monday »…) au nom français canonique, en fusionnant les plages.
 * Même règle que le backend (validate_plages_horaires).
 */
export function canonicalizeDays(schedule: Schedule): Schedule {
  const out: Schedule = {};
  for (const [key, slots] of Object.entries(schedule)) {
    const k = key.trim().toLowerCase();
    const day = DAYS.some((d) => d.key === k) ? k : ALIASES[k];
    if (!day) continue;
    out[day] = [...(out[day] ?? []), ...(slots ?? [])];
  }
  return out;
}

/** Trie les plages et retire les jours inconnus ; garde les jours vides (= fermés). */
export function normalizeSchedule(schedule: Schedule): Schedule {
  const out: Schedule = {};
  for (const { key } of DAYS) {
    out[key] = [...(schedule[key] ?? [])].sort(
      (a, b) => toMinutes(a.debut) - toMinutes(b.debut),
    );
  }
  return out;
}

/** Proposition par défaut quand on active la restriction. */
export function defaultSchedule(): Schedule {
  const weekday = [{ debut: "16:30", fin: "19:00" }];
  const weekend = [{ debut: "10:00", fin: "12:00" }];
  return {
    lundi: weekday,
    mardi: weekday,
    mercredi: [{ debut: "14:00", fin: "18:00" }],
    jeudi: weekday,
    vendredi: weekday,
    samedi: weekend,
    dimanche: weekend,
  };
}

/**
 * Valeur stockée → valeur de l'éditeur : `null` ou `{}` = aucune restriction
 * (comme côté serveur), clés héritées ramenées aux noms français.
 */
export function toEditorSchedule(
  value: Record<string, TimeSlot[]> | null | undefined,
): Schedule | null {
  if (!value || Object.keys(value).length === 0) return null;
  return canonicalizeDays(value);
}
