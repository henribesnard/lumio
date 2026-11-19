#!/usr/bin/env bash
# Lumio — Sauvegarde PostgreSQL
# Usage: bash scripts/backup.sh
# Cron quotidien recommandé : 0 3 * * * /path/to/lumio/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="lumio_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Sauvegarde Lumio..."

docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "${POSTGRES_USER:-lumio}" "${POSTGRES_DB:-lumio}" \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Sauvegarde créée : ${BACKUP_DIR}/${FILENAME}"

# Rotation — supprimer les sauvegardes de plus de RETENTION_DAYS jours
find "$BACKUP_DIR" -name "lumio_backup_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date)] Rotation effectuée (rétention ${RETENTION_DAYS} jours)."
