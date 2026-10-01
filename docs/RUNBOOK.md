# Runbook — LA Space Interiors

One Node process serves everything: the public website (pages rendered from
the database), the admin panel at `/admin`, the JSON API at `/api`, and with
the local media driver the uploaded images at `/media`. MySQL 8 holds the
data. No queue, no cache server, no other service.

| | Where |
| --- | --- |
| Code | `la_space_backend` (API + serving), `la_space_website` (site build), `la_space_admin` (panel build) — three repositories side by side |
| Configuration | `la_space_backend/.env` (see `.env.example`); never committed |
| Database | MySQL 8, database `laspace`; `laspace_app` reads and writes rows, `laspace_migrate` changes the schema |
| Uploads | `MEDIA_LOCAL_PATH` (default `./storage`) or an S3-compatible bucket behind a CDN |
| Logs | JSON lines on stdout, one per request with `x-request-id`; `/health` is not logged |
| Backups | `scripts/backup.sh` nightly; restore and rehearsal in `docs/RESTORE.md` |

## First deploy

```bash
# once: database and users (asks for the MySQL admin password)
cd la_space_backend && cp .env.example .env    # fill in the values
scripts/db-bootstrap.sh

# builds
(cd ../la_space_website && npm ci && npm run images && npm run build)   # dist/, incl. the image ladder
(cd ../la_space_admin   && npm ci && npm run build)                      # dist/
npm ci && npm run build

# schema, first content, first admin
npm run migration:run:prod
npm run seed:prod                    # first time only: the website's copy into the database
npm run admin:prod -- create         # the studio's login

# run
NODE_ENV=production node dist/main.js   # under systemd or pm2; port PORT (4000)
```

Put nginx or Caddy in front for HTTPS and set `TRUST_PROXY=true` so rate
limits see the real client address. The process serves `/`, `/admin` and
`/api` on one origin; nothing else needs routing.

## Each release

```bash
git pull              # in each of the three repositories
(cd ../la_space_website && npm ci && npm run images && npm run build)
(cd ../la_space_admin   && npm ci && npm run build)
npm ci && npm run build && npm run migration:run:prod
# restart the process; it re-reads the site build and requeues unfinished media jobs
```

Rollback: keep the previous `dist/` directories, restart on them, and
`npm run migration:revert` once per migration the release added.

## Routine operations

| Task | Command |
| --- | --- |
| Reset the studio's password | `npm run admin:prod -- reset-password` |
| Add an admin | `npm run admin:prod -- create` |
| Backup now | `scripts/backup.sh` |
| Restore | `docs/RESTORE.md` |
| Check the database matches the seed | `npm run seed:prod -- --verify` |
| Turn analytics on | set `GA4_MEASUREMENT_ID` (and `GOOGLE_SITE_VERIFICATION`), restart |
| Enquiry alerts | set `SMTP_*` and `ALERT_TO`, restart; a failed send never fails the enquiry |

## When something is wrong

| Symptom | Meaning | Do |
| --- | --- | --- |
| `/health` 503, `"db":"down"` | MySQL unreachable or credentials wrong | check MySQL, then `.env` `DB_*` |
| Pages answer 503 "Back in a moment" | no website build at `SITE_DIST` | build the website, restart |
| Upload stuck in "processing" | worker died mid-job | restart; unfinished jobs are re-queued at boot |
| Images 404 | `CDN_BASE_URL` points elsewhere, or files missing | check the env, then the storage path / bucket |
| Login 429 | 5 failed logins in 15 minutes from one address | wait, or reset the password |
| Enquiry form falls back to email | `/api/enquiries` failed (5xx or 429: 5 per hour per address) | check logs by `x-request-id` |

Limits: 120 API requests per minute per address; 5 logins per 15 minutes;
5 enquiries per hour; uploads up to `MEDIA_MAX_UPLOAD_MB` (40 MB).

## Still to do at the host

HTTPS and HSTS at the proxy; the uptime monitor on `/` and `/health`; error
tracking; off-host log shipping; nightly backups copied off the host; the
object-storage bucket and CDN; the repository remote. Each is a configuration
step on the chosen host, not code.
