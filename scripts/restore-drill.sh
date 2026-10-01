#!/usr/bin/env bash
# The restore rehearsal, end to end, on this machine:
#   1. back up the live database and media          (scripts/backup.sh)
#   2. restore them into a scratch database + folder (scripts/restore.sh)
#   3. boot a second API against the copy
#   4. prove it serves the site: health, the same row counts as live, an uploaded image
#   5. tear the scratch copy down
#
#   npm run build && MYSQL_PWD=<mysql admin password> scripts/restore-drill.sh
#
# The admin login (DB_ADMIN_USER, default root) is only used to create and
# drop the scratch database; it prompts when MYSQL_PWD is not set.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f dist/main.js ] || { echo "Build first: npm run build" >&2; exit 1; }
set -a; # shellcheck disable=SC1091
source .env; set +a

ADMIN_USER="${DB_ADMIN_USER:-root}"; HOST="${DB_HOST:-127.0.0.1}"; PORT_DB="${DB_PORT:-3306}"
DRILL_DB="${DB_NAME}_drill"; DRILL_MEDIA="./storage-drill"; DRILL_PORT="${DRILL_PORT:-4001}"
MIGRATE_USER="${DB_MIGRATE_USERNAME:-$DB_USERNAME}"; USER_HOST="${DB_USER_HOST:-localhost}"
if [ -z "${MYSQL_PWD:-}" ]; then read -r -s -p "MySQL password for $ADMIN_USER@$HOST: " MYSQL_PWD; echo; export MYSQL_PWD; fi

admin_sql() { mysql -u "$ADMIN_USER" -h "$HOST" -P "$PORT_DB" -e "$1"; }
app_sql()   { MYSQL_PWD="$DB_PASSWORD" mysql -u "$DB_USERNAME" -h "$HOST" -P "$PORT_DB" -N -e "$1"; }
fail=0; ok() { echo "PASS  $1"; }; bad() { echo "FAIL  $1"; fail=1; }
PID=""
cleanup() { if [ -n "$PID" ]; then kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; fi; }
trap cleanup EXIT

echo "== 1/5 backup"
scripts/backup.sh
DUMP=$(ls -t "${BACKUP_DIR:-./backups}/$DB_NAME"-*.sql.gz | head -1)
MEDIA=$(ls -t "${BACKUP_DIR:-./backups}"/media-*.tar.gz 2>/dev/null | head -1 || true)

echo "== 2/5 scratch database $DRILL_DB"
admin_sql "DROP DATABASE IF EXISTS \`$DRILL_DB\`;
CREATE DATABASE \`$DRILL_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`$DRILL_DB\`.* TO '$MIGRATE_USER'@'$USER_HOST';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`$DRILL_DB\`.* TO '$DB_USERNAME'@'$USER_HOST';
FLUSH PRIVILEGES;"

echo "== 3/5 restore into the scratch copy"
rm -rf "$DRILL_MEDIA"
# shellcheck disable=SC2086
RESTORE_YES=1 RESTORE_DB="$DRILL_DB" RESTORE_MEDIA_PATH="$DRILL_MEDIA" scripts/restore.sh "$DUMP" $MEDIA

echo "== 4/5 boot a second API against the copy on :$DRILL_PORT"
DB_NAME="$DRILL_DB" MEDIA_LOCAL_PATH="$DRILL_MEDIA" PORT="$DRILL_PORT" CDN_BASE_URL="http://localhost:$DRILL_PORT" \
  node dist/main.js > drill.log 2>&1 &
PID=$!
for _ in $(seq 1 40); do curl -sf "http://localhost:$DRILL_PORT/health" >/dev/null 2>&1 && break; sleep 0.5; done

echo "== 5/5 checks"
health=$(curl -s "http://localhost:$DRILL_PORT/health" || true)
[[ "$health" == *'"db":"ok"'* ]] && ok "health on the copy: $health" || bad "health on the copy: ${health:-no answer} (see drill.log)"
for t in project service testimonial brand faq enquiry media_asset admin_user site_setting; do
  a=$(app_sql "SELECT COUNT(*) FROM \`$DB_NAME\`.\`$t\`"); b=$(app_sql "SELECT COUNT(*) FROM \`$DRILL_DB\`.\`$t\`")
  [ "$a" = "$b" ] && ok "$t: $a rows in live and in the copy" || bad "$t: live $a rows, copy $b"
done
page=$(curl -s "http://localhost:$DRILL_PORT/projects" || true)
[[ "$page" == *'id="__DATA__"'* ]] && ok "/projects renders from the copy with content" || bad "/projects did not render from the copy"
key=$(app_sql "SELECT JSON_UNQUOTE(JSON_EXTRACT(derivatives, '\$[0].key')) FROM \`$DRILL_DB\`.media_asset WHERE storage_key NOT LIKE 'images/%' AND status = 'ready' ORDER BY id DESC LIMIT 1")
if [ -n "$key" ] && [ "$key" != "NULL" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$DRILL_PORT/$key")
  [ "$code" = "200" ] && ok "uploaded image served from the restored files: /$key" || bad "uploaded image /$key → HTTP $code"
else
  echo "NOTE  no uploaded media in this backup (the photography ships with the website build) — upload an image in the admin and re-run for the full drill"
fi

kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; PID=""
admin_sql "DROP DATABASE \`$DRILL_DB\`;"
rm -rf "$DRILL_MEDIA" drill.log
echo
if [ "$fail" = 0 ]; then echo "RESTORE DRILL PASSED — $DUMP restores to a working site."; else echo "RESTORE DRILL FAILED — see above."; exit 1; fi
