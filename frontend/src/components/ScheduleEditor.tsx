import { Button } from "./Button";
import { Toggle } from "./Toggle";
import {
  DAYS,
  MAX_SLOTS_PER_DAY,
  defaultSchedule,
  toMinutes,
  validateSchedule,
  type Schedule,
  type TimeSlot,
} from "./schedule";

interface ScheduleEditorProps {
  /** null = aucune restriction horaire */
  value: Schedule | null;
  onChange: (value: Schedule | null) => void;
  disabled?: boolean;
}

const timeClass =
  "min-h-[var(--size-touch-target)] rounded-input border border-border bg-surface px-2 text-small tabular-nums text-foreground focus:outline-none focus-visible:shadow-focus focus:border-primary";

/**
 * Éditeur de plages horaires (onglet Limites du profil).
 * - interrupteur « Limiter les horaires » (désactivé = connexion à tout moment) ;
 * - par jour : plages début/fin, ajout (4 max), suppression, jour fermé ;
 * - « Copier lundi sur la semaine » ; aperçu 0 h–24 h ;
 * - validation en direct (fin > début, pas de chevauchement), aussi côté API.
 */
export function ScheduleEditor({
  value,
  onChange,
  disabled = false,
}: ScheduleEditorProps) {
  const enabled = value !== null;
  const errors = value ? validateSchedule(value) : {};

  function setDay(day: string, slots: TimeSlot[]) {
    if (!value) return;
    onChange({ ...value, [day]: slots });
  }

  function updateSlot(day: string, i: number, patch: Partial<TimeSlot>) {
    const slots = [...(value?.[day] ?? [])];
    slots[i] = { ...slots[i], ...patch };
    setDay(day, slots);
  }

  function addSlot(day: string) {
    const slots = value?.[day] ?? [];
    const last = slots[slots.length - 1];
    const start = last ? last.fin : "16:30";
    const startMin = Math.min(toMinutes(start) + 30, 23 * 60);
    const h = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    setDay(day, [
      ...slots,
      { debut: h(startMin), fin: h(Math.min(startMin + 60, 23 * 60 + 59)) },
    ]);
  }

  function copyMondayToWeek() {
    if (!value) return;
    const monday = value.lundi ?? [];
    onChange({
      ...value,
      mardi: monday,
      mercredi: monday,
      jeudi: monday,
      vendredi: monday,
    });
  }

  return (
    <fieldset className="flex flex-col gap-4" disabled={disabled}>
      <legend className="sr-only">Horaires autorisés</legend>
      <Toggle
        checked={enabled}
        onChange={(on) => onChange(on ? defaultSchedule() : null)}
        label="Limiter les horaires de connexion"
      />
      {!enabled ? (
        <p className="text-small text-foreground-muted">
          Aucune restriction horaire : connexion autorisée à tout moment (dans
          la limite du quota).
        </p>
      ) : (
        <>
          <p className="text-small text-foreground-muted">
            En dehors de ces plages, Lumio fait une pause et l'enfant ne peut
            pas écrire. Un jour sans plage est fermé.
          </p>
          <ul className="flex flex-col divide-y divide-border-subtle rounded-card bg-surface shadow-[inset_0_0_0_1px_var(--color-border-subtle)]">
            {DAYS.map(({ key, label }) => {
              const slots = value?.[key] ?? [];
              const err = errors[key];
              return (
                <li
                  key={key}
                  className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[7rem_minmax(0,1fr)_12rem] md:items-center"
                >
                  <span className="text-small font-semibold text-foreground">
                    {label}
                  </span>
                  <div className="flex flex-col gap-2">
                    {slots.length === 0 && (
                      <span className="text-small text-foreground-muted">
                        Fermé
                      </span>
                    )}
                    {slots.map((slot, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center gap-2"
                        role="group"
                        aria-label={`${label}, plage ${i + 1}`}
                      >
                        <label className="flex items-center gap-1 text-small text-foreground-muted">
                          de
                          <input
                            type="time"
                            value={slot.debut}
                            aria-label={`${label}, plage ${i + 1}, début`}
                            aria-invalid={!!err || undefined}
                            onChange={(e) =>
                              updateSlot(key, i, { debut: e.target.value })
                            }
                            className={timeClass}
                          />
                        </label>
                        <label className="flex items-center gap-1 text-small text-foreground-muted">
                          à
                          <input
                            type="time"
                            value={slot.fin}
                            aria-label={`${label}, plage ${i + 1}, fin`}
                            aria-invalid={!!err || undefined}
                            onChange={(e) =>
                              updateSlot(key, i, { fin: e.target.value })
                            }
                            className={timeClass}
                          />
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Supprimer la plage ${i + 1} du ${label.toLowerCase()}`}
                          onClick={() =>
                            setDay(
                              key,
                              slots.filter((_, j) => j !== i),
                            )
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                    {slots.length < MAX_SLOTS_PER_DAY && (
                      <div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addSlot(key)}
                        >
                          + Ajouter une plage
                        </Button>
                      </div>
                    )}
                    {err && (
                      <p role="alert" className="text-small text-danger">
                        {err}
                      </p>
                    )}
                  </div>
                  <DayBar slots={slots} label={label} />
                </li>
              );
            })}
          </ul>
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyMondayToWeek}
            >
              Copier lundi sur mardi → vendredi
            </Button>
          </div>
        </>
      )}
    </fieldset>
  );
}

/** Aperçu d'une journée 0 h–24 h (décoratif ; l'information est dans les champs). */
function DayBar({ slots, label }: { slots: TimeSlot[]; label: string }) {
  return (
    <div aria-hidden="true" title={`Aperçu du ${label.toLowerCase()}`}>
      <div className="relative h-3 overflow-hidden rounded-full bg-surface-alt">
        {slots.map((s, i) => {
          const a = toMinutes(s.debut);
          const b = toMinutes(s.fin);
          if (!(b > a)) return null;
          return (
            <span
              key={i}
              className="absolute inset-y-0 rounded-full bg-primary"
              style={{
                left: `${(a / 1440) * 100}%`,
                width: `${((b - a) / 1440) * 100}%`,
              }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-tiny text-foreground-muted">
        <span>0 h</span>
        <span>12 h</span>
        <span>24 h</span>
      </div>
    </div>
  );
}
