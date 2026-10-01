#!/usr/bin/env bash
# Restores a database dump (and, optionally, a media archive) made by backup.sh.
#
#   scripts/restore.sh backups/laspace-<stamp>.sql.gz [backups/media-<stamp>.tar.gz]
#
# Targets the database and media path in .env, or RESTORE_DB / RESTORE_MEDIA_PATH
# when set. The target database must already exist and the migrate user must
# have rights on it (scripts/db-bootstrap.sh does both). Every table in the
# dump is dropped and recreated — this replaces what is there. RESTORE_YES=1
# skips the confirmation.
set -euo pipefail
cd "$(dirname "$0")/.."
DUMP="${1:?usage: scripts/restore.sh <dump.sql.gz> [media.tar.gz]}"
MEDIA="${2:-}"
[ -f "$DUMP" ] || { echo "No such dump: $DUMP" >&2; exit 1; }
[ -z "$MEDIA" ] || [ -f "$MEDIA" ] || { echo "No such media archive: $MEDIA" >&2; exit 1; }
set -a; # shellcheck disable=SC1091
source .env; set +a

DB="${RESTORE_DB:-$DB_NAME}"
MEDIA_PATH="${RESTORE_MEDIA_PATH:-${MEDIA_LOCAL_PATH:-./storage}}"
USER="${DB_MIGRATE_USERNAME:-$DB_USERNAME}"
PASS="${DB_MIGRATE_PASSWORD:-$DB_PASSWORD}"

if [ "${RESTORE_YES:-0}" != "1" ]; then
  read -r -p "Restore $DUMP into database '$DB'${MEDIA:+ and $MEDIA into $MEDIA_PATH}? This replaces their contents. [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

gunzip -c "$DUMP" | MYSQL_PWD="$PASS" mysql -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$USER" "$DB"
echo "database '$DB' restored from $DUMP"

if [ -n "$MEDIA" ]; then
  mkdir -p "$MEDIA_PATH"
  tar -xzf "$MEDIA" -C "$MEDIA_PATH"
  echo "media restored into $MEDIA_PATH"
fi
echo "Restart the API so its media worker and page cache start from the restored state."
