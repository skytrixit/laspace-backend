# Restore procedure

What a backup holds: one gzip'd `mysqldump` of the whole database (enquiries,
content, admin users and sessions, media records) and, with the local media
driver, a tar of the uploaded files. Both are written by `scripts/backup.sh`
to `BACKUP_DIR` (default `./backups`) and named by UTC time:
`laspace-20260930T151200Z.sql.gz`, `media-20260930T151200Z.tar.gz`. The
website's own photography is in the repository (`web/site/public/images`),
not in the backup.

Enquiries are the sales pipeline. Losing the database loses them; nothing
else in this system is irreplaceable.

## Schedule

Nightly, on the host, as the deploy user:

```
15 2 * * *  cd /srv/laspace/la_space_backend && scripts/backup.sh >> backups/backup.log 2>&1
```

Then copy `backups/` off the host (rclone/rsync to the object-storage bucket
or the hosting plan's snapshot facility). `BACKUP_KEEP_DAYS` (default 30)
prunes the local copies. With the S3 media driver the files are already
off-host; turn on bucket versioning so a deleted or overwritten file can be
brought back.

## Full restore onto a fresh host

Time: about 20 minutes plus the copy of the media archive.

1. Install Node 20+ and MySQL 8; clone this repository (the website is
   inside it at `web/site`);
   create `.env` from `.env.example` with the production values.
2. `scripts/db-bootstrap.sh` — creates the empty database and the two users.
3. `scripts/restore.sh backups/laspace-<stamp>.sql.gz backups/media-<stamp>.tar.gz`
   — loads the schema and the rows, unpacks the files into `MEDIA_LOCAL_PATH`.
   The dump carries the migrations table, so `npm run migration:run:prod`
   afterwards applies only migrations newer than the backup.
4. Build and start as in the runbook (`npm run build` covers the website
   and the API).
5. Verify: `/health` is 200 with `"db":"ok"`; `/projects` lists the projects;
   log in to `/admin` and open the enquiry inbox; open one uploaded image.

## Restore onto the running host (bad deploy, data damage)

Stop the API first so the media worker does not write while tables are being
replaced, run step 3 above against the live database, start the API. To keep
the current state for forensics, restore into a scratch database instead
(`RESTORE_DB=laspace_forensic scripts/restore.sh …`; the scratch database
must exist and be granted, as `scripts/restore-drill.sh` does).

## Rehearsal

`npm run build && MYSQL_PWD=<mysql admin password> scripts/restore-drill.sh`
backs up the live system, restores it into a scratch database and folder,
boots a second API on port 4001 against the copy, checks health, that every
table has the same number of rows as live, that `/projects` renders, and
that an uploaded image is served from the restored files; then drops the
scratch copy. Run it after any change to the schema or the storage layout,
and at least once a quarter. A procedure nobody has run is not a procedure.
