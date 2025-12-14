#!/bin/bash
set -e

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="/tmp/${PG_DB}_${DATE}.sql.gz"

export PGPASSWORD="$PG_PASSWORD"

pg_dump \
-h "$PG_HOST" \
-p "$PG_PORT" \
-U "$PG_USER" \
"$PG_DB" | gzip > "$BACKUP_FILE"

echo "Uploading backup to GCS..."
gsutil cp "$BACKUP_FILE" "gs://${GCS_BUCKET}/"

echo "Backup completed successfully"