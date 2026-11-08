# LA Space Studio API

The backend for the LA Space Interiors website and studio admin: NestJS,
TypeORM and MySQL 8. The architecture and phase plan live in the project's
implementation document; this file covers only getting a machine ready.

## Phase 0 — local environment

Requirements: Node 20+, MySQL 8 running locally. Object storage is not
needed for development — media uses the local-disk driver.

```bash
cp .env.example .env         # then set the two DB_* passwords
scripts/db-bootstrap.sh      # creates the database and both users; asks for the MySQL root password
```

Two database users exist on purpose. The application connects as
`laspace_app`, which can only read and write rows. Schema changes run as
`laspace_migrate` during deploy, so a compromised app process can never
alter the schema.

## Running it

```bash
npm install
npm run migration:run     # applies src/database/migrations as the migrate user
npm run start:dev         # http://localhost:4000/health
npm test                  # unit tests, no database needed
npm run test:e2e          # boots the real app against the .env database (needs a site build, below)
```

## Public site

The API is also the web server. The website lives in this repository at
`web/site` (a git subtree of the website repository). `npm run build` builds
it (`build:site`), builds the API, and copies the site build into
`dist/site`, so `dist/` alone carries everything the process serves. The
API serves that build from `SITE_DIST` (default `dist/site`): the hashed
assets and images as static files, and the six pages through `src/pages`,
which
injects the published rows as a `<script id="__DATA__">` block and builds
the JSON-LD graphs and `/sitemap.xml` from the same rows. Anything an
admin saves clears the rendered-page cache, so it is on the site at the
next request.

```bash
npm run build             # web/site/dist → dist/site: pages, assets, site-data.json, image ladder
npm start                 # http://localhost:4000/ is the website
```

`npm run start:dev` empties `dist/` as its compiler starts, taking the copy
with it. For the watcher, set `SITE_DIST=./web/site/dist` in `.env` and
build the site with `npm run build:site`.

Routes: `/`, `/about`, `/services`, `/projects`, `/projects/:slug`,
`/contact`, `/sitemap.xml`; `/<page>.html` redirects to the clean URL.
`SITE_URL` is the canonical origin written into the structured data and
the sitemap. Without a build the pages answer 503 and the API still runs.

Tracking: set `GA4_MEASUREMENT_ID` and the pages carry the gtag snippet
(gtag.js is fetched after the window load event, so it never competes
with the images); set `GOOGLE_SITE_VERIFICATION` and they carry the
Search Console meta tag. Unset, neither is rendered. The website fires a
`generate_lead` event on every accepted enquiry.

The site's own dev server (`vite dev`, port 5173) has no `__DATA__`
block and falls back to the static copy in `src/data/site.js` — use it
for design work; use the API for anything content-related.

The admin panel is a separate repository, deployed on its own subdomain
(`ADMIN_ORIGIN`). When a build of it exists at `ADMIN_DIST` (default
`../la_space_admin/dist`, a local convenience) it is also served at
`/admin` on this origin, hashed assets immutable, with the SPA fallback so
a deep link such as `/admin/projects/1` works on a fresh load; without
one, `/admin` is not mounted. Every response carries a
Content-Security-Policy that allows
scripts only from this origin (plus Google's tag when GA4 is configured;
the two inline blocks the server writes are allowed by hash) — see
`src/security/csp.ts`.

## Operations

- `docs/RUNBOOK.md` — one page: what runs where, first deploy, each
  release, routine commands, what to do when something is wrong.
- `docs/RESTORE.md` — backups (`npm run backup`), the restore procedure
  (`npm run restore`), and the rehearsal (`npm run restore:drill`).
- `docs/LOCAL-CHECKS.md` — how to exercise all of this on one machine.
- `.github/workflows/ci.yml` — typecheck, unit, e2e against MySQL, the
  schema drift check and the Lighthouse budget; written before a remote
  exists, so not yet exercised.

## Schema changes

Edit the entity, then generate a migration by diffing against the live
database — no shadow database, no `synchronize`:

```bash
npm run migration:generate -- AddProjectVideo   # writes src/database/migrations/<ts>-AddProjectVideo.ts
npm run migration:run
```

Review the generated file before running it. `synchronize` is off
everywhere and stays off: what runs in production is exactly what was
reviewed. In production, run migrations from the compiled output:
`npm run migration:run:prod`.

Entities live beside the module that owns them (`src/enquiries/enquiry.entity.ts`,
`src/projects/project.entity.ts`, …) and are listed once in
`src/database/entities.ts`.

## Environments

| | Database | Media | Notes |
| --- | --- | --- | --- |
| Local | Native MySQL 8 on this machine | `./storage` on disk | No accounts needed |
| Staging | Developer-provisioned | S3-compatible bucket + CDN | Pending a host |
| Production | Client hosting | S3-compatible bucket + CDN | Host and repository decisions parked to launch |
