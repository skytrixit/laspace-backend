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
npm run test:e2e          # boots the real app against the .env database
```

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
