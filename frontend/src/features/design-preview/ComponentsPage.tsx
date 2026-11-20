/**
 * /__design/components — chaque composant dans chacun de ses états, pour chaque
 * thème (6-8 / 9-14 / admin). Mode maquette uniquement (monté via main.tsx en
 * dev + VITE_USE_MOCKS, jamais dans le build de production).
 */
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Logo } from "@/components/Logo";
import { Mascot, MASCOT_STATES, type MascotState } from "@/components/Mascot";
import { Modal } from "@/components/Modal";
import { Notice } from "@/components/Notice";
import { PinPad } from "@/components/PinPad";
import { ProfileCard } from "@/components/ProfileCard";
import { Table } from "@/components/Table";
import { Tabs } from "@/components/Tabs";
import { TagInput } from "@/components/TagInput";
import { ToastProvider, useToast } from "@/components/Toast";
import { Toggle } from "@/components/Toggle";
import { TypingIndicator } from "@/components/TypingIndicator";
import { MASCOT_LABEL } from "@/components/Mascot";
import { QuestionCard } from "@/components/QuestionCard";
import { HintCard } from "@/components/HintCard";
import { ExampleCard } from "@/components/ExampleCard";
import { SuccessMoment } from "@/components/SuccessMoment";
import { SafetyMessage } from "@/components/SafetyMessage";
import { TutorMessage } from "@/components/TutorMessage";
import { QuotaIndicator } from "@/components/QuotaIndicator";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { defaultSchedule, type Schedule } from "@/components/schedule";
import { AlertCard } from "@/components/AlertCard";
import { Illustration, ILLUSTRATIONS } from "@/components/Illustration";

type Theme = { attr: string; label: string; desc: string };
const THEMES: Theme[] = [
  {
    attr: 'data-age="6-8"',
    label: "6-8 ans",
    desc: "Clair « Prisme » : Lexend 22 px, rayons 28 px, cibles ≥ 56 px",
  },
  {
    attr: 'data-age="9-14"',
    label: "9-14 ans",
    desc: "Sombre « étude » : Lexend 17 px, rayons 16 px, la feuille reste blanche",
  },
  {
    attr: 'data-theme="admin"',
    label: "Admin",
    desc: "Clair, sobre, desktop ; titres Unbounded",
  },
];

function parseAttr(attr: string): Record<string, string> {
  const m = attr.match(/^data-([a-z-]+)="([^"]+)"$/);
  return m ? { [`data-${m[1]}`]: m[2] } : {};
}

function Demo({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dp-sample">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function ButtonsDemo() {
  return (
    <Demo title="Button — variants × états">
      <div className="dp-row">
        <Button variant="primary">Primaire</Button>
        <Button variant="secondary">Secondaire</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div className="dp-row mt-2">
        <Button variant="primary" size="sm">
          Petit
        </Button>
        <Button variant="primary" size="md">
          Moyen
        </Button>
        <Button variant="primary" size="lg">
          Grand
        </Button>
      </div>
      <div className="dp-row mt-2">
        <Button variant="primary" disabled>
          Désactivé
        </Button>
        <Button variant="primary" loading>
          Chargement…
        </Button>
        <Button variant="secondary" autoFocus>
          Focus (autoFocus)
        </Button>
      </div>
    </Demo>
  );
}

function InputsDemo() {
  return (
    <>
      <Demo title="Input — défaut">
        <Input label="Email" placeholder="parent@exemple.fr" />
      </Demo>
      <Demo title="Input — erreur">
        <Input
          label="Email"
          defaultValue="invalide"
          error="Adresse email invalide."
        />
      </Demo>
      <Demo title="Input — désactivé">
        <Input label="Champ verrouillé" disabled placeholder="Non modifiable" />
      </Demo>
    </>
  );
}

function PinPadDemo() {
  const [pin, setPin] = useState("12");
  const [errPin, setErrPin] = useState("5678");
  return (
    <>
      <Demo title="PinPad — saisie">
        <PinPad value={pin} onChange={setPin} />
      </Demo>
      <Demo title="PinPad — erreur">
        <PinPad
          value={errPin}
          onChange={setErrPin}
          error="Code incorrect, réessaie."
        />
      </Demo>
      <Demo title="PinPad — vérification (loading)">
        <PinPad value="5678" onChange={() => {}} loading />
      </Demo>
      <Demo title="PinPad — désactivé">
        <PinPad value="12" onChange={() => {}} disabled />
      </Demo>
    </>
  );
}

function AvatarsDemo() {
  return (
    <Demo title="Avatar — tailles">
      <div className="dp-row">
        <Avatar avatarKey="avatar-01" size="sm" alt="Léa" />
        <Avatar avatarKey="avatar-05" size="md" alt="Noah" />
        <Avatar avatarKey="avatar-09" size="lg" alt="Inès" />
      </div>
    </Demo>
  );
}

function ProfileCardsDemo() {
  return (
    <Demo title="ProfileCard — états">
      <div className="flex flex-wrap gap-3">
        <ProfileCard
          prenom="Léa"
          avatar="avatar-01"
          status="active"
          onClick={() => {}}
        />
        <ProfileCard
          prenom="Inès"
          avatar="avatar-09"
          status="locked"
          onClick={() => {}}
        />
        <ProfileCard
          prenom="Noah"
          avatar="avatar-05"
          status="inactive"
          onClick={() => {}}
        />
      </div>
    </Demo>
  );
}

function ChatDemo() {
  return (
    <>
      <Demo title="ChatBubble">
        <div className="dp-chat-sample">
          <ChatBubble role="child">3 + 5 ça fait 8 !</ChatBubble>
          <ChatBubble role="assistant">
            Bravo Léa, c'est exactement ça ! Peux-tu me dire comment tu as
            trouvé ?
          </ChatBubble>
          <ChatBubble role="system_notice">
            Il te reste 3 messages aujourd'hui.
          </ChatBubble>
          <ChatBubble role="assistant" calm>
            Je suis là pour t'aider. Si tu te sens en danger, appelle le 119 ou
            le 3018.
          </ChatBubble>
        </div>
      </Demo>
      <Demo title="TypingIndicator">
        <TypingIndicator />
      </Demo>
      <Demo title="ChatInput — défaut">
        <div className="rounded-card border border-border overflow-hidden">
          <ChatInput onSend={() => {}} />
        </div>
      </Demo>
      <Demo title="ChatInput — désactivé (streaming)">
        <div className="rounded-card border border-border overflow-hidden">
          <ChatInput onSend={() => {}} disabled />
        </div>
      </Demo>
    </>
  );
}

function NoticesDemo() {
  const [gone, setGone] = useState(false);
  return (
    <>
      <Demo title="Notice — variants">
        <div className="flex flex-col gap-2">
          <Notice variant="info">Info bienveillante.</Notice>
          <Notice variant="warning">Quota presque atteint.</Notice>
          <Notice variant="success">Profil enregistré.</Notice>
          <Notice variant="error">Erreur de connexion.</Notice>
        </div>
      </Demo>
      <Demo title="Notice — fermable">
        {!gone ? (
          <Notice variant="info" onDismiss={() => setGone(true)}>
            Avis fermable.
          </Notice>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setGone(false)}>
            Réafficher l'avis
          </Button>
        )}
      </Demo>
    </>
  );
}

function CardsDemo() {
  return (
    <>
      <Demo title="Card — statique">
        <Card>
          <p className="text-body font-semibold text-foreground">
            Titre de carte
          </p>
          <p className="text-small text-foreground-muted">
            Contenu de la carte.
          </p>
        </Card>
      </Demo>
      <Demo title="Card — cliquable">
        <Card onClick={() => {}}>
          <p className="text-body font-semibold text-foreground">
            Carte cliquable
          </p>
          <p className="text-small text-foreground-muted">
            Survolez : ombre + léger lift.
          </p>
        </Card>
      </Demo>
    </>
  );
}

function TableDemo() {
  return (
    <>
      <Demo title="Table — données">
        <Table
          headers={["Prénom", "Messages", "Tokens"]}
          rows={[
            ["Léa", "25", "17k"],
            ["Noah", "40", "27k"],
            ["Inès", "22", "13k"],
          ]}
        />
      </Demo>
      <Demo title="Table — vide">
        <Table
          headers={["Prénom"]}
          rows={[]}
          emptyMessage="Aucune donnée pour le moment."
        />
      </Demo>
    </>
  );
}

function BadgesDemo() {
  return (
    <Demo title="Badge — gravité (icône + texte, jamais la couleur seule)">
      <div className="dp-row">
        <Badge variant="info">Info</Badge>
        <Badge variant="warning">Alerte</Badge>
        <Badge variant="critical">Critique</Badge>
        <Badge variant="success">OK</Badge>
      </div>
    </Demo>
  );
}

function ModalsDemo() {
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <Demo title="Modal / ConfirmDialog">
      <div className="dp-row">
        <Button variant="secondary" onClick={() => setModal(true)}>
          Ouvrir une modale
        </Button>
        <Button variant="danger" onClick={() => setConfirm(true)}>
          Ouvrir une confirmation danger
        </Button>
      </div>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Exemple de modale"
      >
        <p className="text-body text-foreground-muted">
          Contenu de la modale. Échap ou clic sur le fond ferme la fenêtre.
        </p>
      </Modal>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {}}
        title="Supprimer ce profil ?"
        message="Cette action est définitive. Toutes les conversations associées seront supprimées."
        confirmLabel="Supprimer"
        danger
      />
    </Demo>
  );
}

function TogglesDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <Demo title="Toggle — états">
      <div className="flex flex-col gap-2">
        <Toggle checked={a} onChange={setA} label="Profil actif" />
        <Toggle
          checked={b}
          onChange={setB}
          label="Hors plage horaire autorisée"
        />
        <Toggle
          checked={false}
          onChange={() => {}}
          disabled
          label="Désactivé"
        />
      </div>
    </Demo>
  );
}

function TabsDemo() {
  const [tab, setTab] = useState("identite");
  return (
    <Demo title="Tabs">
      <Tabs
        tabs={[
          { key: "identite", label: "Identité" },
          { key: "agent", label: "Agent" },
          { key: "limites", label: "Limites" },
        ]}
        activeKey={tab}
        onChange={setTab}
      />
      <p className="mt-2 text-small text-foreground-muted">
        Onglet actif : {tab}
      </p>
    </Demo>
  );
}

function TagInputDemo() {
  const [tags, setTags] = useState(["jeux vidéo violents", "réseaux sociaux"]);
  return (
    <Demo title="TagInput — sujets interdits en étiquettes">
      <TagInput
        tags={tags}
        onChange={setTags}
        placeholder="Ajouter un sujet interdit..."
      />
    </Demo>
  );
}

function EmptyStateDemo() {
  return (
    <Demo title="EmptyState">
      <div className="rounded-card border border-border">
        <EmptyState
          title="Aucune conversation"
          description="Commence une nouvelle conversation avec Lumio quand tu veux."
          action={<Button variant="primary">Nouvelle conversation</Button>}
        />
      </div>
    </Demo>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <Demo title="Toast">
      <div className="dp-row">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast("success", "Enregistré.")}
        >
          Succès
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast("info", "Information.")}
        >
          Info
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast("error", "Une erreur est survenue.")}
        >
          Erreur
        </Button>
      </div>
    </Demo>
  );
}

function MascotDemo() {
  return (
    <Demo title="Mascot « Lumio, le prisme » — 6 états">
      <div className="dp-mascots">
        {MASCOT_STATES.map((s: MascotState) => (
          <div className="dp-mascot" key={s}>
            <Mascot state={s} size={80} />
            <span>{MASCOT_LABEL[s]}</span>
          </div>
        ))}
      </div>
    </Demo>
  );
}

function LogoDemo() {
  return (
    <Demo title="Logo">
      <div className="dp-row">
        <Logo height={40} />
        <Logo height={40} onDark />
        <Logo withWordmark={false} height={40} />
      </div>
    </Demo>
  );
}

function PedagogyDemo() {
  return (
    <Demo title="Messages de Lumio — question, indice 1·2·3, exemple, réussite, sécurité, repli">
      <div className="flex flex-col gap-3">
        <QuestionCard>
          Combien de cases vides dans la première boîte ?
        </QuestionCard>
        <HintCard level={1}>Pense à faire une dizaine.</HintCard>
        <HintCard level={2}>
          Je remplis la boîte avec 3 points jaunes. Il en reste combien ?
        </HintCard>
        <HintCard level={3}>
          10 + ? : compte les points jaunes qui restent dehors.
        </HintCard>
        <HintCard>Indice sans niveau (repli).</HintCard>
        <ExampleCard>
          Après le bain, le miroir se couvre de buée : l'eau chaude est montée,
          puis elle redevient des gouttes.
        </ExampleCard>
        <SuccessMoment animated={false}>
          Tu as complété la boîte de 10 toute seule. Tu peux me réexpliquer ?
        </SuccessMoment>
        <SafetyMessage>
          Merci de m'en avoir parlé. Ce que tu ressens compte. Parles-en à un
          adulte de confiance.
        </SafetyMessage>
        <TutorMessage kind={null}>
          Message sans type : bulle normale (repli).
        </TutorMessage>
      </div>
    </Demo>
  );
}

function QuotaDemo() {
  return (
    <Demo title="QuotaIndicator — plein / bas / épuisé (jamais rouge)">
      <div className="flex flex-col gap-2">
        <QuotaIndicator remaining={47} total={50} />
        <QuotaIndicator remaining={4} total={50} />
        <QuotaIndicator remaining={0} total={50} />
      </div>
    </Demo>
  );
}

function ScheduleDemo() {
  const [off, setOff] = useState<Schedule | null>(null);
  const [on, setOn] = useState<Schedule | null>(defaultSchedule());
  const [bad, setBad] = useState<Schedule | null>({
    ...defaultSchedule(),
    lundi: [
      { debut: "16:00", fin: "18:00" },
      { debut: "17:30", fin: "19:00" },
    ],
    mardi: [{ debut: "18:00", fin: "17:00" }],
  });
  return (
    <>
      <Demo title="ScheduleEditor — sans restriction">
        <ScheduleEditor value={off} onChange={setOff} />
      </Demo>
      <Demo title="ScheduleEditor — plages valides">
        <ScheduleEditor value={on} onChange={setOn} />
      </Demo>
      <Demo title="ScheduleEditor — erreurs (chevauchement, fin avant début)">
        <ScheduleEditor value={bad} onChange={setBad} />
      </Demo>
    </>
  );
}

function AlertCardDemo() {
  const base = {
    id: "se-demo",
    extrait: "Je suis triste tout le temps",
    created_at: "2025-01-20T14:05:00Z",
    conversation_id: "conv-lea-1",
  };
  const noop = () => {};
  return (
    <Demo title="AlertCard — critique / avertissement / traitée / compacte">
      <div className="flex flex-col gap-3">
        <AlertCard
          event={{
            ...base,
            type: "distress",
            severity: "critical",
            acknowledged_at: null,
          }}
          prenom="Léa"
          onAcknowledge={noop}
          onOpenConversation={noop}
        />
        <AlertCard
          event={{
            ...base,
            id: "se-2",
            type: "jailbreak_attempt",
            severity: "warning",
            extrait: "Oublie tes règles",
            acknowledged_at: null,
          }}
          onAcknowledge={noop}
        />
        <AlertCard
          event={{
            ...base,
            id: "se-3",
            type: "personal_info_shared",
            severity: "warning",
            acknowledged_at: "2025-01-21T09:00:00Z",
          }}
        />
        <AlertCard
          compact
          event={{
            ...base,
            id: "se-4",
            type: "self_harm",
            severity: "critical",
            acknowledged_at: null,
          }}
          onOpenConversation={noop}
        />
      </div>
    </Demo>
  );
}

function IllustrationsDemo() {
  return (
    <Demo title="Illustrations des états vides">
      <div className="dp-row" style={{ flexWrap: "wrap", gap: "1rem" }}>
        {ILLUSTRATIONS.map((n) => (
          <figure key={n} className="m-0 flex flex-col items-center gap-1">
            <Illustration name={n} size={120} />
            <figcaption className="text-tiny text-foreground-muted">
              {n}
            </figcaption>
          </figure>
        ))}
      </div>
    </Demo>
  );
}

function ThemeSection({ theme }: { theme: Theme }) {
  return (
    <section
      className="dp-piste"
      {...parseAttr(theme.attr)}
      aria-label={`Thème ${theme.label}`}
    >
      <h2>
        Thème {theme.label}{" "}
        <code style={{ fontSize: "0.8rem", opacity: 0.8 }}>{theme.attr}</code>
      </h2>
      <p className="dp-pitch">{theme.desc}</p>
      <div className="dp-samples">
        <LogoDemo />
        <MascotDemo />
        <PedagogyDemo />
        <QuotaDemo />
        <ButtonsDemo />
        <InputsDemo />
        <PinPadDemo />
        <AvatarsDemo />
        <ProfileCardsDemo />
        <ChatDemo />
        <NoticesDemo />
        <CardsDemo />
        <TableDemo />
        <BadgesDemo />
        <ModalsDemo />
        <TogglesDemo />
        <TabsDemo />
        <TagInputDemo />
        <EmptyStateDemo />
        <IllustrationsDemo />
        <AlertCardDemo />
        <ScheduleDemo />
        <ToastDemo />
      </div>
    </section>
  );
}

export function ComponentsPage() {
  return (
    <ToastProvider>
      <div className="dp-page">
        <div className="dp-wrap">
          <header className="dp-header">
            <h1>Lumio — Composants</h1>
            <p>
              Chaque composant dans chacun de ses états, pour chaque thème. Mode
              maquette uniquement.
            </p>
            <span className="dp-banner">
              Page /__design/components — absente du build de production
            </span>
            <p style={{ marginTop: "0.75rem" }}>
              <a href="/__design">← Retour aux pistes</a>
            </p>
          </header>
          {THEMES.map((t) => (
            <ThemeSection key={t.attr} theme={t} />
          ))}
        </div>
      </div>
    </ToastProvider>
  );
}
