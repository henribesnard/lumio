# Lumio — Direction artistique (Phase 1)

Document de travail pour le choix de piste. Prévisualisation interactive :
`/__design` en mode maquette (`VITE_USE_MOCKS=true npm run dev`).

**Concept commun aux deux pistes** : Lumio est *la petite lumière qui s'allume
quand on comprend*. L'interface ne donne jamais la réponse ; elle met en valeur
les **indices et les questions** de l'agent. La mascotte « Lumi » accompagne
l'enfant dans 5 états : **écoute, réfléchit, indice, bravo, pause**. Aucun badge,
aucune série, aucune récompense addictive : la seule « récompense » est la
réussite de l'enfant, célébrée sobrement.

Mode clair prioritaire, français uniquement, trois registres (`6-8`, `9-14`,
`admin`), WCAG AA vérifié par script (contraste calculé selon WCAG 2.1 —
luminance relative, seuils 4.5:1 texte / 3:1 composants UI).

---

## Piste A — « Braise » (papier chaud, lueur d'ambre)

**Esprit** : un carnet de cours au coin du feu. Fond crème, encre brune
chaude, primaire terracotta profond, lueur ambre comme accent lumineux.
Chaleureux sans être criard ; lisible par un adulte comme par un enfant.

### Palette

| Rôle | Valeur | Usage |
|---|---|---|
| `--color-background` | `#FBF5EB` | fond crème |
| `--color-surface` / `-alt` | `#FFFFFF` / `#F4EAD9` | cartes, champs |
| `--color-foreground` / `-muted` | `#2A2118` / `#6B5D4F` | texte (14.6:1 / 5.9:1 sur fond) |
| `--color-border` | `#8F7B60` | bordures (3.8:1 sur fond, 4.1:1 sur blanc — seuils UI OK) |
| `--color-primary` / `-hover` | `#9A3412` / `#7C2D12` | actions (7.3:1 et 9.4:1 avec texte blanc) |
| `--color-primary-light` | `#FBE3C8` | fonds de sélection, bulle enfant |
| `--color-secondary` | `#0F766E` | actions secondaires (5.5:1 avec blanc) |
| `--color-accent` | `#F59E0B` | **décoratif uniquement** (halo de Lumi, état « bravo ») — jamais de texte dessus (2.0:1) |
| success / warning / danger / info | `#15803D` / `#92400E` / `#B91C1C` / `#1D4ED8` | 4.6–6.5:1 sur fond ; teintes d'arrière-plan `#E5F3E8`, `#FCEED3`, `#FBE4E4`, `#E3ECFB` avec texte foncé ≥5.3:1 |

### Typographie (auto-hébergée, OFL, sous-ensemble latin)

| Registre | Police | Tailles |
|---|---|---|
| `6-8` | **Atkinson Hyperlegible** (Braille Institute) | body ≥ 20 px |
| `9-14` | **Lexend** variable | body 16 px |
| `admin` | **Inter** variable | body 15 px, desktop |

### Mascotte — « Lumi la braise »

Grosse goutte chaude (superellipse ambre `#F59E0B`, contour `#9A3412`),
visage géométrique minimal (2 yeux + sourire), **halo** autour du corps.
5 états : écoute (halo ondulant), réfléchit (3 points qui montent),
indice (étincelle 4 branches en haut à droite), bravo (3 étincelles + grand
sourire), pause (corps estompé + 2 barres verticales, aucun festif).

### Ton

Chaleureux, conteur, simple : « On allume une petite lumière et on cherche
ensemble. » / « Bravo, tu as trouvé ! » / « On fait une pause. »

---

## Piste B — « Brume » (ciel du soir apprivoisé, luciole)

**Esprit** : un ciel d'orage doux qui s'éclaircit. Fond gris-bleu frais, encre
ardoise, primaire indigo profond, la luciole ambrée comme seule touche chaude.
Plus sobre, très lisible, jamais infantilisant pour un ado de 13 ans.

### Palette

| Rôle | Valeur | Usage |
|---|---|---|
| `--color-background` | `#F3F5FA` | fond brume |
| `--color-surface` / `-alt` | `#FFFFFF` / `#E8ECF5` | cartes, champs |
| `--color-foreground` / `-muted` | `#1C2333` / `#55607A` | texte (14.4:1 / 5.8:1 sur fond) |
| `--color-border` | `#6E7A94` | bordures (4.0:1 sur fond, 4.3:1 sur blanc) |
| `--color-primary` / `-hover` | `#4F46E5` / `#4338CA` | actions (6.3:1 et 7.9:1 avec blanc) |
| `--color-primary-light` | `#E4E9F8` | fonds de sélection, bulle enfant |
| `--color-secondary` | `#0E7490` | actions secondaires (5.4:1 avec blanc) |
| `--color-accent` | `#F59E0B` | **décoratif uniquement** (queue de la luciole) — jamais de texte (2.0:1) |
| success / warning / danger / info | `#15803D` / `#92400E` / `#B91C1C` / `#1D4ED8` | 4.6–6.5:1 sur fond ; mêmes teintes que A |

### Typographie

| Registre | Police | Tailles |
|---|---|---|
| `6-8` | **Lexend** variable (géométrique, pensée pour la lecture) | body ≥ 20 px |
| `9-14` | **Inter** variable | body 16 px |
| `admin` | **Inter** variable | body 15 px, desktop |

### Mascotte — « Lumi la luciole »

Luciole géométrique : corps ellipse indigo `#4F46E5`, tête ronde, deux ailes
translucides `#C7D2FE`, **queue lumineuse** ambre `#FBBF24` avec halo, deux
antennes. 5 états : écoute (ondes sonores de part et d'autre de la tête),
réfléchit (3 points au-dessus), indice (étincelle), bravo (ailes relevées +
étincelles), pause (estompé + 2 barres).

### Ton

Calme, direct, sans mièvrerie : « Qu'est-ce que tu en penses ? » /
« Bien joué. » / « Pause pour aujourd'hui. »

---

## Registres communs (deux pistes)

- **`[data-age="6-8"]`** : mêmes couleurs, typographie Atkinson (A) ou Lexend (B),
  body ≥ 20 px, cibles tactiles ≥ 56 px, rayons plus grands, moins d'éléments
  par écran. L'interface se comprend presque sans lire (icônes + mots).
- **`[data-age="9-14"]`** : valeurs par défaut, densité d'une app d'étude.
- **`[data-theme="admin"]`** : sobre et efficace. A : fond `#F6F4EF`, primaire
  brun-noir `#292524` (15.2:1 avec blanc), accent `#9A3412`. B : fond `#F6F7F9`,
  primaire ardoise `#1E293B` (14.6:1 avec blanc), accent `#4338CA`. Alertes
  critiques visibles immédiatement (bordure + badge danger), sans anxiété.

## Vérification AA (script, méthode WCAG 2.1)

Tous les couples **texte/fond** listés ci-dessus sont ≥ 4.5:1 ; les bordures
et anneaux de focus sont ≥ 3:1. L'accent ambre `#F59E0B` n'est **jamais**
utilisé pour du texte ou une information essentielle (règle notée dans
`DESIGN_SYSTEM.md`). Les rapports axe-core par écran viendront en phase 6.

## Éléments communs figés

- Noms de tokens existants conservés (`--color-primary`, `--text-body`, …).
- 5 états de mascotte, logo horizontal + icône, 12 avatars SVG originaux.
- Réponse de sécurité : calme, 119 / 3018 lisibles, **aucune animation festive**.
- Pas d'emoji dans l'UI (les mocks de démo en contiennent dans des *données*,
  ce qui est hors périmètre design).
