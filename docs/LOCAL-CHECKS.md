# Checking the production setup on one machine

Everything the host will run can be exercised locally: MySQL 8 and Node 20+
on this machine and a checkout of `la_space_backend`, which carries the
website at `web/site`. Commands run from the repository root unless a path
says otherwise. Each step says what "good" looks like.

## 1. Least-privilege database users

`.env` names two users: `DB_USERNAME=laspace_app` (reads and writes rows)
and `DB_MIGRATE_USERNAME=laspace_migrate` (changes the schema). Create them:

```bash
MYSQL_PWD=<your MySQL root password> scripts/db-bootstrap.sh
```

Good: `Database 'laspace' and users 'laspace_app', 'laspace_migrate' are ready.`
Then prove the app user cannot touch the schema, and the migrate user can
see the migrations:

```bash
mysql -u laspace_app -p laspace -e "ALTER TABLE faq ADD COLUMN probe INT"   # → ERROR 1142 ... ALTER command denied
npm run migration:show                                                       # → [X] Init, [X] AddProjectTypeLabel
```

## 2. Build everything

```bash
npm run build        # web/site/dist with the image ladder, dist/main.js, then the site copied into dist/site
```

The admin panel is deployed separately. To check `/admin` here as well, build
the admin repository next to this one (`ADMIN_DIST`, default `../la_space_admin/dist`).

## 3. Run the way production runs

```bash
NODE_ENV=production node dist/main.js
```

Then, in a browser:

| Open | Good |
| --- | --- |
| http://localhost:4000/ | the website, content from the database |
| http://localhost:4000/admin/projects/1 | the admin panel asks you to sign in, then opens the editor for project 1 (deep link on a fresh load) |
| http://localhost:4000/api/admin/projects | `{"statusCode":401,...}` — the API is guarded |
| http://localhost:4000/health | `{"status":"ok","db":"ok",...}` |
| http://localhost:4000/projects/no-such-slug | the styled "Not found" page |

And the security headers:

```bash
curl -sI http://localhost:4000/ | grep -iE "content-security-policy|strict-transport|x-content-type|x-powered-by"
```

Good: a `content-security-policy` with `default-src 'self'` and
`frame-ancestors 'none'`, `strict-transport-security`, `x-content-type-options: nosniff`,
and no `x-powered-by` line. Logs are JSON lines in production mode.

To see the analytics tags appear without a rebuild:

```bash
GA4_MEASUREMENT_ID=G-TEST1234 GOOGLE_SITE_VERIFICATION=abc NODE_ENV=production node dist/main.js
curl -s http://localhost:4000/ | grep -o "google-site-verification\|gtag/js?id=G-TEST1234"
```

## 4. Tests

```bash
npm test             # unit, no database
npm run test:e2e     # boots the real app against the .env database as laspace_app; needs the website build
```

Good: all suites pass. The e2e suites cover auth, enquiries, content,
media, pages, security headers and the admin panel.

## 5. Backup

```bash
npm run backup
ls -la backups/                                   # laspace-<stamp>.sql.gz and media-<stamp>.tar.gz
gunzip -c backups/laspace-*.sql.gz | head -20     # a readable mysqldump
```

## 6. Restore rehearsal

Upload one image in the admin first (so the backup holds an uploaded file),
then, with the API still running:

```bash
npm run build
MYSQL_PWD=<your MySQL root password> npm run restore:drill
```

Good: every line `PASS`, ending in `RESTORE DRILL PASSED`. The drill backs
up, restores into `laspace_drill` and `./storage-drill`, boots a second API
on port 4001 against the copy, checks health, that every table has the same
number of rows as live, that `/projects` renders and that the uploaded image
is served from the restored files — then drops the copy.

## 7. Performance budget

With the API running (step 3):

```bash
npm run -w web/site budget
```

Good: `PASS  /projects  performance 9x (budget 90) ...` and `PASS  /  performance 8x (budget 80) ...`.
This is the same check the CI workflow runs.

## 8. Secrets audit

```bash
git ls-files | grep -E '^\.env'                 # only .env.example
git log --all -p | grep -inE "password|secret" | head   # only test fixtures ('correct horse battery', 'secret')
```

Repeat in the admin repository.

## What this cannot cover on a laptop

HTTPS and HSTS enforcement (the proxy on the host), the uptime monitor,
error tracking, backups copied off the host, the repository remote, the CI
run itself, and the 24-hour soak under load on the production host. Each is
a configuration step once the host exists — see `docs/RUNBOOK.md`.
