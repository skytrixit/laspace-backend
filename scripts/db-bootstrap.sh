#!/usr/bin/env bash
# Creates the database and the two MySQL users from .env. Run once per
# environment, as a MySQL admin:
#
#   scripts/db-bootstrap.sh            # prompts for the root password
#   MYSQL_PWD=... scripts/db-bootstrap.sh
#
# Safe to re-run: every statement is IF NOT EXISTS.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "No .env — copy .env.example to .env and set the DB_* values first." >&2; exit 1; }
set -a; # shellcheck disable=SC1091
source .env; set +a

MYSQL="${MYSQL_BIN:-mysql}"
ARGS=(-u "${DB_ADMIN_USER:-root}" -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}")
[ -n "${MYSQL_PWD:-}" ] || ARGS+=(-p)

"$MYSQL" "${ARGS[@]}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;  -- the collation every migration writes on its tables

CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'${DB_USER_HOST:-localhost}'
  IDENTIFIED BY '${DB_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE
  ON \`${DB_NAME}\`.* TO '${DB_USERNAME}'@'${DB_USER_HOST:-localhost}';

CREATE USER IF NOT EXISTS '${DB_MIGRATE_USERNAME}'@'${DB_USER_HOST:-localhost}'
  IDENTIFIED BY '${DB_MIGRATE_PASSWORD}';
GRANT ALL PRIVILEGES
  ON \`${DB_NAME}\`.* TO '${DB_MIGRATE_USERNAME}'@'${DB_USER_HOST:-localhost}';

FLUSH PRIVILEGES;
SQL

echo "Database '${DB_NAME}' and users '${DB_USERNAME}', '${DB_MIGRATE_USERNAME}' are ready."
