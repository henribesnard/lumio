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

## Thèmes

Trois thèmes définis par attribut `data-*` sur un conteneur parent :

- `[data-age="6-8"]` — jeunes enfants : textes plus grands, couleurs vives, cibles tactiles ≥ 56px
- `[data-age="9-14"]` — enfants/ados : valeurs par défaut
- `[data-theme="admin"]` — tableau de bord admin : sobre, desktop-first

Les variables sont dans `src/styles/tokens.css`.

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
  - Appareil non reconnu (erreur)
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
  - Aucune conversation (empty state)
  - Bouton « Nouvelle conversation »
  - Hors plage horaire (bannière warning, bouton désactivé)
  - Quota atteint (bannière info, bouton désactivé)
  - Header : avatar + prénom + quota restant + bouton Quitter

### 4. Chat (`/chat/:conversationId`)
- **But** : conversation avec Lumio
- **Données** : `GET /api/kid/conversations/:id/messages`, `POST` → SSE
- **États** :
  - Messages (bulles child à droite, assistant à gauche, notice au centre)
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
  - Changement de PIN
  - Notes d'apprentissage (par matière)
  - Liste des conversations (cliquables → vue admin)

### 9. Vue conversation admin (`/admin/conversations/:id`)
- **Données** : `GET /api/admin/conversations/:id/messages`
- **États** :
  - Messages avec rôle (Enfant / Lumio / Système)
  - Détails modération / guard (expandable)
  - Tokens et modèle utilisé

### 10. Alertes de sécurité (`/admin/safety`)
- **Données** : `GET /api/admin/safety-events`
- **Filtres** : En attente / Acquittées / Toutes
- **États** :
  - Liste d'alertes avec severity badge + type + extrait
  - Bouton Acquitter
  - Aucune alerte (empty state)

### 11. Appareils de confiance (`/admin/devices`)
- **Données** : `GET /api/admin/devices`
- **États** :
  - Liste d'appareils (label + dates)
  - Formulaire d'ajout (label)
  - Bouton Révoquer avec confirmation

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

## Design tokens

Voir `src/styles/tokens.css` pour la liste complète. Les principaux :

### Couleurs
`--color-primary`, `--color-primary-hover`, `--color-primary-light`, `--color-secondary`, `--color-accent`, `--color-surface`, `--color-surface-alt`, `--color-background`, `--color-foreground`, `--color-foreground-muted`, `--color-border`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`

### Bulles chat
`--color-bubble-child`, `--color-bubble-child-text`, `--color-bubble-assistant`, `--color-bubble-assistant-text`, `--color-bubble-notice`, `--color-bubble-notice-text`

### Typographie
`--font-sans`, `--font-mono`, `--text-display` → `--text-tiny`

### Espacement
`--size-touch-target`, `--size-avatar-sm/md/lg`

### Rayon
`--radius-card`, `--radius-button`, `--radius-input`, `--radius-full`

### Ombres
`--shadow-card`, `--shadow-modal`

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

## Schémas OpenAPI

Référence complète dans `docs/openapi.json` (généré via `make openapi`).
