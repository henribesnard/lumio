# Lumio — Design System « Prisme »

Identité issue du design Claude « Lumio — Prisme + Feuille » (nov. 2026), qui
remplace la piste « Brume ». Idée : *une question entre, plusieurs couleurs en
sortent* — Lumio décompose les problèmes pour que l'enfant voie chaque étape.
Ambiance « studio d'étude » : géométrique, nette, lumineuse.

Ce document est la référence d'usage. **Toute valeur visuelle passe par
`src/styles/tokens.css`**, vérifié par `npm run check-tokens` (variables
définies, aucune couleur en dur dans `src/` hors `tokens.css` et
`design-preview/`, contrastes WCAG 2.1 calculés par thème).

## 1. Principes

1. **Lumio guide, ne répond pas.** Le chat met en valeur les *questions, indices
   et exemples* de l'agent par des cartes distinctes (spectre ci-dessous). Une
   réponse toute faite n'a pas de carte dédiée.
2. **Le spectre code les étapes** : soleil = question, menthe = indice, ciel =
   exemple analogue. La couleur n'est jamais seule : chaque carte porte un
   libellé texte (« Question pour toi », « Indice 2 sur 3 », « Un exemple que
   tu connais »).
3. **Le prisme ne s'irise qu'au moment du déclic** (réussite). Pas de badge, pas
   de série, pas de score, rien à collectionner. Le quota est dit positivement
   (« Encore N messages aujourd'hui »), jamais en rouge.
4. **Deux registres enfant, une marque** : `6-8` clair et très lisible ;
   `9-14` sombre « concentration ». Admin clair et sobre.
5. **Français uniquement, tablette d'abord côté enfant, desktop côté admin.**
6. **Accessibilité AA** : contrastes ≥ 4.5:1 (texte) / ≥ 3:1 (UI), focus
   toujours visible (`--color-focus`), cibles tactiles selon le registre,
   `prefers-reduced-motion` respecté (règle globale dans `index.css`).
7. **Sécurité sobre** : la réponse de sécurité n'a ni couleur d'alerte, ni
   animation, ni rayon ; la mascotte y est en « réconfort ».

## 2. Palette

| Nom | Hex | Usage |
|---|---|---|
| Encre | `#18132B` | texte (clair), fond du mode étude |
| Prisme | `#5B3FD9` | marque, bulles de l'enfant, boutons (6,6:1 avec blanc) |
| Soleil | `#FFC53D` | questions (halo, décoratif) — texte `#7A5300` |
| Menthe | `#12A37A` | indices (halo) — texte `#0B7A5A` |
| Ciel | `#4C9BFF` | exemples (halo) — texte `#1F5FD1` |
| Corail | `#FF7A59` | rayon décoratif (réussite) |
| Lait | `#F6F5FB` | fond clair |

Tokens principaux par thème (extraits) :

| Token | `:root` / 6-8 | 9-14 (étude) | admin |
|---|---|---|---|
| `--color-background` | `#F6F5FB` | `#18132B` | `#F6F5FB` |
| `--color-surface` / `-alt` | `#FFFFFF` / `#ECEAF6` | `#241D3D` / `#2F2750` | `#FFFFFF` / `#F1EFF8` |
| `--color-foreground` / `-muted` | `#18132B` / `#5C5575` | `#F1EEFA` / `#B4ADCF` | idem clair |
| `--color-border` / `-subtle` | `#857DA3` / `#DAD5EA` | `#8A80AD` / `#4A4166` | `#857DA3` / `#E4E0F0` |
| `--color-primary` / `-hover` | `#5B3FD9` / `#42289F` | `#6A50E8` / `#5B3FD9` | `#5B3FD9` / `#42289F` |
| `--color-focus` | `#5B3FD9` | `#C3B6FF` | `#5B3FD9` |
| `--color-nav` | `#FFFFFF` | `#120E22` (rail) | `#FFFFFF` |
| question bg / anneau / texte | `#FFF4D6` / `#FFC53D` / `#7A5300` | `#241D3D` / `#FFC53D` / `#FFC53D` | — |
| indice bg / anneau / texte / piste | `#E3F6EF` / `#12A37A` / `#0B7A5A` / `#BFE6D7` | `#241D3D` / `#4FD1A5` / `#4FD1A5` / `#3B5F55` | — |
| exemple bg / anneau / texte | `#E6F0FF` / `#4C9BFF` / `#1F5FD1` | `#241D3D` / `#8DBEFF` / `#8DBEFF` | — |
| bulle enfant | `#5B3FD9` / blanc | `#5B3FD9` / blanc | `#EEEAFD` / encre |
| feuille (`--color-sheet*`) | blanc, encre, quadrillage `#E4E0F0` | **reste blanche** | — |

Nouveaux tokens (ajouts, aucun renommage) : `--font-display`, `--text-label`,
`--tracking-label`, `--label-case`, `--color-border-subtle`, `--color-nav`,
`--color-{success,warning,danger,info}-bg`, `--color-on-{primary,secondary,danger}`,
`--color-focus`, `--color-link`, `--color-chat-input-ring`, `--color-overlay`,
`--color-{question,hint,example}-*`, `--color-success-moment-bg`,
`--color-safety-{bg,ring}`, `--color-ray-{sun,mint,sky,coral}`,
`--color-sheet*`, `--color-mascot-calm*`, `--color-avatar-bg`,
`--size-send`, `--size-pin-key`, `--radius-bubble`, `--radius-bubble-tail`,
`--radius-sheet`, `--radius-chat-input`, `--shadow-sheet`, `--ring-width`.

Règles : le Soleil (`--color-accent`, `--color-ray-sun`) est **décoratif** —
jamais de texte posé dessus. Le texte sur aplat coloré utilise le token
`--color-on-*` du thème (vérifié par `check-tokens`).

## 3. Typographie (OFL, auto-hébergées dans `public/fonts/`)

| Rôle | Police | Remarques |
|---|---|---|
| Titres, chiffres, logo | **Unbounded** (variable 200–900) | `--font-display`, `h1`/`h2` par défaut |
| Texte courant | **Lexend** (variable) | `--font-sans`, tous registres |

| Registre | Corps | Rayon carte | Cible tactile |
|---|---|---|---|
| `6-8` | `--text-body: 1.375rem` (22 px) | 28 px | 56 px (envoi 72 px, touches PIN 84 px) |
| `9-14` | 1rem (≈ 17 px rendu Lexend) | 16 px | 48 px |
| `admin` | 0.9375rem | 16 px | 40 px |

Aucun appel externe (Google Fonts) : `@font-face` local dans `index.css`.
Inter et Atkinson Hyperlegible ont été retirées.

## 4. Mascotte — « Lumio, le prisme »

Composant `src/components/Mascot.tsx` (SVG inline, tokens `--color-mascot-*`,
`--color-ray-*`), asset statique `public/brand/mascot.svg`. Six états :

| État | Usage | Visuel |
|---|---|---|
| `ecoute` | accueil, attente | yeux ronds, sourire |
| `reflechit` | « Lumio réfléchit » (TypingIndicator) | prisme incliné, bulles de pensée |
| `indice` | indice en cours | un rayon menthe |
| `bravo` | réussite (SuccessMoment) | **seul état irisé** : 4 rayons du spectre (animés) |
| `pause` | hors horaires, verrouillage | désaturé, yeux fermés, « z » |
| `reconfort` | réponse de sécurité | désaturé, **aucun rayon, aucune animation** |

## 5. Marque & assets

- `public/brand/lumio-logo.svg` (horizontal), `lumio-logo-dark.svg` (fonds
  sombres), `lumio-icon.svg` (tuile Lait), `lumio-wordmark.svg` — wordmark
  « lumio » en Unbounded 800 vectorisé (`scripts/generate-brand.py`).
- `public/favicon.svg`, `public/icons/icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png`, `apple-touch-icon.png` (`scripts/generate-icons.ts`,
  `PW_CHROMIUM_PATH` pour pointer un Chromium local).
- 12 avatars `public/avatars/avatar-01.svg` … `avatar-12.svg` : disque du
  spectre + forme géométrique à l'encre (`scripts/generate-avatars.py`).
- Illustrations d'états vides : `src/components/Illustration.tsx`
  (`conversations`, `alerts-clear`, `profiles`, `devices`, `notes`, `error`).

## 6. Composants (`src/components/`)

Existants, passés en « Prisme » : Button (pilule en 6-8), Input, PinPad
(touches rondes Unbounded), Avatar, ProfileCard, ChatBubble (bulle prisme à
coin pincé), ChatInput (champ pilule cerclé, compteur « n / 1000 », envoi rond),
TypingIndicator (mascotte qui réfléchit), Notice, Card, Table, Badge, Modal,
ConfirmDialog, Toggle, Tabs, TagInput, EmptyState (illustrations), Toast, Logo,
Mascot.

Nouveaux :

| Composant | Rôle | États |
|---|---|---|
| `PedagogyCard` | carte à halo du spectre (base) | question / hint / example |
| `QuestionCard` | question guide | — |
| `HintCard` | indice progressif, segments + « Indice n sur 3 » | niveau 1, 2, 3, sans niveau |
| `ExampleCard` | exemple analogue | — |
| `SuccessMoment` | réussite, prisme irisé | animé / statique |
| `SafetyMessage` | réponse de sécurité calme + 119 / 3018 | avec / sans numéros |
| `TutorMessage` | aiguille `message.kind` → carte ; **repli** bulle normale | 6 types + absent/inconnu |
| `QuotaIndicator` | quota positif | plein / bas / épuisé |
| `AlertCard` | alerte de sécurité (admin) | critique / avertissement / info / traitée / compacte |
| `ScheduleEditor` | plages horaires du profil | sans restriction / valide / erreurs |
| `Illustration` | états vides | 6 illustrations |
| `KidChrome` | icônes et mention parents partagées | — |

Showroom : `/__design/components` (mode maquette + dev uniquement, **absent du
build** ; `mockServiceWorker.js` est aussi retiré de `dist/` par un plugin Vite).

## 7. Chat : registres et micro-interactions

- **6-8** : en-tête « Retour » / pastille avatar + prénom / « Quitter » ; fil
  pleine largeur (max 48 rem) ; champ 72 px ; mention parents sous la saisie.
- **9-14** : rail de navigation sombre (prisme, nouvelle conversation, mes
  conversations, avatar, quitter), en-tête avec le titre de la conversation et
  la mention parents.
- Arrivée des messages : `msg-in` (300 ms). Rayons de réussite : `prism-rays`
  (600 ms, échelonnés). Tracé des dessins de la feuille : `sheet-draw` (600 ms,
  gauche → droite). Tout est coupé si `prefers-reduced-motion`.
- Historique rechargé : pas d'animation de réussite (seulement les messages
  reçus pendant la session).

## 8. Accessibilité — vérifications

- `npm run check-tokens` (aussi test vitest) : variables, hex en dur, contrastes
  par thème (texte, cartes du spectre, liens, feuille, `on-*`, focus).
- `npm run axe` sur chaque écran × état → `docs/design/axe-report.json` (zéro
  violation serious/critical).
- `npm run keyboard` : PIN, chat, édition de profil au clavier.
- Captures : `npm run screenshots` → `docs/design/screenshots/`.

## 9. Ce qu'il ne faut PAS faire

- Pas de couleur en dur dans les composants (sauf `tokens.css` et `design-preview`).
- Pas de renommage/suppression de token existant.
- Pas d'emoji dans l'UI, pas d'animation sur la réponse de sécurité, pas de
  rouge sur le quota, pas de feuille dans un message de sécurité.
- Pas de dark pattern (séries, badges, récompenses, incitation à revenir).
- Pas de personnage/logo emprunté, pas de photo d'enfant.
- Pas de page `/__design*` ni de `mockServiceWorker.js` dans le build.
