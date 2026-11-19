# Design — piste « Brume » (refonte complète front, sans régression fonctionnelle)

## Direction retenue

**Piste B « Brume »** (validée en phase 1, cf. `docs/design/DIRECTION.md`) : ciel gris-bleu apprivoisé, primaire indigo `#4F46E5`, luciole ambrée comme seule touche chaude. Mascotte originale « **Lumi la luciole** » (SVG géométrique, 5 états : écoute / réfléchit / indice / bravo / pause). Trois registres : `[data-age="6-8"]` (Lexend, body ≥ 20 px, cibles ≥ 56 px), `[data-age="9-14"]` (Inter, densité app d'étude), `[data-theme="admin"]` (sobre, ardoise `#1E293B`). Polices OFL auto-hébergées (`public/fonts/`). WCAG AA vérifié par script + axe. Français uniquement, mode clair, aucun dark pattern, quota présenté positivement, réponse de sécurité calme (119 / 3018, aucune animation festive).

## Captures des écrans clés

| Écran | Capture |
|---|---|
| Choix du profil (6-8, tablette portrait) | ![01-select](docs/design/screenshots/01-select.png) |
| Appareil non reconnu | ![01-select-untrusted-device](docs/design/screenshots/01-select-untrusted-device.png) |
| PIN | ![02-pin](docs/design/screenshots/02-pin.png) |
| PIN verrouillé | ![02-pin-locked](docs/design/screenshots/02-pin-locked.png) |
| Accueil enfant + quota positif | ![03-kid-home](docs/design/screenshots/03-kid-home.png) |
| Chat | ![04-chat](docs/design/screenshots/04-chat.png) |
| Chat — réponse de sécurité (calme, 119/3018) | ![04-chat-safety-response](docs/design/screenshots/04-chat-safety-response.png) |
| Login admin + étape TOTP | ![07-admin-login-totp](docs/design/screenshots/07-admin-login-totp.png) |
| Tableau de bord (alerte critique en tête) | ![08-admin-dashboard](docs/design/screenshots/08-admin-dashboard.png) |
| Profils | ![09-admin-profiles](docs/design/screenshots/09-admin-profiles.png) |
| Édition profil — onglets | ![10-admin-profile-comportement](docs/design/screenshots/10-admin-profile-comportement.png) |
| Édition profil — zone dangereuse | ![10-admin-profile-danger](docs/design/screenshots/10-admin-profile-danger.png) |
| Conversation admin (badges modération) | ![11-admin-conversation](docs/design/screenshots/11-admin-conversation.png) |
| Alertes | ![12-admin-safety](docs/design/screenshots/12-admin-safety.png) |
| Appareils | ![13-admin-devices](docs/design/screenshots/13-admin-devices.png) |
| Sécurité TOTP — activation | ![14-admin-security-setup](docs/design/screenshots/14-admin-security-setup.png) |
| Sécurité TOTP — activé | ![14-admin-security-enabled](docs/design/screenshots/14-admin-security-enabled.png) |

50 captures (écran × état × viewport) dans `docs/design/screenshots/` : tablette portrait 768×1024 + paysage 1024×768 (enfants), desktop 1440×900 (admin), mobile 390×844 (accueil/chat). Showroom composants : `00-design-components.png` (`/__design/components`, mode maquette uniquement).

## Vérifications

- `npm run lint` ✅ (config flat ajoutée, voir écarts), `npm test` ✅ (vitest, `check-tokens.test.ts`), `npm run build` ✅, `docker compose build frontend` ✅
- Tokens : `npm run check-tokens` ✅ — aucune valeur en dur hors `tokens.css`, contrastes AA calculés par thème
- Accessibilité : `npm run axe` ✅ **zéro violation serious/critical** sur tous les écrans (`docs/design/axe-report.json`) ; `npm run keyboard` ✅ navigation clavier complète PIN / chat / édition profil, focus visible partout
- `/__design*` **absent du build de production** (vérifié dans `dist/`)

## Écarts & limites (hors périmètre, signalés)

- `frontend/src/main.tsx` : montage minimal des pages `/__design*` **uniquement** en `VITE_USE_MOCKS=true` + dev (routes non touchées) ; vérifié absent de `dist/`.
- `frontend/eslint.config.js` ajouté : `npm run lint` échouait sur main faute de config (ESLint 9 flat).
- `frontend/src/mocks/handlers.ts` : une seule ligne supprimée (variable inutilisée `TS6133`) — strictement nominal, sans changement de comportement.
- `npx prettier --check src/` était déjà non conforme sur main (31 fichiers, aucune config) — laissé tel quel.
- `public/mockServiceWorker.js` (relais MSW dev) est copié dans `dist/` mais jamais enregistré en production — inerte.
- La page profil admin a été **restructurée en onglets** (présentation) : appels API identiques ; `window.confirm` remplacé par le composant `ConfirmDialog` (mêmes appels) ; l'onglet « Aperçu du prompt » utilise l'endpoint existant `GET /api/admin/profiles/:id/prompt-preview` (lecture seule).
- **Base de la branche** : la PR #1 était encore ouverte au moment de la création (main distant à `0b36541`) ; cette branche est rebasée sur la tête de la PR #1 (`98ecd71`) — si la PR #1 est mergée entre-temps, la diff se réduira d'autant. Les nouveaux écrans de la PR #1 (appareil non reconnu, suggestions par âge, barre de quota, page Sécurité TOTP) sont stylés et capturés.

## BACKLOG (`docs/design/BACKLOG.md`)

**Demandes au backend**

| # | Demande | Pourquoi |
|---|---|---|
| B1 | `GET /api/kid/profiles` (`ProfilePublic`) : exposer `verrouillé` (et idéalement `hors_plage_horaire`) | Badges « Verrouillé » / « Hors horaires » sur le choix du profil (aujourd'hui seul le PIN signale le verrouillage, 429 `profile_locked`) |
| B2 | Événement SSE dédié aux réussites (ex. `event: success`) | Célébrer sobrement sans confondre bravo et indice |
| B3 | Conserver le type de notice SSE (`quota`, `sujet_interdit`, `pause`, `erreur`) dans le payload | Styliser chaque avis système différemment |
| B4 | Résumé lisible des verdicts `moderation` / `guard_verdict` côté admin | Lire les badges sans ouvrir le JSON brut |

**À implémenter côté logique (frontend)**

| # | Élément | Écran |
|---|---|---|
| F1 | Filtrer les conversations archivées dans la liste enfant | Historique `/chat` |
| F2 | Éditeur complet des plages horaires (lecture seule aujourd'hui) | Profil → Limites |
| F3 | Les mocks de démo contiennent encore des emoji dans des contenus | Données de démo uniquement |

Rien n'a été déployé sur le VPS.
