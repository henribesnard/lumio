.PHONY: dev test eval up down migrate openapi admin backup lint format

# Développement local (backend + frontend)
dev:
	docker compose up db -d
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8100 &
	cd frontend && npm run dev

# Tests
test:
	cd backend && python -m pytest -x -q
	cd frontend && npx vitest run

# Évaluation pédagogique (nécessite MISTRAL_API_KEY)
eval:
	cd backend && python -m pytest tests/evals/ -x -q --tb=short

# Docker Compose
up:
	docker compose up -d --build

down:
	docker compose down

# Migrations Alembic
migrate:
	docker compose exec backend alembic upgrade head

# Créer le compte administrateur
admin:
	docker compose exec backend python -m app.cli create-admin

# Exporter le schéma OpenAPI
openapi:
	cd backend && python -m app.cli export-openapi > ../docs/openapi.json

# Sauvegarde
backup:
	bash scripts/backup.sh

# Lint
lint:
	cd backend && ruff check . && mypy .
	cd frontend && npx eslint src/ && npx prettier --check src/

# Format
format:
	cd backend && ruff format .
	cd frontend && npx prettier --write src/
