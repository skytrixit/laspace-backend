#!/usr/bin/env bash
# Backs up the database and, with the local media driver, the uploaded files.
#
#   scripts/backup.sh          → backups/<db>-<UTC stamp>.sql.gz and backups/media-<stamp>.tar.gz
#
# Reads .env (DB_*, MEDIA_*, BACKUP_DIR, BACKUP_KEEP_DAYS). Dumps as the
# migrate user. Files older than BACKUP_KEEP_DAYS (default 30) are removed.
# Copy the backup directory off this machine — a backup on the host it
# protects is not a backup (docs/RESTORE.md).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "No .env" >&2; exit 1; }
set -a; # shellcheck disable=SC1091
source .env; set +a

DIR="${BACKUP_DIR:-./backups}"
KEEP="${BACKUP_KEEP_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
USER="${DB_MIGRATE_USERNAME:-$DB_USERNAME}"
PASS="${DB_MIGRATE_PASSWORD:-$DB_PASSWORD}"
mkdir -p "$DIR"

DUMP="$DIR/$DB_NAME-$STAMP.sql.gz"
MYSQL_PWD="$PASS" mysqldump -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$USER" \
  --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF "$DB_NAME" | gzip -9 > "$DUMP"
echo "database → $DUMP ($(du -h "$DUMP" | cut -f1))"

if [ "${MEDIA_DRIVER:-local}" = "local" ] && [ -d "${MEDIA_LOCAL_PATH:-./storage}" ]; then
  MEDIA="$DIR/media-$STAMP.tar.gz"
  tar -czf "$MEDIA" -C "${MEDIA_LOCAL_PATH:-./storage}" .
  echo "media    → $MEDIA ($(du -h "$MEDIA" | cut -f1))"
else
  echo "media    → in the object-storage bucket (driver ${MEDIA_DRIVER:-local}); rely on the bucket's versioning and retention"
fi

find "$DIR" -name '*.gz' -mtime +"$KEEP" -print -delete | sed 's/^/removed (older than '"$KEEP"' days): /' || true
