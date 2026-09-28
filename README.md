# LA Space Studio API

The backend for the LA Space Interiors website and studio admin: NestJS,
Prisma and MySQL 8. The architecture and phase plan live in the project's
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

The Nest project itself arrives in Phase 1.

## Environments

| | Database | Media | Notes |
| --- | --- | --- | --- |
| Local | Native MySQL 8 on this machine | `./storage` on disk | No accounts needed |
| Staging | Developer-provisioned | S3-compatible bucket + CDN | Pending a host |
| Production | Client hosting | S3-compatible bucket + CDN | Host and repository decisions parked to launch |
