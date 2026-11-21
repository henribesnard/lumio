/**
 * API types — mirrors backend Pydantic schemas.
 * Generated manually; will be replaced by openapi-typescript when openapi.json is exported.
 */

export interface AuthMeResponse {
  role: "admin" | "kid";
  admin_id?: string;
  profile_id?: string;
  prenom?: string;
}

export interface ProfilePublic {
  id: string;
  prenom: string;
  avatar: string;
  actif: boolean;
  locked?: boolean;
  hors_plage_horaire?: boolean;
}

export interface ProfileResponse {
  id: string;
  prenom: string;
  age: number;
  niveau: string;
  avatar: string;
  consignes_admin: string | null;
  sujets_interdits: string[];
  modele: string | null;
  supports_visuels?: boolean;
  quota_messages_jour: number;
  quota_tokens_jour: number;
  plages_horaires: Record<string, { debut: string; fin: string }[]> | null;
  actif: boolean;
  failed_pin_count: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationResponse {
  id: string;
  profile_id: string;
  titre: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  role: "child" | "assistant" | "system_notice";
  contenu: string;
  /** type pédagogique du message de Lumio (absent = message normal) */
  kind?: MessageKind | null;
  /** niveau d'indice 1 (léger) → 3 (fort), pour kind = "hint" */
  hint_level?: number | null;
  /** support visuel validé (« feuille de Lumio »), absent = pas de dessin */
  visual?: VisualSpec | null;
  tokens_in?: number;
  tokens_out?: number;
  modele?: string;
  moderation?: Record<string, unknown>;
  guard_verdict?: Record<string, unknown>;
  created_at: string;
}

export type MessageKind =
  "question" | "hint" | "example" | "success" | "explanation" | "safety";

export interface KidMeResponse {
  prenom: string;
  avatar: string;
  age: number;
  quota_messages_jour: number;
  quota_messages_restant: number;
  quota_tokens_restant: number;
  hors_plage_horaire: boolean;
}

export interface SafetyEventResponse {
  id: string;
  profile_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  type: string;
  severity: "info" | "warning" | "critical";
  extrait: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface StatsResponse {
  period_days: number;
  total_messages: number;
  total_tokens_in: number;
  total_tokens_out: number;
  active_profiles: number;
  safety_events_by_severity: Record<string, number>;
  usage_by_profile: {
    profile_id: string;
    prenom: string;
    messages: number;
    tokens_in: number;
    tokens_out: number;
  }[];
}

export interface DeviceResponse {
  id: string;
  label: string;
  last_seen_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface LearnerNotesResponse {
  id: string;
  matiere: string;
  notes: string;
  updated_at: string;
}

/* ---------- Supports visuels (docs/VISUAL_AIDS.md) ---------- */
export type VisualLayer = "known" | "hint";

interface VisualBase {
  title: string;
  caption?: string;
  /** texte alternatif généré côté serveur depuis la spécification */
  alt?: string;
}

export interface NumberLineVisual extends VisualBase {
  kind: "number_line";
  min: number;
  max: number;
  step: number;
  marks?: { value: number; label?: string }[];
  jumps?: { start: number; end: number; label?: string; layer?: VisualLayer }[];
  /**
   * Graduations dont le nombre n'est jamais écrit (valeur cherchée par
   * l'enfant, ajoutée par le serveur tant qu'il n'a pas trouvé).
   */
  masked?: number[];
}

export interface FractionBarsVisual extends VisualBase {
  kind: "fraction_bars";
  bars: {
    parts: number;
    shaded: number;
    label?: string;
    layer?: VisualLayer;
  }[];
}

export interface ChartVisual extends VisualBase {
  kind: "chart";
  chart_type: "bar" | "line";
  x_labels: string[];
  series: { name: string; values: (number | null)[] }[];
  y_label?: string;
}

export interface ShapeVisual extends VisualBase {
  kind: "shape";
  figure: "rectangle" | "triangle" | "circle";
  width?: number;
  height?: number;
  radius?: number;
  base_label?: string;
  height_label?: string;
  radius_label?: string;
  inside_label?: string;
  grid?: boolean;
  twin?: boolean;
}

export interface TimelineVisual extends VisualBase {
  kind: "timeline";
  events: { year?: number | null; label: string }[];
}

export type VisualSpec =
  | NumberLineVisual
  | FractionBarsVisual
  | ChartVisual
  | ShapeVisual
  | TimelineVisual;
