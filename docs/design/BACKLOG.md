# Lumio — Backlog design

Éléments repérés pendant le travail de design qui nécessitent une évolution
**côté logique/backend** (hors périmètre design) ou qui sont déjà livrés.

## Demandes au backend

| # | Demande | Statut |
|---|---|---|
| B1 | `GET /api/kid/profiles` (`ProfilePublic`) : exposer `locked` et `hors_plage_horaire` par profil | ✅ Livré (PR #3) |
| B2 | Événement SSE dédié pour les réussites (ex. `event: success`) | ⏳ Reporté — nécessite une classification IA de la réponse (détection bravo vs. indice), scope risqué pré-deploy |
| B3 | Conserver le type de notice SSE (`quota`, `hors_plage`) dans le payload `notice` | ✅ Livré (PR #3) |
| B4 | `MessageResponse` : `moderation_summary` lisible en plus du JSON brut (admin uniquement) | ✅ Livré (PR #3) |

## À implémenter côté logique (frontend)

| # | Élément | Statut |
|---|---|---|
| F1 | Filtrer les conversations archivées (`archived: true`) dans la liste enfant | ✅ Déjà fait — le backend filtre `archived=False` |
| F2 | Éditeur complet des plages horaires (l'admin voit les créneaux en lecture seule) | ⏳ Reporté — composant UI conséquent, ne bloque pas le déploiement |
| F3 | Supprimer les emoji des contenus de démo mock | ✅ Livré (PR #3) |

## Déjà livré (ne plus lister)

- Écran dédié « Appareil non reconnu » (PR #1, `KidSelectPage.tsx`) — stylé en phase 5 avec lien « Espace parents » vers `/admin/login`.
- Suggestions par tranche d'âge (grille 2×2) sur l'accueil (PR #1, `KidConversationsPage.tsx`) — stylées en phase 5.
- Barre de quota visuelle (PR #1) — présentée positivement (« Encore N messages aujourd'hui »), jamais de rouge (phase 5).
- Page admin « Sécurité » TOTP : états désactivé / activation (secret + URI + code + erreur) / activé / confirmation de désactivation (PR #1, `AdminSecurity.tsx`, route `/admin/security`) — stylée en phase 5.
- Onglet « Aperçu du prompt » sur le profil admin, alimenté par `GET /api/admin/profiles/:id/prompt-preview` (endpoint existant, lecture seule).

## Problèmes pré-existants constatés sur `main` (hors design)

- `npm run lint` (`eslint src/`) en échec : aucune config ESLint flat trouvée (corrigé sur la branche `design` par ajout de `eslint.config.js`).
- `npm test` (vitest) en échec : aucun fichier de test (corrigé par `scripts/check-tokens.test.ts`).
- `npx prettier --check src/` non conforme sur main (31 fichiers, aucune config prettier) — laissé tel quel pour ne pas toucher aux fichiers hors périmètre ; à discuter.
- `public/mockServiceWorker.js` copié dans `dist/` — corrigé dans le Dockerfile de production (supprimé après build).
