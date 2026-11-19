/**
 * /__design — prévisualisation des deux pistes (phase 1).
 * Page temporaire, mode maquette uniquement.
 */
import { useState } from "react";
import { Button } from "@/components/Button";
import { ChatBubble } from "@/components/ChatBubble";
import { PinPad } from "@/components/PinPad";
import { MascotA, MascotB, MASCOT_STATES, type MascotState } from "./Mascot";

/* --- contraste WCAG 2.1 (identique au script de vérification) --- */
function lum(hex: string): number {
  const c = hex.replace("#", "");
  const f = (v: number) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * f(parseInt(c.slice(0, 2), 16)) +
    0.7152 * f(parseInt(c.slice(2, 4), 16)) +
    0.0722 * f(parseInt(c.slice(4, 6), 16))
  );
}
function ratio(a: string, b: string): number {
  const l1 = lum(a);
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function Swatch({
  label,
  hex,
  textHex,
  bgHex,
  kind = "text",
}: {
  label: string;
  hex: string;
  textHex?: string;
  bgHex?: string;
  kind?: "text" | "ui" | "decor";
}) {
  let badge = null;
  if (textHex && bgHex) {
    const r = ratio(textHex, bgHex);
    const ok = r >= 4.5;
    const ui = !ok && r >= 3;
    badge = (
      <span className={`dp-ratio ${ok ? "ok" : ui ? "ui" : "fail"}`}>
        {r.toFixed(1)}:1 {ok ? "AA" : ui ? "UI" : "!"}
      </span>
    );
  }
  return (
    <div className="dp-swatch">
      <div className="chip" style={{ background: hex }} />
      <div className="meta">
        <strong>{label}</strong>
        <br />
        <code>{hex}</code>
        {kind === "decor" && <span className="dp-ratio fail">décor</span>}
        {badge}
      </div>
    </div>
  );
}

function PinPadDemo() {
  const [pin, setPin] = useState("56");
  return <PinPad value={pin} onChange={setPin} error={pin === "5678" ? "Code incorrect, réessaie." : undefined} />;
}

function PisteA() {
  const bg = "#FBF5EB";
  const fg = "#2A2118";
  return (
    <section className="dp-piste" aria-labelledby="piste-a-title">
      <h2 id="piste-a-title">Piste A — « Braise »</h2>
      <p className="dp-pitch">
        Papier crème chaud, encre brune, primaire terracotta. La mascotte est une grosse goutte
        ambrée (« Lumi la braise ») avec un halo. Ton chaleureux de conteur. Typographie :
        Atkinson Hyperlegible (6-8), Lexend (9-14), Inter (admin).
      </p>

      <div className="dp-section">
        <h3>Palette (contrastes calculés sur le fond {bg})</h3>
        <div className="dp-swatches">
          <Swatch label="Fond" hex={bg} />
          <Swatch label="Texte" hex={fg} textHex={fg} bgHex={bg} />
          <Swatch label="Texte secondaire" hex="#6B5D4F" textHex="#6B5D4F" bgHex={bg} />
          <Swatch label="Primaire" hex="#9A3412" textHex="#FFFFFF" bgHex="#9A3412" />
          <Swatch label="Secondaire" hex="#0F766E" textHex="#FFFFFF" bgHex="#0F766E" />
          <Swatch label="Accent (lueur)" hex="#F59E0B" kind="decor" />
          <Swatch label="Succès" hex="#15803D" textHex="#15803D" bgHex={bg} />
          <Swatch label="Alerte" hex="#92400E" textHex="#92400E" bgHex={bg} />
          <Swatch label="Danger" hex="#B91C1C" textHex="#B91C1C" bgHex={bg} />
          <Swatch label="Info" hex="#1D4ED8" textHex="#1D4ED8" bgHex={bg} />
          <Swatch label="Bordure" hex="#8F7B60" textHex="#8F7B60" bgHex={bg} kind="ui" />
        </div>
      </div>

      <div className="dp-section">
        <h3>Typographie — trois registres</h3>
        <div className="dp-type">
          <div className="dp-type-card piste-a age68-demo">
            <h4>6-8 ans — Atkinson Hyperlegible, ≥ 20 px</h4>
            <div className="t-display">Bonjour Léa !</div>
            <div className="t-body">On reprend ta conversation sur les additions ?</div>
            <div className="t-small">27 messages restants aujourd'hui</div>
          </div>
          <div className="dp-type-card piste-a">
            <h4>9-14 ans — Lexend, 16 px</h4>
            <div className="t-display">Bonjour Noah</div>
            <div className="t-body">Tu as repris les fractions — qu'est-ce qui te bloque ?</div>
            <div className="t-small">47 messages restants aujourd'hui</div>
          </div>
          <div className="dp-type-card piste-a admin-demo">
            <h4>Admin — Inter, 15 px</h4>
            <div className="t-display">Tableau de bord</div>
            <div className="t-body">3 profils actifs, 1 alerte critique à traiter.</div>
            <div className="t-small">Dernière connexion : aujourd'hui à 08:12</div>
          </div>
        </div>
      </div>

      <div className="dp-section">
        <h3>Composants clés</h3>
        <div className="dp-samples">
          <div className="dp-sample piste-a">
            <h4>Boutons</h4>
            <div className="dp-row">
              <Button variant="primary">Nouvelle conversation</Button>
              <Button variant="secondary">Retour</Button>
              <Button variant="ghost">Quitter</Button>
              <Button variant="danger">Supprimer</Button>
              <Button variant="primary" disabled>Occupé…</Button>
              <Button variant="primary" loading>Envoi…</Button>
            </div>
          </div>
          <div className="dp-sample piste-a">
            <h4>Bulles de chat</h4>
            <div className="dp-chat-sample">
              <ChatBubble role="child">3 + 5 ça fait 8 !</ChatBubble>
              <ChatBubble role="assistant">
                Bravo Léa, c'est exactement ça ! Peux-tu me dire comment tu as trouvé ?
              </ChatBubble>
              <ChatBubble role="system_notice">Tu as atteint ta limite de messages pour aujourd'hui.</ChatBubble>
            </div>
          </div>
          <div className="dp-sample piste-a age68-demo">
            <h4>Pavé PIN (6-8 ans, cibles 56 px)</h4>
            <PinPadDemo />
          </div>
        </div>
      </div>

      <div className="dp-section">
        <h3>Mascotte — « Lumi la braise », 5 états</h3>
        <div className="dp-mascots piste-a">
          {MASCOT_STATES.map((s: MascotState) => (
            <div className="dp-mascot" key={s}>
              <MascotA state={s} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PisteB() {
  const bg = "#F3F5FA";
  const fg = "#1C2333";
  return (
    <section className="dp-piste" aria-labelledby="piste-b-title">
      <h2 id="piste-b-title">Piste B — « Brume »</h2>
      <p className="dp-pitch">
        Ciel du soir apprivoisé : fond gris-bleu frais, encre ardoise, primaire indigo. La mascotte
        est une luciole géométrique (« Lumi la luciole ») à queue ambrée. Ton calme et direct, jamais
        infantilisant. Typographie : Lexend (6-8), Inter (9-14 et admin).
      </p>

      <div className="dp-section">
        <h3>Palette (contrastes calculés sur le fond {bg})</h3>
        <div className="dp-swatches">
          <Swatch label="Fond" hex={bg} />
          <Swatch label="Texte" hex={fg} textHex={fg} bgHex={bg} />
          <Swatch label="Texte secondaire" hex="#55607A" textHex="#55607A" bgHex={bg} />
          <Swatch label="Primaire" hex="#4F46E5" textHex="#FFFFFF" bgHex="#4F46E5" />
          <Swatch label="Secondaire" hex="#0E7490" textHex="#FFFFFF" bgHex="#0E7490" />
          <Swatch label="Accent (luciole)" hex="#F59E0B" kind="decor" />
          <Swatch label="Succès" hex="#15803D" textHex="#15803D" bgHex={bg} />
          <Swatch label="Alerte" hex="#92400E" textHex="#92400E" bgHex={bg} />
          <Swatch label="Danger" hex="#B91C1C" textHex="#B91C1C" bgHex={bg} />
          <Swatch label="Info" hex="#1D4ED8" textHex="#1D4ED8" bgHex={bg} />
          <Swatch label="Bordure" hex="#6E7A94" textHex="#6E7A94" bgHex={bg} kind="ui" />
        </div>
      </div>

      <div className="dp-section">
        <h3>Typographie — trois registres</h3>
        <div className="dp-type">
          <div className="dp-type-card piste-b age68-demo">
            <h4>6-8 ans — Lexend, ≥ 20 px</h4>
            <div className="t-display">Bonjour Léa !</div>
            <div className="t-body">On reprend ta conversation sur les additions ?</div>
            <div className="t-small">27 messages restants aujourd'hui</div>
          </div>
          <div className="dp-type-card piste-b">
            <h4>9-14 ans — Inter, 16 px</h4>
            <div className="t-display">Bonjour Noah</div>
            <div className="t-body">Tu as repris les fractions — qu'est-ce qui te bloque ?</div>
            <div className="t-small">47 messages restants aujourd'hui</div>
          </div>
          <div className="dp-type-card piste-b admin-demo">
            <h4>Admin — Inter, 15 px</h4>
            <div className="t-display">Tableau de bord</div>
            <div className="t-body">3 profils actifs, 1 alerte critique à traiter.</div>
            <div className="t-small">Dernière connexion : aujourd'hui à 08:12</div>
          </div>
        </div>
      </div>

      <div className="dp-section">
        <h3>Composants clés</h3>
        <div className="dp-samples">
          <div className="dp-sample piste-b">
            <h4>Boutons</h4>
            <div className="dp-row">
              <Button variant="primary">Nouvelle conversation</Button>
              <Button variant="secondary">Retour</Button>
              <Button variant="ghost">Quitter</Button>
              <Button variant="danger">Supprimer</Button>
              <Button variant="primary" disabled>Occupé…</Button>
              <Button variant="primary" loading>Envoi…</Button>
            </div>
          </div>
          <div className="dp-sample piste-b">
            <h4>Bulles de chat</h4>
            <div className="dp-chat-sample">
              <ChatBubble role="child">1/3 + 1/4, je trouve 2/7 ?</ChatBubble>
              <ChatBubble role="assistant">
                Presque ! Quand les dénominateurs sont différents, que peux-tu faire pour les rendre
                identiques ?
              </ChatBubble>
              <ChatBubble role="system_notice">Ce sujet n'est pas autorisé. On peut parler d'autre chose ?</ChatBubble>
            </div>
          </div>
          <div className="dp-sample piste-b age68-demo">
            <h4>Pavé PIN (6-8 ans, cibles 56 px)</h4>
            <PinPadDemo />
          </div>
        </div>
      </div>

      <div className="dp-section">
        <h3>Mascotte — « Lumi la luciole », 5 états</h3>
        <div className="dp-mascots piste-b">
          {MASCOT_STATES.map((s: MascotState) => (
            <div className="dp-mascot" key={s}>
              <MascotB state={s} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PistesPage() {
  return (
    <div className="dp-page">
      <div className="dp-wrap">
        <header className="dp-header">
          <h1>Lumio — Direction artistique</h1>
          <p>Deux pistes à comparer. Prévisualisation temporaire, mode maquette uniquement.</p>
          <span className="dp-banner">Page /__design — absente du build de production</span>
          <p style={{ marginTop: "0.75rem" }}>
            <a href="/__design/components">Voir la page composants →</a>
          </p>
        </header>
        <PisteA />
        <PisteB />
      </div>
    </div>
  );
}
