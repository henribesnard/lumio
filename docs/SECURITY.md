# Sécurité — Lumio

## Vue d'ensemble

Lumio est un tuteur IA pour enfants de 6 à 14 ans. La sécurité des enfants est la priorité absolue. Ce document décrit les garde-fous, la journalisation et les procédures en cas d'alerte.

## Authentification

### Administrateur
- Email + mot de passe (≥ 12 caractères), hashé avec **argon2**
- TOTP optionnel (2FA)
- 5 échecs → verrouillage 15 minutes
- Session de 12 heures, cookie `httpOnly`, `Secure`, `SameSite=Strict`
- Compte créé uniquement en CLI (`make admin`), aucune inscription publique

### Appareil de confiance
- L'admin active un appareil comme « appareil familial »
- Cookie `lumio_device` signé, 90 jours, révocable
- Seul un appareil de confiance affiche la liste des prénoms
- La liste des prénoms n'est **jamais publique**

### Enfant
- Choix du profil + code PIN à 4 chiffres, hashé avec argon2
- PIN triviaux refusés (0000, 1111, 1234, etc.)
- 5 échecs → profil verrouillé 15 minutes + alerte `pin_lockout`
- Rate limit par IP : 20 tentatives / 15 minutes
- Session expirée après 2 heures d'inactivité

## Protection contre les attaques web

| Vecteur | Protection |
|---------|-----------|
| CSRF | Vérification `Origin` + double-submit token (`X-CSRF-Token`) |
| XSS | Cookies `httpOnly`, pas de `dangerouslySetInnerHTML` |
| CORS | Même origine uniquement (`PUBLIC_URL`) |
| Injection SQL | SQLAlchemy ORM, requêtes paramétrées |
| Session hijacking | Cookies signés avec `itsdangerous`, `Secure`, `SameSite=Strict` |

## Cloisonnement

- Un enfant n'accède qu'à ses propres conversations
- `/api/admin/*` exige le rôle admin
- `/api/kid/profiles` exige un appareil de confiance
- Les verdicts de modération et de garde ne sont visibles que par l'admin

## Modération de l'agent IA

### Entrée (input_guard)
1. **Modération Mistral** : détection de contenu inapproprié
2. **Classificateur LLM** : analyse JSON stricte (détresse, auto-agression, maltraitance, données personnelles, jailbreak, sujet interdit)
3. **Règles locales** : regex pour téléphone, email, adresse, réseaux sociaux + correspondance sujets interdits

### Routage
- Détresse/auto-agression/maltraitance → **réponse prédéfinite** + alerte `critical`
- Contenu bloqué/jailbreak → **redirection** + alerte `warning`
- Info personnelle → continue avec alerte `warning`

### Sortie (output_guard)
1. Vérification que la réponse ne donne pas directement la solution
2. Vérification de l'adaptation à l'âge
3. Vérification de l'absence de contenu inapproprié
4. Cohérence du type pédagogique déclaré par le tuteur (question, indice…) : un
   type incohérent est retiré (le message s'affiche sans mise en forme), il ne
   change jamais la règle « pas de réponse directe », y compris pour un indice
   de niveau 3
5. Supports visuels (si activés) : schéma strict en liste blanche (aucun SVG/HTML
   du modèle, aucune URL), garde déterministe (le résultat d'un calcul posé par
   l'enfant ne peut pas apparaître), données personnelles, revue par le garde de
   sortie ; un visuel refusé est retiré, le texte part seul
6. Rewrite 1× max si nécessaire, sinon fallback prédéfini

### Réponses prédéfinies
Pour les cas critiques (détresse, auto-agression, maltraitance), **aucune génération LLM** : les réponses sont prédéfinies par tranche d'âge dans `safe_responses.yaml`, incluant les numéros d'urgence (119, 3018, 3114).

## Journalisation

### Événements de sécurité (`safety_event`)
| Type | Gravité | Déclencheur |
|------|---------|-------------|
| `distress` | critical | Tristesse profonde, peur |
| `self_harm` | critical | Envie de se faire du mal |
| `abuse_disclosure` | critical | Révélation de violences |
| `inappropriate_content` | warning | Contenu inadapté |
| `personal_info_shared` | warning | Info personnelle détectée |
| `jailbreak_attempt` | warning | Tentative de contournement |
| `forbidden_topic` | info | Sujet interdit |
| `pin_lockout` | warning | 5 échecs PIN |
| `quota_reached` | info | Quota atteint |

### Journal d'audit (`audit_log`)
Toutes les actions admin sont journalisées :
- Connexion/déconnexion
- Création/modification/suppression de profils
- Changement de PIN
- Lecture de conversations
- Gestion des appareils de confiance

## Conduite à tenir face à une alerte critique

1. **Alerte affichée en tête du tableau de bord admin**
2. L'admin doit :
   - **Lire la conversation** pour comprendre le contexte
   - **Parler à l'enfant** (ne pas ignorer l'alerte)
   - Pour les cas de détresse/auto-agression : vérifier que l'enfant va bien, contacter un professionnel si nécessaire
   - Pour les cas de maltraitance : contacter les autorités compétentes (119)
   - **Acquitter l'alerte** dans le tableau de bord après action
3. L'enfant a reçu un message avec les numéros d'urgence

## Rétention des données

- Conversations : `CONVERSATION_RETENTION_DAYS` (défaut 365 jours)
- Purge quotidienne automatique
- Export RGPD disponible par profil (`/api/admin/profiles/{id}/export`)

## Secrets

- Tous les secrets dans `.env`, jamais commité
- `.env.example` fourni sans valeurs sensibles
- `MISTRAL_API_KEY`, `SESSION_SECRET`, `POSTGRES_PASSWORD` obligatoires en production

## Limites connues

- Pas de notification externe (email, push) pour les alertes critiques — l'admin doit consulter le tableau de bord
- La modération dépend de la qualité du modèle Mistral — les réponses prédéfinies sont le filet de sécurité
- Le rate limiting IP est en mémoire (réinitialisé au redémarrage)
