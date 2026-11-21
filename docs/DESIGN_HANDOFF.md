# Design Handoff — Lumio

Ce document est destiné à l'agent design (Claude Design). Il décrit chaque écran, ses états, les parcours utilisateurs, les composants, les tokens, et les règles de modification.

## Ce que le designer peut modifier

| Dossier / Fichier | Modifiable | Raison |
|---|---|---|
| `src/styles/tokens.css` | **Oui** | Toutes les variables visuelles |
| `src/styles/index.css` | **Oui** | Styles globaux |
| `src/components/*.tsx` | **Oui** | Composants UI isolés |
| `src/features/**/*View.tsx` | **Oui** | Vues de présentation |
| `public/` | **Oui** | Avatars, favicon, assets |
| `tailwind.config.js` | **Oui** | Mapping des tokens |
| `src/api/` | **Non** | Client API généré |
| `src/features/**/*Container.tsx` | **Non** | Logique métier |
| `src/features/auth/AuthContext.tsx` | **Non** | État d'authentification |
| `src/routes.tsx` | **Non** | Routage |
| `src/mocks/` | **Non** | Données de test |
| `backend/` | **Non** | Toute l'API |

## Thèmes (identité « Prisme »)

Trois thèmes définis par attribut `data-*` sur un conteneur parent :

- `[data-age="6-8"]` — clair « Prisme » : texte 22 px, rayons 28 px, cibles ≥ 56 px.
  Utilisé aussi **avant la connexion** (choix du profil, PIN) : on ne connaît pas
  encore l'âge, on prend le registre le plus lisible.
- `[data-age="9-14"]` — sombre « étude / concentration » : texte 17 px, rayons 16 px.
  La feuille de Lumio (supports visuels) reste blanche.
- `[data-theme="admin"]` — clair, sobre, desktop-first, titres Unbounded.

Les variables sont dans `src/styles/tokens.css` ; la référence d'usage est
`docs/design/DESIGN_SYSTEM.md`.

## Correspondance design → code

Design source : artefact « Lumio — Design Prisme + Feuille » (5 planches).

| Planche du design | Route | Fichiers |
|---|---|---|
| Identité — palette, typo, mascotte, signatures du chat | toutes | `styles/tokens.css`, `styles/index.css`, `components/Mascot.tsx`, `components/PedagogyCard.tsx` (+ Question/Hint/Example), `public/brand/`, `public/fonts/` |
| Chat 6-8 — tablette paysage / portrait | `/chat/:id` | `features/kid/KidChatPage.tsx` (branche `6-8`), `components/ChatBubble.tsx`, `ChatInput.tsx`, `TutorMessage.tsx`, `KidChrome.tsx` |
| Chat 9-14 — tablette paysage | `/chat/:id` | `features/kid/KidChatPage.tsx` (branche `9-14` : rail + en-tête) |
| Composant Feuille — catalogue et états | `/chat/:id` (panneau), `/admin/conversations/:id` | `components/LumioSheet.tsx`, `components/visual/*` (voir `docs/VISUAL_AIDS.md`) ; sans dessin, pas de feuille et le chat prend toute la largeur |
| (non dessinés, extrapolés dans le même langage) | `/select`, `/pin/:id`, `/chat`, `/admin/*` | `features/auth/*`, `features/kid/KidConversationsPage.tsx`, `features/admin/*`, `components/AlertCard.tsx`, `ScheduleEditor.tsx`, `QuotaIndicator.tsx`, `Illustration.tsx` |

Les écrans restent des pages (`*Page.tsx`, `Admin*.tsx`) : le dépôt n'a pas de
séparation container/vue ; seule la présentation a été modifiée (plus deux
ajouts signalés : lecture du titre de conversation pour l'en-tête 9-14 via
`GET /api/kid/conversations`, et l'éditeur de plages horaires).

## Message typé de Lumio

Chaque message de Lumio peut porter `kind` (`question`, `hint`, `example`,
`success`, `explanation`, `safety`) et `hint_level` (1–3, indices) — dans
`GET …/messages` (enfant et admin) et dans l'événement SSE `done`.
`TutorMessage` choisit la carte ; **sans type, ou type inconnu, le message
s'affiche en bulle normale**. `safety` = réponse de sécurité prédéfinie
(carte calme, numéros d'aide, aucune animation).

## Contraintes

- **WCAG AA** : contraste minimal 4.5:1 pour le texte
- **Cibles tactiles** : ≥ 48px (≥ 56px pour les 6-8 ans)
- **Tablette d'abord** côté enfants, **desktop d'abord** côté admin
- **Pas d'emoji** dans les composants (sauf `safe_responses.yaml` côté backend)
- Tous les textes en **français**

## Parcours enfant

### 1. Choix du profil (`/select`)
- **But** : l'enfant choisit son prénom
- **Données** : `GET /api/kid/profiles` → `ProfilePublic[]`
- **États** :
  - Chargement (spinner)
  - Profils affichés (grille d'avatars + prénoms)
  - Aucun profil actif (message vide)
  - **Appareil non reconnu** (écran dédié avec icône warning, titre « Appareil non reconnu », message demandant l'activation par un parent)
  - Erreur générique (message simple)
  - Notice : « Tes parents peuvent lire tes conversations. »

### 2. Saisie du PIN (`/pin/:profileId`)
- **But** : authentification par code à 4 chiffres
- **Composant** : PinPad (pavé numérique tactile)
- **États** :
  - Saisie (4 points vides/remplis)
  - Vérification en cours
  - Code incorrect (message + reset)
  - Profil verrouillé (message + redirection)

### 3. Liste des conversations (`/chat`)
- **But** : voir et créer des conversations
- **Données** : `GET /api/kid/conversations`, `GET /api/kid/me`
- **États** :
  - Liste de conversations (titre + date)
  - **Aucune conversation + suggestions** : grille 2x2 d'idées adaptées à la tranche d'âge (6-8 / 9-14)
  - Bouton « Nouvelle conversation »
  - Hors plage horaire (bannière warning, bouton désactivé)
  - Quota atteint (bannière info, bouton désactivé)
  - Header : logo + pastille avatar/prénom + bouton Quitter ; salutation + **QuotaIndicator** (jauge positive)

### 4. Chat (`/chat/:conversationId`)
- **But** : conversation avec Lumio
- **Données** : `GET /api/kid/conversations/:id/messages`, `POST` → SSE
- **États** :
  - Messages (bulles enfant à droite ; Lumio à gauche : carte question / indice n sur 3 / exemple / réussite, ou bulle normale ; notice au centre)
  - Réponse de sécurité (carte calme, mascotte « réconfort », 119 / 3018)
  - Streaming (texte qui apparaît mot par mot)
  - Indicateur de frappe (3 points animés)
  - Notice SSE (bannière warning)
  - Erreur SSE (bannière error)
  - Input : textarea + compteur /1000 + bouton envoi
  - Input désactivé (hors horaire, quota atteint, streaming en cours)

## Parcours admin

### 5. Connexion admin (`/admin/login`)
- **But** : authentification email + mot de passe
- **États** :
  - Formulaire (email, mot de passe)
  - Champ TOTP conditionnel
  - Erreur de connexion
  - Compte verrouillé (429)

### 6. Tableau de bord (`/admin`)
- **Layout** : sidebar (desktop) / tabs (mobile)
- **Données** : `GET /api/admin/stats`, `GET /api/admin/safety-events?status=pending`
- **États** :
  - Alertes critiques non acquittées (bannière danger en haut)
  - Cartes stats : messages 7j, profils actifs, alertes, tokens
  - Table utilisation par profil

### 7. Liste des profils (`/admin/profiles`)
- **Données** : `GET /api/admin/profiles`
- **États** :
  - Grille de profils (avatar + prénom + âge + statut)
  - Formulaire de création (prenom, age, niveau, PIN, avatar)
  - Profil désactivé (grisé)
  - Profil verrouillé (badge warning)
  - Aucun profil (empty state)

### 8. Détail d'un profil (`/admin/profiles/:id`)
- **Données** : `GET /api/admin/profiles/:id`, conversations, learner-notes
- **Sections** :
  - Infos profil + badges statut
  - Actions : Modifier, Déverrouiller, Supprimer
  - Formulaire d'édition (prénom, âge, niveau, quotas, consignes, sujets interdits, actif)
  - **Onglet Limites : éditeur de plages horaires** (interrupteur « Limiter les horaires », plages par jour, 4 max, copie lundi → vendredi, aperçu 0–24 h, validation en direct et côté API)
  - Changement de PIN
  - Notes d'apprentissage (par matière)
  - Liste des conversations (cliquables → vue admin)

### 9. Vue conversation admin (`/admin/conversations/:id`)
- **Données** : `GET /api/admin/conversations/:id/messages`
- **États** :
  - Messages avec rôle (Enfant / Lumio / Système) et **type pédagogique** (Question, Indice n/3, Exemple, Réussite, Explication, Réponse de sécurité)
  - Détails modération / guard (expandable)
  - Tokens et modèle utilisé

### 10. Alertes de sécurité (`/admin/safety`)
- **Données** : `GET /api/admin/safety-events`
- **Filtres** : En attente / Acquittées / Toutes
- **États** :
  - Liste d'**AlertCard** (gravité icône + texte, extrait, consigne sur les critiques)
  - Boutons « Lire la conversation » et « Marquer comme traitée »
  - Aucune alerte (empty state)

### 11. Appareils de confiance (`/admin/devices`)
- **Données** : `GET /api/admin/devices`
- **États** :
  - Liste d'appareils (label + dates)
  - Formulaire d'ajout (label)
  - Bouton Révoquer avec confirmation

### 12. Sécurité du compte (`/admin/security`)
- **But** : activer / désactiver l'authentification TOTP
- **Données** : `GET /api/admin/totp/status`
- **États** :
  - TOTP désactivé : bouton « Activer le TOTP »
  - **Flux d'activation** : secret affiché (texte + URI pour QR), champ de saisie du code 6 chiffres, bouton Confirmer / Annuler
  - TOTP activé : badge vert + bouton « Désactiver le TOTP »

## Inventaire des composants

| Composant | Props clés | Fichier |
|-----------|-----------|---------|
| Button | variant, size, disabled, loading | `components/Button.tsx` |
| Input | label, error, disabled | `components/Input.tsx` |
| PinPad | onComplete, error, loading | `components/PinPad.tsx` |
| Avatar | src, size (sm/md/lg) | `components/Avatar.tsx` |
| ProfileCard | prenom, avatar, status | `components/ProfileCard.tsx` |
| ChatBubble | role, children | `components/ChatBubble.tsx` |
| ChatInput | onSend, disabled, maxLength | `components/ChatInput.tsx` |
| TypingIndicator | (none) | `components/TypingIndicator.tsx` |
| Notice | variant, children, onDismiss | `components/Notice.tsx` |
| Card | children, className, onClick | `components/Card.tsx` |
| Table | headers, rows, emptyMessage | `components/Table.tsx` |
| Badge | variant, children | `components/Badge.tsx` |
| Modal | open, onClose, title, children | `components/Modal.tsx` |
| ConfirmDialog | open, onConfirm, message, danger | `components/ConfirmDialog.tsx` |
| Toggle | checked, onChange, label | `components/Toggle.tsx` |
| Tabs | tabs, activeKey, onChange | `components/Tabs.tsx` |
| TagInput | tags, onChange, placeholder | `components/TagInput.tsx` |
| EmptyState | icon, title, description, action | `components/EmptyState.tsx` |
| Toast | (via ToastProvider + useToast) | `components/Toast.tsx` |
| Logo | withWordmark, height, onDark | `components/Logo.tsx` |
| Mascot | state (ecoute/reflechit/indice/bravo/pause/reconfort), size, animated, label | `components/Mascot.tsx` |
| PedagogyCard | tone (question/hint/example), label, aside, footer | `components/PedagogyCard.tsx` |
| QuestionCard / ExampleCard | children, footer | `components/QuestionCard.tsx`, `ExampleCard.tsx` |
| HintCard | level (1/2/3/absent), children, footer | `components/HintCard.tsx` |
| SuccessMoment | children, animated | `components/SuccessMoment.tsx` |
| SafetyMessage | children, showHelplines | `components/SafetyMessage.tsx` |
| TutorMessage | kind, hintLevel, footer, animated | `components/TutorMessage.tsx` |
| QuotaIndicator | remaining, total | `components/QuotaIndicator.tsx` |
| AlertCard | event, prenom, onAcknowledge, onOpenConversation, compact | `components/AlertCard.tsx` |
| ScheduleEditor | value (null = sans restriction), onChange | `components/ScheduleEditor.tsx` (+ `schedule.ts`) |
| Illustration | name, size | `components/Illustration.tsx` |

## Design tokens

Voir `src/styles/tokens.css` pour la liste complète. Les principaux :

### Couleurs
`--color-primary`, `--color-primary-hover`, `--color-primary-light`, `--color-secondary`, `--color-accent`, `--color-surface`, `--color-surface-alt`, `--color-background`, `--color-foreground`, `--color-foreground-muted`, `--color-border`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`

### Bulles chat
`--color-bubble-child`, `--color-bubble-child-text`, `--color-bubble-assistant`, `--color-bubble-assistant-text`, `--color-bubble-notice`, `--color-bubble-notice-text`

### Spectre pédagogique (ajouts « Prisme »)
`--color-question-{bg,ring,text}`, `--color-hint-{bg,ring,text,track}`, `--color-example-{bg,ring,text}`, `--color-ray-{sun,mint,sky,coral}`, `--color-sheet*`, `--color-on-{primary,secondary,danger}`, `--color-focus`, `--color-border-subtle`, `--color-nav`

### Typographie
`--font-sans` (Lexend), `--font-display` (Unbounded), `--font-mono`, `--text-display` → `--text-tiny`, `--text-label`

### Espacement
`--space-1` → `--space-6`, `--size-touch-target`, `--size-avatar-sm/md/lg`, `--size-pin-dot`, `--size-icon`

### Rayon
`--radius-card`, `--radius-button`, `--radius-input`, `--radius-full`

### Ombres
`--shadow-card`, `--shadow-modal`, `--shadow-focus`

### Divers
`--color-on-dark`, `--color-mascot-*` (corps/tête/contour/lueur/visage/ailes/atténué), `--leading-body`, `--duration-fast/med/slow`, `--ease-out`

## Mode maquette

```bash
cd frontend
npm install
VITE_USE_MOCKS=true npm run dev
```

Données de démo :
- **Léa** (7 ans, CP) : conversations sur les additions et les animaux, méthode par indices
- **Noah** (10 ans, CM2) : conversation sur les fractions, quota normal
- **Inès** (13 ans, 4e) : conversation sur l'histoire, profil verrouillé (demo)
- Alertes : 1 critique (détresse), 2 warnings (jailbreak + info perso), 1 acquittée
- PIN de démo : `5678` pour tous les profils

Pages de prévisualisation design (mode maquette + dev uniquement, absentes du build de production) :
- `/__design/components` : chaque composant × chaque état × les 3 thèmes
- Captures : `npm run screenshots` (voir `frontend/scripts/screenshots.ts`) → `docs/design/screenshots/`
- Audit accessibilité : `node --experimental-strip-types scripts/axe.ts` → `docs/design/axe-report.json`
- Vérification des tokens : `node --experimental-strip-types scripts/check-tokens.ts` (aussi test vitest)

## Schémas OpenAPI

Référence complète dans `docs/openapi.json` (généré via `make openapi`).

## Demandes au backend (issues du design)

Le design ne contient pas de section « Demandes au backend » explicite ; voici
celles qu'il implique.

| Demande | Statut |
|---|---|
| Savoir de quel type est chaque message de Lumio (question, indice + niveau, exemple, réussite) | **Fait** : sortie JSON du tuteur, `output_guard` (`type_ok`), colonnes `message.kind` / `hint_level` (migration 002), API + SSE `done`, repli sans type |
| Distinguer la réponse de sécurité après rechargement | **Fait** : `kind = "safety"` sur les réponses prédéfinies critiques |
| Exposer `locked` / `hors_plage_horaire` au choix du profil | Déjà dans l'API ; ajouté au type front et aux mocks |
| Plages horaires éditables | **Fait** : validation `plages_horaires` (jours, HH:MM, début < fin, pas de chevauchement, 4 max) |
| Feuille de Lumio (dessins structurés) | **Fait (prototype, drapeau)** : outil `show_visual`, `message.visual`, `profile.supports_visuels` — `docs/VISUAL_AIDS.md` |
| Étiquette de matière dans l'en-tête 9-14 (« Maths ») | **Reporté** : demande une classification de la conversation (appel LLM ou heuristique) et une colonne ; à décider avec les notes d'apprentissage |
| Liens « Regarde la feuille n » dans les cartes | **Fait** |
| Types `table` et `diagram` (schéma légendé) du catalogue | **Reportés** (cf. `docs/VISUAL_AIDS.md` §8) |
