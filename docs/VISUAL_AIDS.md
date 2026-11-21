# Supports visuels — « la feuille de Lumio »

Étude et conception (partie B1), puis description du prototype livré derrière
un drapeau (partie B2). Le design « Prisme » prévoit déjà ce composant : la
**feuille de Lumio**, une page blanche où Lumio écrit et dessine, qui « ne donne
jamais la réponse : elle montre ce qu'on sait déjà et laisse toujours une case
**?** à l'enfant ».

> Règle d'or, inchangée : Lumio ne donne jamais la réponse. Un visuel illustre
> une étape ou une représentation ; il ne contient ni la valeur cherchée, ni le
> résultat, ni la solution rédigée.

---

## 1. Cas d'usage pédagogiques

Les visuels servent à *représenter* (passer d'un énoncé à un modèle), à
*comparer* et à *ordonner*. Ils accompagnent une question ou un indice, jamais
une réponse.

### 6–8 ans (CP–CE2) : manipuler, compter, comparer

| Matière | Besoin | Visuel | Exemple concret (ce qui est montré / ce qui reste à trouver) |
|---|---|---|---|
| Numération | compter avec des objets, faire des dizaines | `fraction_bars` (barres découpées) ou droite graduée 0–20 | 7 + 8 : une barre de 10 cases dont 7 coloriées ; « combien de cases vides ? » — le résultat 15 n'apparaît pas |
| Calcul | addition / soustraction avec sauts | `number_line` | 7 + 5 : droite 0–15, saut violet de 0 à 7, saut menthe « +3 » jusqu'à 10 (indice 2), puis une case « ? » pour la suite — le 12 n'est pas marqué |
| Fractions (initiation) | « la moitié », « le quart » | `fraction_bars` | une tablette de chocolat en 4, 1 part coloriée ; « quelle part as-tu mangée ? » |
| Temps | jours, semaine, saisons | `timeline` simple | lundi → vendredi avec le mercredi à placer |
| Questionner le monde | lire un petit graphique | `chart` (barres) | livres lus du lundi au mercredi, jeudi « ? » |

### 9–11 ans (CM1–6e) : modéliser

| Matière | Besoin | Visuel | Exemple |
|---|---|---|---|
| Nombres | décimaux, encadrements, fractions sur une droite | `number_line` | placer 3/4 : droite 0–1 graduée en quarts, aucune étiquette sur la graduation visée |
| Fractions | comparer, additionner | `fraction_bars` | 1/3 et 1/4 côte à côte, chacune découpée ; « comment les découper pareil ? » (on ne montre pas les douzièmes si c'est la question) |
| Grandeurs | aires, périmètres | `shape` | rectangle 6 × 4 cm avec cotes ; « combien de carreaux ? » sans l'aire écrite |
| Histoire | frise | `timeline` | 1789, 1804, et « abolition de l'esclavage : ? » |
| Sciences | lire un tableau de mesures | `chart` | température de la semaine, une valeur à lire |

### 12–14 ans (5e–3e) : fonctions, statistiques, géométrie

| Matière | Besoin | Visuel | Exemple |
|---|---|---|---|
| Fonctions | lire une courbe, proportionnalité | `chart` (courbe) | prix en fonction du nombre de places ; « que vaut f(5) ? » : le point x = 5 n'est pas tracé ou vaut « ? » |
| Statistiques | moyenne, médiane | `chart` (barres) | notes d'une classe ; l'enfant calcule la moyenne |
| Géométrie | triangle, cercle, aires | `shape` | triangle base 6 / hauteur 4 et son « jumeau » qui forme un rectangle (design 9-14) — l'aire du triangle reste « ? » |
| Sciences | schémas (cycle de l'eau, circuit) | *schéma légendé* (reporté, cf. §6) | cycle de l'eau avec la case « ? » sous le nuage |
| Algèbre | formules | *formule KaTeX* (reporté) | — |

Quand **ne pas** dessiner : réponses de sécurité ou de redirection, avis système,
questions purement verbales (conjugaison simple, définitions), et chaque fois
qu'un dessin donnerait la réponse (par ex. « combien font 7 + 5 ? » ne justifie
pas une droite dont la graduation 12 est mise en valeur).

---

## 2. Architecture : options comparées

### (a) Spécification déclarative + composants en liste blanche — **retenue**

Le tuteur appelle un outil `show_visual` (function calling Mistral) dont les
arguments forment un JSON validé par un **schéma Pydantic strict** (union
discriminée par `kind`, `extra="forbid"`, bornes de taille). Le frontend rend
ce JSON avec ses propres composants SVG (droite graduée, barres de fractions,
graphique, figure, frise), à partir de primitives limitées.

- **Sécurité** : le front n'exécute ni HTML, ni JavaScript, ni SVG produit par
  le modèle. Le pire cas d'une spécification malveillante est un dessin faux,
  pas une injection. Les chaînes sont du texte (React les échappe).
- **Pédagogie contrôlable** : les champs sont sémantiques (« marques »,
  « sauts », « valeurs inconnues »), donc vérifiables automatiquement (on sait
  si la valeur 12 est marquée sur la droite).
- **Accessibilité** : texte alternatif *généré depuis la spécification*, pas
  laissé à la discrétion du modèle.
- **Cohérence** : tokens du design, calques « encre / menthe pointillé / soleil ».
- Limites : on ne dessine que ce que les composants savent dessiner ; chaque
  nouveau type demande du code (c'est voulu).

### (b) Génération de SVG/HTML par le modèle — **écartée**

- SVG et HTML sont des formats actifs : `<script>`, `onload`, `<foreignObject>`,
  `xlink:href`, `<image href="https://…">` (traçage, contenu externe), CSS
  `url()`. Il faudrait un assainisseur (DOMPurify) maintenu, une CSP stricte et
  un rendu en `<img>`/iframe sandboxé — beaucoup de surface pour un public de
  6–14 ans.
- Vérifier qu'un SVG arbitraire « ne contient pas la réponse » est presque
  impossible automatiquement (texte vectorisé, positions…).
- Qualité visuelle et accessibilité aléatoires, coût en jetons élevé
  (un SVG fait vite 2 000 à 6 000 jetons contre 150–400 pour une spécification).

Encadrement si un jour nécessaire : rendu côté serveur en PNG à partir d'un
SVG assaini (liste blanche d'éléments sans texte libre), jamais injecté dans le
DOM. Non recommandé.

### Variante (a′) : champ `visual` dans la sortie JSON du tuteur

Possible aussi (même schéma, même validation), sans function calling. Le
prototype utilise l'outil, comme demandé, car l'outil n'est proposé que si le
drapeau est actif : sans drapeau, le modèle ne voit même pas l'option.

---

## 3. Garde-fous

| Garde-fou | Mise en œuvre |
|---|---|
| **Valeur cherchée ni écrite ni mise en valeur avant la réussite** | tant que le message n'est pas de type `success`, la valeur cherchée n'apparaît ni en nombre ou étiquette, ni en repère, point, couleur, barre ou flèche qui s'arrête (ou part) dessus. Sur une droite graduée, sa graduation reste mais son nombre est masqué (`masked`, ajouté par le serveur), y compris dans le texte alternatif lu par les lecteurs d'écran (une borne égale au résultat devient « une valeur à trouver »). Valeur cherchée : calcul simple (entiers, décimaux, fractions `a/b ± c/d`) du message courant ou des derniers messages de l'enfant. Contrôle déterministe (`enforce_no_answer`), répété après le garde de sortie si celui-ci retire le type `success` ; même règle dans le prompt du tuteur et dans `output_guard` (qui reçoit la valeur cherchée) |
| Ne pas révéler la réponse | consignes du prompt (§ `06_supports_visuels.md`), **vérification déterministe** (si l'enfant pose un calcul simple `a ± × ÷ b`, le résultat ne doit apparaître ni comme marque, ni comme fin de saut, ni comme étiquette, ni comme valeur), puis **output_guard** (LLM) qui reçoit la description du visuel et renvoie `visual_reveals_answer` |
| Texte et visuel vérifiés ensemble | `output_guard` reçoit le texte, le type de message et la description du visuel ; un visuel refusé est retiré, le texte part seul |
| Modération des textes du visuel | toutes les chaînes du visuel passent dans le garde de sortie, plus les règles locales (données personnelles, URL) |
| Taille | ≤ 12 marques / barres / points par série, ≤ 3 séries, ≤ 8 événements, ≤ 4 barres de fractions, chaînes ≤ 40 caractères (titre ≤ 60), JSON ≤ 4 Ko |
| Pas d'URL ni d'image externe | aucun champ URL dans le schéma ; refus des chaînes contenant `http`, `www.`, `data:`, `<`, `>` |
| Un seul visuel par message | le premier appel d'outil est gardé, les autres ignorés |
| Jamais sur la sécurité | aucun visuel sur les réponses prédéfinies (sécurité, redirection, erreur) |
| Désactivable | drapeau global `VISUAL_AIDS_ENABLED` (faux par défaut) **et** réglage par profil « Supports visuels » (désactivé par défaut) |
| Échec ⇒ texte seul | spécification invalide, trop grosse, refusée ou erreur d'appel ⇒ la réponse part sans visuel (jamais d'échec du message) |

---

## 4. Données

- Colonne `message.visual` (JSON, nullable) : la spécification **validée et
  normalisée** (pas la sortie brute du modèle), plus `alt` généré. Choisie
  plutôt qu'une table `message_attachment` : un seul visuel par message, lecture
  toujours conjointe, migration triviale. Une table deviendra utile si l'on
  ajoute plusieurs pièces jointes ou des fichiers.
- Colonne `profile.supports_visuels` (booléen, défaut faux).
- API : `visual` dans `GET /api/kid/conversations/{id}/messages`, dans
  `GET /api/admin/conversations/{id}/messages` et dans l'événement SSE `done`.
- Rétention : identique au message (`CONVERSATION_RETENTION_DAYS`, suppression
  en cascade). L'export RGPD du profil inclut `visual`, `kind` et `hint_level` de chaque message.
- Les verdicts de garde sur le visuel restent dans `guard_verdict` (admin seulement).

---

## 5. Interface

Conforme aux planches « Composant Feuille » et « Chat » du design :

- **Paysage (tablette ≥ 1024 px)** : la feuille est un panneau blanc à droite du
  fil (6-8 : coins 28 px, ombre douce ; 9-14 : la feuille reste blanche sur le
  fond sombre). En-tête « Feuille de Lumio », onglets numérotés (6-8 : pastilles
  « 1 », « 2 » ; 9-14 : « 1 · titre »), bouton « Agrandir ».
- **Portrait / mobile** : la feuille s'affiche au-dessus du fil, repliable
  (« Réduire » / « Voir la feuille »).
- **Dans le fil** : la carte du message porte un lien « Regarde la feuille n »
  qui ouvre la page correspondante.
- **Agrandir** : modale plein écran (Échap pour fermer, focus piégé).
- **Calques** : encre = ce qu'on sait ; menthe pointillé = ajouté par l'indice ;
  soleil = case « ? » de l'enfant. Rien n'est porté par la couleur seule
  (traits pleins / pointillés, étiquettes).
- **Chargement** : tracé de gauche à droite (600 ms), coupé si mouvement réduit.
- **Erreur** : « Ce dessin n'a pas pu s'afficher » + le texte alternatif. Le chat continue.
- **Sans dessin** : la feuille est repliée, le chat prend toute la largeur.
- **Admin** : le visuel est rendu sous le message dans la lecture de conversation,
  avec la spécification JSON dépliable.

---

## 6. Bibliothèques

| Option | Poids (min+gz) | Licence | Accessibilité | Verdict |
|---|---|---|---|---|
| **SVG maison (React)** | ~4 Ko | — | `role="img"` + alt généré, contrôle total | **retenu** pour les 5 types |
| Recharts | ~95 Ko | MIT | moyenne, SVG riche | inutile pour barres/courbe simples |
| Vega-Lite | ~250 Ko+ | BSD-3 | variable ; le langage permet des expressions | trop puissant pour une sortie de LLM |
| Mafs / JSXGraph | 40–200 Ko | MIT / LGPL | interactif (non requis) | plus tard pour la géométrie dynamique |
| KaTeX | ~75 Ko + polices | MIT | MathML généré | **à ajouter** pour les formules (12–14 ans), en mode `trust: false`, sans macros |

Le SVG maison reprend exactement les tokens et calques du design et ne charge
rien d'externe.

---

## 7. Coût, latence, risques, tests

**Coût** : le schéma de l'outil ajoute ~450 jetons d'entrée par appel (définition
de l'outil + consignes), un appel avec visuel ~150–400 jetons de sortie. Avec
`mistral-small` (≈ 0,1 $ / M jetons en entrée, 0,3 $ / M en sortie), un message
avec visuel coûte environ **+0,0001 $** ; 50 messages/jour ⇒ moins de 0,2 $/mois
par enfant. Le garde de sortie reçoit ~100 jetons de description en plus.

**Latence** : +0,3 à 0,8 s quand un visuel est produit (jetons de sortie
supplémentaires) ; aucune quand l'outil n'est pas utilisé. Pas d'aller-retour
supplémentaire : l'outil est « terminal » (rendu côté client), sauf si le modèle
n'a écrit aucun texte avec l'appel (une relance courte, rare).

**Risques** : visuel qui révèle la réponse (mitigé par trois couches) ; visuel
faux ou trompeur (mitigé par des primitives simples et l'évaluation) ; surcharge
visuelle (un visuel max, seulement si utile) ; refus de l'API de combiner outil
et mode JSON (repli : nouvel appel sans outil) ; dépendance au réglage par
profil (désactivé par défaut).

**Tests** :
- unitaires : validation des schémas, rejets (champ inconnu, URL, trop d'éléments,
  JSON trop gros), texte alternatif, garde déterministe (pour « 7 + 5 » avant la
  réussite : ni « 12 » écrit, ni repère, ni flèche sur 12 ⇒ refusé ; droite
  utile gardée avec la graduation 12 masquée ; message `success` ⇒ autorisé ;
  fractions : 7 parts sur 12 coloriées pour « 1/3 + 1/4 » ⇒ refusé) ;
- graphe : outil absent si drapeau ou profil désactivé ; visuel invalide ⇒ texte
  seul ; visuel refusé par le garde ⇒ texte seul ; visuel transmis dans `done` ;
- front : rendu de chaque type, texte alternatif, repli d'erreur ;
- `make eval` : 6 cas « supports visuels » (dont 3 où le visuel ne doit pas
  révéler la réponse), exécutés avec `MISTRAL_API_KEY`.

---

## 8. Prototype livré (B2)

- Drapeau `VISUAL_AIDS_ENABLED=false` (`.env.example`), réglage par profil
  « Supports visuels » (onglet Comportement de l'agent).
- Types : `number_line`, `fraction_bars`, `chart` (barres / courbe), `shape`
  (rectangle, triangle, cercle), `timeline`.
- Backend : `app/agent/visuals.py` (schémas, validation, texte alternatif,
  garde déterministe), outil `show_visual` lié au tuteur seulement si actif,
  consignes `prompts/06_supports_visuels.md`, `output_guard` étendu, colonne
  `message.visual`, `profile.supports_visuels` (migration 003).
- Frontend : `components/visual/` (`VisualAid` + un composant par type),
  `LumioSheet` (panneau, onglets, agrandir), mocks MSW, `/__design/components`.

Reporté : schéma légendé (`diagram`, nécessite une bibliothèque d'illustrations
validées), tableau (`table`), formules (KaTeX), cartes.
