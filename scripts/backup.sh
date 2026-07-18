#!/usr/bin/env bash
# Dumps the Postgres database to a timestamped, gzipped file under ./backups.
#
# Run this from the HOST machine (where `docker` is available), not from
# inside the app container — the app container's Node image has no
# pg_dump binary, but the postgres container (postgres:16-alpine) does.
#
# Usage:
#   npm run backup
#   (or directly:) bash scripts/backup.sh

set -euo pipefail

# Load DB_* vars from .env if present, so this matches whatever
# docker-compose.yml is actually using.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DB_USER="${DB_USER:-erp_user}"
DB_NAME="${DB_NAME:-erp_db}"

mkdir -p backups
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_FILE="backups/erp_backup_${TIMESTAMP}.sql.gz"

echo "Backing up database '${DB_NAME}' to ${OUTPUT_FILE}..."

docker compose exec -T postgres pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${OUTPUT_FILE}"

echo "Done: ${OUTPUT_FILE} ($(du -h "${OUTPUT_FILE}" | cut -f1))"