# Lumio — Design System « Brume »

Piste retenue en phase 1 (voir `docs/design/DIRECTION.md` pour les deux pistes
et leurs contrastes vérifiés). Ce document est la référence d'usage :
**toute valeur visuelle passe par `src/styles/tokens.css`**, vérifié par
`npm run check-tokens` (dans le code : aucune couleur en dur hors tokens,
contrastes WCAG 2.1 calculés par script).

## 1. Principes

1. **Lumio guide, ne répond pas.** L'interface met en valeur les *indices et
   questions* de l'agent (bulles assistant distinctes, mascotte contextuelle),
   jamais la réponse toute faite.
2. **La réussite comme seule motivation.** Aucun badge à collectionner, aucune
   série, aucun compte à rebours, aucune récompense addictive. Le quota est
   présenté positivement (« Encore N messages aujourd'hui »), jamais en rouge.
3. **Trois registres, une marque.** `[data-age="6-8"]`, `[data-age="9-14"]`
   (valeurs `:root`), `[data-theme="admin"]`.
4. **Français uniquement, mode clair prioritaire, tablette d'abord côté enfant.**
5. **Accessibilité AA systématique** : contrastes ≥ 4.5:1 (texte) / ≥ 3:1 (UI),
   focus toujours visible, aucune information portée par la seule couleur
   (icône + texte sur tous les états), cibles tactiles selon le registre,
   `prefers-reduced-motion` respecté (animations désactivées).

## 2. Palette (piste « Brume »)

| Rôle | 9-14 (`:root`) | 6-8 | admin |
|---|---|---|---|
| `--color-background` | `#F3F5FA` | idem | `#F6F7F9` |
| `--color-surface` / `-alt` | `#FFFFFF` / `#E8ECF5` | idem | `#FFFFFF` / `#ECEFF5` |
| `--color-foreground` / `-muted` | `#1C2333` / `#55607A` | idem | idem |
| `--color-border` | `#6E7A94` | idem | idem |
| `--color-primary` / `-hover` | `#4F46E5` / `#4338CA` | idem | `#1E293B` / `#0F172A` |
| `--color-primary-light` | `#E4E9F8` | idem | `#ECEFF5` |
| `--color-secondary` | `#0E7490` | idem | `#475569` |
| `--color-accent` | `#F59E0B` | idem | `#4338CA` |
| success / warning / danger / info | `#15803D` / `#92400E` / `#B91C1C` / `#1D4ED8` | idem | idem |
| bulles child / assistant / notice | `#E4E9F8` / `#FFFFFF` / `#FCEED3` | idem | idem |
| `--color-on-dark` | `#FFFFFF` | idem | idem |

**Règle absolue** : `--color-accent` ambre `#F59E0B` est **décoratif
uniquement** (queue de la luciole, halo) — jamais de texte ni d'information
essentielle dessus (contraste 2.0:1). Côté admin, l'accent est l'indigo
foncé `#4338CA`.

## 3. Typographie (polices auto-hébergées, OFL, dans `public/fonts/`)

| Registre | Police | Corps | Cibles tactiles |
|---|---|---|---|
| `6-8` | **Lexend** variable | `--text-body: 1.25rem` (≥ 20 px) | `--size-touch-target: 56px` |
| `9-14` | **Inter** variable | 1rem | 48px |
| `admin` | **Inter** variable | 0.9375rem | 40px |

- Jamais d'appel à Google Fonts : `@font-face` local dans `src/styles/index.css`.
- Tailles : `--text-display`, `--text-heading`, `--text-subheading`,
  `--text-body`, `--text-small`, `--text-tiny` ; interligne `--leading-body`.
- 6-8 : rayons agrandis (`--radius-card: 1.5rem`), icônes **avec** les mots,
  peu d'éléments par écran.

## 4. Tokens par thème

Toutes les variables sont définies dans `tokens.css` ; les thèmes héritent de
`:root` et ne surchargent que ce qui diffère. Catégories :

- **Couleurs sémantiques** : voir tableau ci-dessus + `--color-mascot-*`
  (corps `#4F46E5`, tête `#4338CA`, contour `#3730A3`, lueur `#FBBF24`,
  visage `#1C2333`, ailes `#C7D2FE`, atténué `#6E7A94`/`#98A5C0`).
- **Typographie** : `--font-sans`, `--font-mono`, `--text-*`, `--leading-body`.
- **Espacement / tailles** : `--space-1` → `--space-6`, `--size-touch-target`,
  `--size-avatar-sm/md/lg`, `--size-pin-dot`, `--size-icon`.
- **Rayons** : `--radius-card`, `--radius-button`, `--radius-input`,
  `--radius-full`.
- **Ombres** : `--shadow-card`, `--shadow-modal`, `--shadow-focus`
  (anneau de focus : `0 0 0 2px surface, 0 0 0 4px primary|accent`).
- **Motion** : `--duration-fast: 150ms`, `--duration-med: 300ms`,
  `--duration-slow: 600ms`, `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`.
  Tout mouvement est désactivé si `prefers-reduced-motion` (règle globale dans
  `index.css`).

**Règle de compatibilité** : aucun renommage ni suppression de variable
existante ; les ajouts vont dans `tokens.css` uniquement. Vérification :
`npm run check-tokens` (également test vitest `scripts/check-tokens.test.ts`).

## 5. Mascotte — « Lumi la luciole »

SVG original, géométrique, dans `public/brand/mascot.svg` + composant
`src/components/Mascot.tsx`. 5 états, passés par la prop `state` :

| État | Usage | Visuel |
|---|---|---|
| `ecoute` | message de l'enfant en cours / écran d'attente | ondes de part et d'autre de la tête |
| `reflect` | l'agent réfléchit (indicateur de saisie) | 3 points au-dessus |
| `indice` | l'agent envoie un indice/une question | étincelle 4 branches |
| `bravo` | réussite de l'enfant | ailes relevées + étincelles |
| `pause` | verrouillage, pause, réponse de sécurité | corps estompé + 2 barres — **jamais festif** |

Règles : la mascotte accompagne les bulles assistant dans le chat ; dans la
**réponse de sécurité**, aucun état festif et aucune animation (état `pause`
ou statique, bulle sobre, 119 / 3018 bien lisibles).

## 6. Marque & assets graphiques

- `public/brand/lumio-logo.svg` (horizontal), `lumio-icon.svg` (carré),
  `lumio-wordmark.svg`, `mascot.svg` — composant `Logo`.
- `public/favicon.svg`, `public/icons/icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png`, `apple-touch-icon.png` (générés depuis le SVG :
  `scripts/generate-icons.ts`), `public/manifest.webmanifest`.
- 12 avatars originaux `public/avatars/avatar-01.svg` … `avatar-12.svg`
  (`scripts/generate-avatars.py`). Aucun personnage ni logo emprunté.

## 7. Composants (`src/components/`)

19 composants, chacun avec ses états **hover / focus / active / disabled /
loading / error**, stylés dans les 3 registres, couleurs 100 % tokens :
Button, Input, PinPad, Avatar, ProfileCard, ChatBubble, ChatInput,
TypingIndicator, Notice, Card, Table, Badge, Modal, ConfirmDialog, Toggle,
Tabs, TagInput, EmptyState, Toast — plus **Logo** et **Mascot**.

Showroom : `/__design/components` en mode maquette + dev uniquement
(**absent du build de production** — vérifié dans `dist/`).

Règles communes :
- icônes SVG inline + texte pour tout état (jamais la couleur seule, jamais
  d'emoji dans l'UI) ;
- focus visible via `:focus-visible` + `shadow-focus` (anneau) ;
- `role="status"` / `role="alert"` sur les avis (Notice), `aria-pressed` sur
  les sélections, `aria-checked` sur les switch (Toggle), labels explicites.

## 8. Écrans & états

Tous les écrans du handoff sont stylés, captures dans
`docs/design/screenshots/` (tablette portrait 768×1024 et paysage 1024×768
côté enfant, desktop 1440×900 côté admin, mobile 390×844 pour accueil/chat) :
sélection de profil (verrouillé, hors horaires, appareil non reconnu, erreur,
vide), PIN (saisie, erreur douce, verrouillage), accueil enfant (suggestions
par âge, quota positif, vide), chat (bulles, « réfléchit », streaming, avis
système, **réponse de sécurité calme**), historique, login admin (+ TOTP),
dashboard (alertes critiques en tête), alertes, profils, détail profil
(onglets identité / comportement / limites / notes / aperçu du prompt /
conversations / zone dangereuse), conversation (badges modération), appareils,
sécurité TOTP (désactivé / activation / erreur / activé).

## 9. Accessibilité — règles et vérifications

- **axe-core** sur chaque écran × état : zéro violation serious/critical
  (`npm run axe` → `docs/design/axe-report.json`).
- **Clavier** : navigation complète PIN / chat / édition de profil
  (`npm run keyboard`), focus visible partout.
- Contraste vérifié par script (`npm run check-tokens`) + axe.
- `prefers-reduced-motion` → animations off (règle globale).
- Les écrans enfant n'exposent jamais d'autres données que prénom + avatar
  des autres profils (écran de sélection).

## 10. Ce qu'il ne faut PAS faire

- ❌ Pas de couleur en dur dans les composants (sauf `tokens.css` et la page
  de prévisualisation `design-preview`).
- ❌ Pas de renommage/suppression de token existant.
- ❌ Pas d'emoji dans l'UI, pas d'animation festive sur la réponse de
  sécurité, pas de rouge alarmant sur le quota.
- ❌ Pas de dark pattern (séries, badges, récompenses, incitation à revenir).
- ❌ Pas de personnage/logo emprunté, pas de photo d'enfant.
- ❌ Pas de page `/__design*` dans le build de production.
- ❌ Ne pas toucher à `src/api/`, hooks, `*Container.tsx`, `AuthContext`,
  `routes.tsx`, `src/mocks/` (hors ajouts de données de démo signalés) ni au
  backend — le périmètre design est `src/styles/`, `src/components/`,
  `src/features/**/*View|Page.tsx` (présentation), `public/`, `docs/design/`,
  `frontend/scripts/`.
