#!/usr/bin/env bash
# Restores the Postgres database from a backup file created by backup.sh.
# DESTRUCTIVE: drops and recreates every table's data in the target DB.
#
# Run this from the HOST machine, same as backup.sh.
#
# Usage:
#   npm run restore -- backups/erp_backup_20260715_120000.sql.gz

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: npm run restore -- <path-to-backup-file>.sql.gz"
  echo "Available backups:"
  ls -1 backups/*.sql.gz 2>/dev/null || echo "  (none found in ./backups)"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "File not found: ${BACKUP_FILE}"
  exit 1
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DB_USER="${DB_USER:-erp_user}"
DB_NAME="${DB_NAME:-erp_db}"

read -p "This will overwrite the current '${DB_NAME}' database. Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo "Restoring ${BACKUP_FILE} into '${DB_NAME}'..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}"
echo "Done."