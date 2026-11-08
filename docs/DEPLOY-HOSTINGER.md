# Deploying to a Hostinger VPS — laspaceinteriors.in

> **Current target: Hostinger shared hosting, Node.js Web App.** The host
> builds the app from the GitHub repository (`npm install`, `npm run build`,
> `npm start`); environment variables are set in hPanel rather than in a
> `.env` file; `PORT` is injected by the host; and the process is restarted
> from the hPanel dashboard after each deploy or env change. The VPS steps
> below are kept for reference only.

One Node process serves the public site, the admin panel at `/admin`, the
JSON API at `/api` and the uploaded media at `/media`. MySQL 8 holds the
data. nginx terminates HTTPS in front. Nothing else runs.

This is the VPS-specific version of [RUNBOOK.md](RUNBOOK.md) — that file
stays the reference for day-to-day operations once the server is up.

> **Not a static host.** The site cannot be deployed as static files: project
> pages, the sitemap, the admin content and the enquiry API are all produced
> by this process at request time. It needs a host that runs a Node process:
> Hostinger's Node.js Web App (the note above) or a KVM VPS (this document).

## 0. What you need first

| | |
| --- | --- |
| VPS | Hostinger KVM, Ubuntu 24.04. 2 vCPU / 4 GB is comfortable — the image pipeline (sharp) is the memory-hungry part |
| DNS | `laspaceinteriors.in` A record → the VPS IP, plus `www` |
| Repositories | `laspace-backend`, pushed with the latest commits — it carries the website at `web/site`. `laspace-adminUI` is deployed separately on its own subdomain |
| Mail | SMTP credentials for enquiry alerts (optional; the form still works without them) |

Open ports 80 and 443 in the hPanel firewall. Leave 3306 closed — MySQL is
reached over localhost only.

## 1. Server preparation

```bash
ssh root@<vps-ip>

apt update && apt upgrade -y
apt install -y git nginx mysql-server ufw

# Node 20 LTS (the project requires >= 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
mysql_secure_installation
```

Create an unprivileged user to own and run the app:

```bash
adduser --system --group --home /srv/laspace laspace
mkdir -p /srv/laspace && chown laspace:laspace /srv/laspace
```

## 2. Clone the repository

The website is inside it at `web/site`; the admin panel is deployed
separately on its own subdomain.

```bash
sudo -u laspace -H bash
cd /srv/laspace
git clone https://github.com/skytrixit/laspace-backend.git  la_space_backend
```

## 3. Configure `.env`

The database passwords go in here **first** — `db-bootstrap.sh` reads them
from this file and creates the MySQL users with whatever it finds, so this
step comes before the database one.

```bash
cd /srv/laspace/la_space_backend
cp .env.example .env
```

Edit it. The values that differ from the development defaults:

```ini
NODE_ENV=production
PORT=4000

# The site and the API share one host; the admin panel is on its own subdomain.
PUBLIC_ORIGIN=https://www.laspaceinteriors.in
ADMIN_ORIGIN=https://admin.laspaceinteriors.in

# Two passwords you choose now; db-bootstrap.sh creates the users with them.
DB_PASSWORD=<a long random password>
DB_MIGRATE_PASSWORD=<a different long random password>

# nginx is in front, so rate limits must read X-Forwarded-For.
TRUST_PROXY=true

# SITE_DIST keeps its default, ./web/site/dist: relative paths resolve from
# the project root. Leave ADMIN_DIST alone — no admin build here, so /admin
# is not mounted.
SITE_URL=https://www.laspaceinteriors.in

MEDIA_DRIVER=local
MEDIA_LOCAL_PATH=/srv/laspace/storage
# Blank: this process serves its own media, so image URLs stay same-origin.
CDN_BASE_URL=

BACKUP_DIR=/srv/laspace/backups

# Enquiry alerts. ALERT_TO is the inbox that receives them.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
ALERT_FROM="LA Space Website <no-reply@laspaceinteriors.in>"
ALERT_TO=
```

`chmod 600 .env` — it holds the database and mail passwords.

> Mail on `.in` needs MX, SPF and DKIM records on the domain before alerts
> send reliably. Until those exist, leave `SMTP_*` blank: enquiries are still
> stored and visible in the admin panel, only the email notification is off.

## 4. Create the database

```bash
cd /srv/laspace/la_space_backend
scripts/db-bootstrap.sh      # prompts for the MySQL root password
```

Creates the `laspace` database and two users: `laspace_app`, which reads and
writes rows, and `laspace_migrate`, which may alter tables. The API only ever
connects as the first. The script is safe to re-run — every statement is
`IF NOT EXISTS`.

## 5. Build

One command. `build:site` generates the responsive image ladder (the slow
step) and the website's `web/site/dist`; then `nest build` emits `dist/`.

```bash
cd /srv/laspace/la_space_backend
npm ci && npm run build
```

## 6. Schema, content and the first login

```bash
cd /srv/laspace/la_space_backend
npm run migration:run:prod
npm run seed:prod                 # first time only — loads the site's copy into the database
npm run admin:prod -- create      # the studio's login
```

## 7. Run it under systemd

`/etc/systemd/system/laspace.service`:

```ini
[Unit]
Description=LA Space Interiors
After=network.target mysql.service

[Service]
Type=simple
User=laspace
Group=laspace
WorkingDirectory=/srv/laspace/la_space_backend
EnvironmentFile=/srv/laspace/la_space_backend/.env
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now laspace
curl -s localhost:4000/health        # {"status":"ok","db":"ok", ...}
```

## 8. nginx and HTTPS

`/etc/nginx/sites-available/laspace`:

```nginx
server {
    listen 80;
    server_name laspaceinteriors.in www.laspaceinteriors.in;

    # Uploads are capped at MEDIA_MAX_UPLOAD_MB (40).
    client_max_body_size 45M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/laspace /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

apt install -y certbot python3-certbot-nginx
certbot --nginx -d laspaceinteriors.in -d www.laspaceinteriors.in
```

Certbot rewrites the file for TLS and installs a renewal timer.

## 9. Verify

```bash
curl -s https://www.laspaceinteriors.in/health
curl -s https://www.laspaceinteriors.in/about | grep -o 'rel="canonical" href="[^"]*"'
curl -s https://www.laspaceinteriors.in/sitemap.xml | head -5
```

Then in a browser: a project card opens its detail page, and a test enquiry
appears in the admin panel on its own subdomain.

## 10. Nightly backups

```bash
sudo -u laspace crontab -e
```

```cron
15 2 * * * cd /srv/laspace/la_space_backend && scripts/backup.sh >> /srv/laspace/backups/cron.log 2>&1
```

Keeps `BACKUP_KEEP_DAYS` (30) of dumps. Rehearse a restore with
`npm run restore:drill` — see [RESTORE.md](RESTORE.md).

## Each release

```bash
sudo -u laspace -H bash
cd /srv/laspace/la_space_backend
git pull
npm ci && npm run build && npm run migration:run:prod
exit
systemctl restart laspace
```

The process reads the website build into memory at boot, so **a rebuild
without a restart changes nothing** — that restart is not optional.

Rollback: keep the previous `dist/` directories, restart on them, and
`npm run migration:revert` once per migration the release added.
