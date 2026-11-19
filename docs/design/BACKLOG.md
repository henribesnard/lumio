# Lumio — Backlog design

Éléments repérés pendant le travail de design qui nécessitent une évolution
**côté logique/backend** (hors périmètre design) ou qui sont déjà livrés.

## Demandes au backend

| # | Demande | Pourquoi |
|---|---|---|
| B1 | `GET /api/kid/profiles` (`ProfilePublic`) : exposer l'état `verrouillé` (et idéalement `hors_plage_horaire`) par profil | L'écran de choix du profil doit pouvoir afficher « Verrouillé » / « Hors horaires » (écran 2 de la liste). Aujourd'hui seul le PIN affiche le verrouillage (429 `profile_locked`). |
| B2 | Événement SSE dédié pour les réussites (ex. `event: success`) | « Réussites célébrées sobrement » côté chat : sans marqueur, l'UI ne peut pas distinguer un bravo d'un indice. Les mocks contiennent des « Bravo » textuels, ce n'est pas fiable. |
| B3 | Conserver le type de notice SSE (`quota`, `sujet_interdit`, `pause`, `erreur`) dans le payload `notice` | Pour styliser différemment chaque avis système bienveillant (aujourd'hui un simple `message`). |
| B4 | `GET /api/admin/conversations/:id/messages` : exposer un résumé lisible des verdicts (`moderation`, `guard_verdict`) en plus du JSON brut | L'admin doit lire les badges de modération sans ouvrir le JSON. |

## À implémenter côté logique (frontend)

| # | Élément | Écran |
|---|---|---|
| F1 | Filtrer les conversations archivées (`archived: true`) dans la liste enfant | Historique (`/chat`) |
| F2 | Lien « Espace parents » vers `/admin/login` sur l'écran « Appareil non reconnu » | Choix du profil — **fait en phase 5** (KidSelectPage est dans le périmètre) |

## Déjà livré (ne plus lister)

- Écran dédié « Appareil non reconnu » (PR #1, `KidSelectPage.tsx`) — stylé en phase 5.
- Suggestions par tranche d'âge (grille 2×2) sur l'accueil vide (PR #1, `KidConversationsPage.tsx`).
- Barre de quota visuelle dans le header (PR #1) — présentée positivement, sans rouge (phase 5).
- Page admin « Sécurité » TOTP : états désactivé / activation (secret + URI + code) / activé (PR #1, `AdminSecurity.tsx`, route `/admin/security`).

## Problèmes pré-existants constatés sur `main` (hors design)

- `npm run lint` (`eslint src/`) en échec : aucune config ESLint flat trouvée (corrigé sur la branche `design` par ajout de `eslint.config.js`).
- `npm test` (vitest) en échec : aucun fichier de test (corrigé par `scripts/check-tokens.test.ts`).
- `npx prettier --check src/` non conforme sur main (31 fichiers, aucune config prettier) — laissé tel quel pour ne pas toucher aux fichiers hors périmètre ; à discuter.
- `public/mockServiceWorker.js` est copié dans `dist/` (inert en production : jamais enregistré) — Vite ne sert pas le worker MSW sinon en dev.
