import { Badge } from "./Badge";
import { Button } from "./Button";

export const SAFETY_TYPE_LABELS: Record<string, string> = {
  distress: "Détresse",
  self_harm: "Auto-agression",
  abuse_disclosure: "Révélation de maltraitance",
  inappropriate_content: "Contenu inapproprié",
  personal_info_shared: "Info personnelle partagée",
  jailbreak_attempt: "Tentative de contournement",
  forbidden_topic: "Sujet interdit",
  pin_lockout: "Verrouillage PIN",
  quota_reached: "Quota atteint",
  visual_blocked: "Support visuel bloqué",
};

export const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critique",
  warning: "Avertissement",
  info: "Information",
};

/** Conduite à tenir (docs/SECURITY.md) rappelée sur les alertes critiques. */
const CRITICAL_GUIDANCE =
  "Lisez la conversation, puis parlez avec votre enfant. En cas de danger : 119 (enfance en danger), 3114 (prévention du suicide).";

export interface AlertCardEvent {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical" | string;
  extrait: string | null;
  created_at: string;
  acknowledged_at: string | null;
  conversation_id?: string | null;
}

interface AlertCardProps {
  event: AlertCardEvent;
  /** prénom de l'enfant concerné, si connu */
  prenom?: string;
  onAcknowledge?: (id: string) => void;
  onOpenConversation?: (conversationId: string) => void;
  compact?: boolean;
}

/**
 * Carte d'alerte de sécurité (admin). Gravité portée par le badge (icône +
 * texte), la bordure et la consigne — jamais par la couleur seule.
 */
export function AlertCard({
  event,
  prenom,
  onAcknowledge,
  onOpenConversation,
  compact = false,
}: AlertCardProps) {
  const critical = event.severity === "critical";
  const done = !!event.acknowledged_at;
  const variant = critical
    ? "critical"
    : event.severity === "warning"
      ? "warning"
      : "info";
  return (
    <article
      className={[
        "flex flex-wrap items-start justify-between gap-4 rounded-card bg-surface p-4 shadow-card",
        critical && !done
          ? "shadow-[inset_0_0_0_2px_var(--color-danger)]"
          : "shadow-[inset_0_0_0_1px_var(--color-border-subtle)]",
        done ? "opacity-80" : "",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant={variant}>
            {SEVERITY_LABELS[event.severity] ?? event.severity}
          </Badge>
          <h3 className="text-small font-semibold text-foreground">
            {SAFETY_TYPE_LABELS[event.type] || event.type}
            {prenom ? ` · ${prenom}` : ""}
          </h3>
        </div>
        {event.extrait && (
          <p
            className={`mt-1 text-small italic text-foreground-muted ${compact ? "truncate" : ""}`}
          >
            « {event.extrait} »
          </p>
        )}
        {critical && !done && !compact && (
          <p className="mt-2 text-small text-foreground">{CRITICAL_GUIDANCE}</p>
        )}
        <p className="mt-1 text-tiny text-foreground-muted">
          <time dateTime={event.created_at}>
            {new Date(event.created_at).toLocaleString("fr-FR")}
          </time>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {event.conversation_id && onOpenConversation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenConversation(event.conversation_id!)}
          >
            Lire la conversation
          </Button>
        )}
        {done ? (
          <Badge variant="success">
            Traitée le{" "}
            {new Date(event.acknowledged_at!).toLocaleDateString("fr-FR")}
          </Badge>
        ) : (
          onAcknowledge && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAcknowledge(event.id)}
            >
              Marquer comme traitée
            </Button>
          )
        )}
      </div>
    </article>
  );
}
