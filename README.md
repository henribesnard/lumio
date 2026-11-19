# Lumio — Tuteur IA pour enfants

Agent conversationnel pédagogique pour enfants de 6 à 14 ans.
Méthode socratique, garde-fous de sécurité, supervision parentale.

## Démarrage rapide

```bash
cp .env.example .env          # Renseigner MISTRAL_API_KEY et SESSION_SECRET
docker compose up -d --build   # Lancer la stack
make migrate                   # Appliquer les migrations
make admin                     # Créer le compte administrateur
# Ouvrir https://localhost:3100 (ou l'URL publique configurée)
```

## Mode maquette (sans backend)

```bash
cd frontend
npm install
VITE_USE_MOCKS=true npm run dev
```

## Commandes

| Commande       | Description                              |
|----------------|------------------------------------------|
| `make dev`     | Développement local (hot reload)         |
| `make test`    | Lancer les tests backend + frontend      |
| `make eval`    | Évaluation pédagogique (API Mistral)     |
| `make up`      | Démarrer via Docker Compose              |
| `make migrate` | Appliquer les migrations Alembic         |
| `make admin`   | Créer le compte administrateur           |
| `make openapi` | Exporter le schéma OpenAPI               |
| `make backup`  | Sauvegarde de la base de données         |
| `make lint`    | Vérifier le code (ruff, mypy, eslint)    |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Sécurité](docs/SECURITY.md)
- [Déploiement](docs/DEPLOY.md)
- [Handoff design](docs/DESIGN_HANDOFF.md)

## Stack

- **Backend** : Python 3.12, FastAPI, SQLAlchemy 2, PostgreSQL 16, LangGraph
- **Frontend** : React, Vite, TypeScript, Tailwind CSS
- **IA** : Mistral via LangGraph, modération multi-couches
