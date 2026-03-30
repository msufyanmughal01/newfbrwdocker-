#!/bin/bash
# TaxDigital Database Backup Script
# Usage: ./scripts/backup.sh
# Requires: DATABASE_URL env var, pg_dump, AWS CLI (optional for S3)

set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/taxdigital/backups"
BACKUP_FILE="${BACKUP_DIR}/taxdigital_${TIMESTAMP}.sql.gz"

# Load env if .env.production exists
if [ -f ".env.production" ]; then
  export $(grep -v '^#' .env.production | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
echo "[$(date)] Backup saved: $BACKUP_FILE"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --
echo "[$(date)] Old backups pruned (keeping 30 most recent)"

# Optional: Upload to S3
if command -v aws &>/dev/null && [ -n "${S3_BACKUP_BUCKET:-}" ]; then
  aws s3 cp "$BACKUP_FILE" "s3://${S3_BACKUP_BUCKET}/backups/$(basename "$BACKUP_FILE")"
  echo "[$(date)] Backup uploaded to S3: s3://${S3_BACKUP_BUCKET}/backups/"
fi

echo "[$(date)] Backup complete."
