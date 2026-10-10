# Peykbox 📬

**Peykbox** is an open-source, self-hosted mail workspace powered by Django REST Framework, Next.js, and Docker.

> **Status: milestone 1 (foundation + web installer)**. This repository currently boots the stack and creates an initial owner account through a web interface. SMTP/IMAP connections, authentication UI, and mailboxes are planned and **not implemented yet**. Do not deploy it as a production email solution.

## Quick start

Requirements: Docker Engine + Docker Compose v2.

```bash
git clone <YOUR-FUTURE-REPOSITORY-URL>
cd peykbox
docker compose up -d --build
```

Open **http://localhost:3000**. You will be redirected to `/setup` on a new installation.

To retrieve the **one-time installer key**, run:

```bash
docker compose exec backend cat /run/peykbox/setup_token
```

Paste this key into the web form. From the browser, create the owner account and choose an instance name and optional mail domain.

The initial `PostgreSQL` password, Django secret, installer key, and reserved encryption key are generated automatically in a private Docker volume. No `.env` editing is required for this local milestone. The wizard is permanently disabled after completing installation.

**Remote server:** port 3000 is deliberately bound to `127.0.0.1` by default to avoid exposing an unfinished setup application publicly. Use an SSH tunnel for remote installation (`ssh -L 3000:127.0.0.1:3000 user@server`) and then open http://localhost:3000 locally. HTTPS reverse proxy, production domain support, and deployment hardening are planned before general hosting.

## Architecture

- `frontend/`: Next.js 16 (App Router), TypeScript, Tailwind CSS 4.
- `backend/`: API-only Django 5.2 LTS + Django REST Framework; **no Django Admin or templates**.
- `scripts/bootstrap.py`: idempotent, automatic generation of install-time secrets.
- `compose.yaml`: `bootstrap`, `db`, `backend`, and `frontend` services.
- Next.js rewrites `/api/*` internally to Django, so the Django service is not exposed to the host.

## Development and operations

```bash
# Follow container logs
docker compose logs -f

# Show service health
docker compose ps

# Run Django checks
docker compose exec backend python manage.py check

# Run setup tests in a temporary test database
docker compose exec backend python manage.py test core

# Stop services, keeping persistent database and secrets
docker compose down
```

**Do not run `docker compose down -v` on a deployment you want to preserve.** That destroys database and secret volumes and prevents recovering existing encrypted data after future milestones.

## Security model (initial milestone)

- First-run ownership requires a random installer token generated on the server, not sent to browsers automatically.
- Instance creation is locked in a PostgreSQL transaction to prevent simultaneous installations.
- Owner passwords are hashed by Django and validated against its password policies.
- Backend API and PostgreSQL have no exposed host ports; the Next.js frontend is localhost-only.
- No hard-coded database credentials or Django secret key are committed.
- The installation endpoint closes after creating the first owner.

**Not production ready:** HTTPS, reverse proxy, MFA, login/session management, durable rate limiting, audit logs, mail credentials encryption, send/receive integration, DNS checks, backup/restore and vulnerability scanning are not completed in this milestone. Do not expose to the public Internet yet.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).

## Contributions

See [CONTRIBUTING.md](CONTRIBUTING.md).
