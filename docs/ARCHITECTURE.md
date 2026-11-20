# Architecture Lumio

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                      Cloudflare                         │
│              (DNS, SSL Full strict, cache bypass /api)   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                   Caddy (hôte)                          │
│    lumio.wezon.fr — TLS via DNS challenge Cloudflare    │
│    /api/* → 127.0.0.1:8100 (flush_interval -1, SSE)    │
│    /*     → 127.0.0.1:3100                              │
└───────┬───────────────────────────────┬─────────────────┘
        │                               │
┌───────▼──────────┐  ┌────────────────▼─────────────────┐
│   Frontend       │  │          Backend                  │
│   React/Vite     │  │  FastAPI + LangGraph              │
│   nginx :3100    │  │  Uvicorn :8100                    │
└──────────────────┘  └──────────┬────────────────────────┘
                                 │
                      ┌──────────▼────────────────────────┐
                      │        PostgreSQL 16               │
                      │  (non exposé, réseau Docker)       │
                      └───────────────────────────────────┘
```

## Flux de données

### Authentification admin
1. `POST /api/auth/admin/login` → vérification email + argon2 → cookie session `httpOnly`
2. Sessions 12 h, TOTP optionnel, 5 échecs → blocage 15 min

### Authentification enfant
1. Admin active un « appareil familial » → cookie `lumio_device` (90 j)
2. `GET /api/kid/profiles` (appareil de confiance) → liste des prénoms + avatars
3. `POST /api/auth/kid/login` → PIN argon2 → cookie session enfant (2 h inactivité)

### Conversation enfant
1. `POST /api/kid/conversations/{id}/messages` → vérif quotas/horaires
2. Message injecté dans le graphe LangGraph
3. Réponse streamée en SSE (événements `token`, `done`, `notice`, `error`) ;
   `done` porte `kind` et `hint_level` (`safety` pour les réponses de sécurité prédéfinies)

## Graphe LangGraph

```
START → input_guard → router ─┬─ critical → safe_response
                               ├─ blocked  → redirect_response
                               └─ ok       → context → tutor → output_guard ─┬─ ok      → stream
                                                          ▲                   ├─ rewrite → tutor (1×)
                                                          └───────────────────┘ └─ block   → fallback

                                                        learner_notes (async, /10 msgs)
```

### Nœuds
- **input_guard** : modération Mistral + classificateur LLM + regex (données perso, sujets interdits)
- **router** : aiguillage selon les flags de l'input_guard
- **context** : assemblage du prompt système (4 couches) + learner_notes + résumé si > 20 messages
- **tutor** : appel Mistral (mode JSON), température 0.4, brouillon non visible.
  Sortie structurée `{type, hint_level, text}` (`app/agent/tutor_output.py`,
  consignes `prompts/05_format.md`) : `type` ∈ question / hint / example /
  success / explanation, `hint_level` 1–3 pour les indices. Lecture tolérante :
  texte brut accepté sans type, JSON illisible relancé une fois puis fallback ;
  le JSON brut n'est jamais montré à l'enfant.
- **output_guard** : modération + classificateur de sortie sur le texte, avec le
  type déclaré (`type_ok` faux ⇒ le type est retiré, le message s'affiche
  normalement) ; rewrite 1× max, sinon fallback
- **safe_response** / **redirect_response** : réponses prédéfinies par tranche d'âge
- **learner_notes** : mise à jour asynchrone des notes d'apprentissage

## Modèle de données

### Tables principales
- `admin` : compte unique, email + mot de passe argon2
- `trusted_device` : appareils familiaux autorisés
- `profile` : profils enfants (prénom, âge, niveau, PIN, quotas, plages horaires)
- `learner_notes` : notes d'apprentissage par matière et profil
- `conversation` : conversations par profil
- `message` : messages avec rôle, type pédagogique (`kind`, `hint_level`), tokens, verdicts modération/garde
- `safety_event` : alertes de sécurité avec type et gravité
- `usage_daily` : compteurs quotidiens par profil
- `audit_log` : actions admin

### Tables LangGraph
- Créées par `PostgresSaver.setup()` (checkpointer)

## Sécurité

Voir [SECURITY.md](SECURITY.md) pour le détail.

- Cookies `httpOnly`, `Secure`, `SameSite=Strict`, signés
- CSRF : vérification `Origin` + double-submit token
- CORS : même origine uniquement
- Messages enfant : 1 000 caractères max
- IP réelle via `X-Real-IP` (proxy local uniquement)
- Cloisonnement strict entre profils enfants
- Modération en entrée ET en sortie de l'agent

## Stack technique

| Composant       | Technologie                                |
|-----------------|--------------------------------------------|
| Backend         | Python 3.12, FastAPI, Uvicorn              |
| ORM             | SQLAlchemy 2 async, Alembic                |
| Base de données | PostgreSQL 16                              |
| Agent IA        | LangGraph, langchain-mistralai             |
| Checkpointer    | langgraph-checkpoint-postgres              |
| Auth            | argon2, cookies signés                     |
| Frontend        | React 18, Vite, TypeScript                 |
| CSS             | Tailwind CSS + variables CSS (tokens)      |
| Client API      | openapi-typescript + openapi-fetch         |
| Mocks           | MSW (Mock Service Worker)                  |
| Tests           | pytest, pytest-asyncio, httpx, Vitest      |
| CI              | GitHub Actions                             |
| Conteneurs      | Docker Compose                             |

## Décisions

| # | Décision | Raison |
|---|----------|--------|
| 1 | Cookie de session plutôt que JWT | Plus simple à révoquer, pas de token côté client |
| 2 | PIN argon2 plutôt que bcrypt | Résistance GPU supérieure, adapté aux codes courts |
| 3 | Brouillon tutor non visible | Permet la vérification output_guard avant streaming |
| 4 | Réponses prédéfinies pour les cas critiques | Pas de risque de hallucination sur les sujets sensibles |
| 5 | Résumé après 20 messages | Maintient la qualité du contexte sans exploser les tokens |
| 6 | 1 rewrite max | Évite les boucles infinies, fallback si échec |
| 7 | Frontend sobre, tokens CSS | Permet un handoff design sans toucher au backend |
| 8 | MSW pour le mode maquette | Le designer travaille sans backend ni clé API |
| 9 | Pas de WebSocket, SSE uniquement | Plus simple, compatible Caddy flush_interval, suffisant pour du texte |
| 10 | Postgres unique (app + checkpointer) | Simplifie l'infra, le checkpointer a ses propres tables |
