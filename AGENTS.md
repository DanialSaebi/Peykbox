# AGENTS.md — Peykbox

> Instructions for AI coding agents (including Codex) working in this repository.
> These instructions apply to the entire repository unless a nested `AGENTS.md` explicitly narrows them.

## 1. Mission and product boundary

**Peykbox** is an MIT-licensed, open-source, self-hosted email workspace. Users deploy it with Docker Compose, finish initial configuration through a Next.js web installer, connect **existing SMTP/IMAP providers**, and manage email from the browser.

The initial product is **an email client and management platform, not a mail server**. Do not build an SMTP MTA, inbound MX receiver, or IMAP server from scratch. No system can guarantee inbox placement or eliminate spam classification; implement authenticated sending, DNS diagnostics, and abuse prevention instead.

Build real working functionality. Never represent mock messages, stub adapters, screenshots, or unimplemented routes as completed features. Prefer a smaller, secure, tested increment to a sprawling but non-functional scaffold.

## 2. Non-negotiable technology decisions

| Layer | Required approach |
| --- | --- |
| Backend | Python 3.12+, **Django 5.2 LTS + Django REST Framework**, Django ORM and migrations |
| Backend presentation | **JSON REST API only**; **no Django Admin, Django templates, or Django-rendered pages** |
| Frontend | **Next.js App Router, React, TypeScript strict mode**, Tailwind CSS |
| Database | PostgreSQL |
| Background work | Celery + Redis for sending and synchronization when introduced |
| Deployment | Docker + Docker Compose; one-command local startup |
| Mail | Authenticated outbound SMTP; existing inbound IMAP servers |
| Authentication | Django server-side sessions, secure HTTP-only cookies, CSRF protection |
| Licensing | MIT |

Use shadcn/ui, Lucide, Zod, React Hook Form and TanStack Query when they materially help. Do not add dependencies without a clear need. Preserve compatible versions already in the repository; do not change frameworks or language stacks.

## 3. Existing repository: inspect before modifying

The initial starter uses the following structure:

```text
peykbox/
├── backend/
│   ├── config/              # Django settings and URLs
│   ├── core/                # Initial installation / instance logic
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                 # Next.js App Router, including /setup
│   ├── package.json
│   └── Dockerfile
├── scripts/bootstrap.py    # Persistent first-boot secrets
├── docs/ROADMAP.md
├── .github/workflows/ci.yml
└── compose.yaml
```

Before implementing a request:

1. Read `README.md`, `compose.yaml`, relevant source files, tests, and current migrations.
2. Inspect actual behavior; do not assume a feature exists merely because it appears in the roadmap.
3. Identify the smallest safe change and any security or migration implications.
4. Retain existing working logic; refactor only when necessary and with tests.
5. Update documentation to reflect **what is implemented**, not what is planned.

Current starter scope: Docker-based foundation, bootstrap secrets, and an initial web setup wizard. Login UI, SMTP/IMAP, Redis/Celery, and production hardening are **not yet implemented**. Extend the repository incrementally rather than claiming these features already work.

## 4. Product behavior and installation contract

The primary local setup must remain:

```bash
docker compose up -d --build
# then visit http://localhost:3000
```

No `.env` editing, Django CLI administrator creation, manual database initialization, or source modification should be required for **normal first-time local installation**.

- First start: redirect to `/setup` if the instance is not installed.
- Setup: display backend/dependency status, verify a one-time server-issued installation token, create the first owner, configure instance identity, optionally configure SMTP/IMAP, and show DNS guidance.
- After setup: disable first-owner creation and redirect visitors to login.
- Owner retrieves the token on the host with `docker compose exec backend cat /run/peykbox/setup_token`. Never return it through a public endpoint.
- Sensitive infrastructure secrets are generated server-side at first boot, stored in persistent Docker volumes, and never leaked to browser JavaScript.
- Configure mail accounts and application settings through authenticated web forms; optional setup steps must be editable later.
- Local port 3000 should stay bound to `127.0.0.1` by default until HTTPS/reverse-proxy deployment is explicitly configured.
- A production domain, TLS certificates, networking, and external DNS ownership may still require infrastructure operations; **do not promise that a web UI can grant external permissions**.

Setup must be **idempotent and race-safe**: use database transactions and constraints so concurrent requests cannot create multiple first owners. Protect token validation with rate limiting, generic errors, and server-side checks. Never weaken the setup guard for convenience.

## 5. Backend design

- Keep HTTP views/viewsets thin. Put mail sending, fetching, parsing, DNS checks, and encryption in focused service modules.
- Use DRF serializers for validation, consistent error responses, pagination, and permissions.
- Version application routes under `/api/v1/`; keep `/api/health/` and `/api/ready/` for probes.
- Add Django apps only when separation improves maintainability (e.g. `accounts`, `installation`, `mail_accounts`, `emails`, `system_settings`). The existing `core` app need not be renamed without benefit.
- Model account ownership and enforce **object-level authorization** on every detail/action endpoint. Frontend route checks are not authorization.
- All schema changes require committed Django migrations, indexes/constraints where relevant, and tests. Do not modify the database directly as a substitute for migrations.
- Keep database transactions focused; never hold a transaction open across a slow SMTP/IMAP network call.
- Return sanitized errors to clients; never return stack traces, password fields, raw connection exceptions, or secret-file contents.
- Use timezone-aware timestamps and explicit state machines for queued/failed/sent mail.

## 6. Frontend design

- Use Next.js **App Router** and TypeScript strict mode; make forms accessible and responsive.
- Prefer Server Components when suitable, Client Components for real interactivity.
- Use a consistent UI system (Tailwind; shadcn/ui where useful), clear loading/empty/error states, and no fake success notifications.
- Build user-facing screens for `/setup`, `/login`, inbox, sent, drafts, trash, message view, compose, account settings, security, and deliverability **as their backend capabilities become real**.
- Use typed API utilities and schema validation; handle API errors and failed synchronization visibly.
- Default to same-origin API routing (e.g. Next.js rewrite to the internal Django service). Do not expose internal service URLs or secrets as `NEXT_PUBLIC_*` variables.
- Support keyboard navigation; structure styling and strings for later Persian/English localization and RTL layouts.
- Untrusted email HTML must be sanitized and rendered in a restrictive isolated context; never inject raw HTML into the app DOM. Block remote resources by default.

## 7. Authentication, sessions and permissions

- Use Django-authenticated **server-side sessions**, HTTP-only cookies, CSRF validation, appropriate cookie attributes, and correct proxy/TLS configuration.
- Never store reusable auth credentials or session tokens in `localStorage`.
- Explicit roles: `owner` and `user` initially. System/global settings belong to owners; users can access only mail accounts they own or have been granted.
- Provide login, logout, current-user, password-change and session expiry behavior; rate-limit authentication and setup endpoints.
- Verify CSRF protection works with the deployed same-origin frontend path and reverse proxy; do not globally exempt API endpoints.
- Never hardcode credentials, disable certificate validation, or weaken permission checks to pass tests.

## 8. Secrets, networking and Docker

- Preserve the current idempotent secret bootstrap in `scripts/bootstrap.py`. Restarts must **not rotate** database, Django, or encryption keys.
- Keep secrets out of git, build logs, public API responses, client bundles, and container environment where a safer Docker secret-file pattern already exists.
- Mount only the secrets required by each service; never mount application secrets into Next.js.
- PostgreSQL, Redis, and Django should stay on the internal Compose network without publicly bound host ports by default.
- Use persistent named volumes for DB data, encryption material, and stored attachments; document backup and recovery before shipping storage changes.
- Prefer reproducible builds, pinned compatible major versions, sensible health checks, bounded retries, non-root execution where feasible, and safe startup sequencing.
- `docker compose down` must preserve persistent data. **Never recommend `docker compose down -v` as routine troubleshooting.**
- Do not claim a localhost HTTP deployment is Internet-ready. Public deployment requires HTTPS, trusted-proxy configuration, host/origin validation, secure cookies, operational backups, and monitoring.

## 9. Mail implementation rules

### Outbound SMTP

- Send via accounts explicitly configured and authorized by users; Peykbox is **not** an anonymous relay or bulk-mail sender.
- Support TLS (implicit TLS/STARTTLS) with certificate verification, authentication, connection timeouts and safe errors. Never silently downgrade transport security.
- Construct standards-compliant MIME email with UTF-8, `To`/`Cc`/`Bcc`, attachments, proper headers and `Message-ID`.
- Never leak `Bcc` recipients in message headers delivered to other recipients.
- Use background tasks with bounded retries, idempotency/duplicate prevention, account-level rate limits and states such as `draft`, `queued`, `sending`, `smtp_accepted`, `failed`.
- **SMTP acceptance is not proof of delivery, inbox placement, or read receipt.** Never label it “delivered” merely on a successful SMTP response.

### Inbound IMAP

- Use IMAP against user-configured external servers; sync incrementally using account/folder/`UIDVALIDITY`/UID, not `Message-ID` alone.
- Detect mailbox folder mappings instead of hardcoding every provider to the same names.
- Prevent duplicate ingestion; be robust to malformed MIME, missing headers, oversized messages, intermittent server failures and partial syncs.
- Keep text/plain safe; sanitize or isolate HTML; restrict attachments (size, filename, storage path, media handling, download authorization).
- Synchronize read, flagged, and delete/trash operations carefully; do not silently mutate the remote mailbox on uncertain failures.
- Record last sync, sync status, and safe diagnostics. Make manual sync available once the backend sync exists.

### Credentials and deliverability

- Encrypt stored SMTP/IMAP passwords using authenticated encryption with a separately protected persistent key. Never return credentials in GET responses or logs; an empty edit field must not erase an existing password inadvertently.
- Never permit arbitrary unauthenticated connection testing. Check access permissions, use timeouts and address SSRF/internal-network risks in host configuration.
- Provide honest SPF/DKIM/DMARC/MX/PTR guidance and DNS checks. Provider-specific DNS values must come from actual provider configuration; do not fabricate records or promise zero spam.
- Do not implement scraping, unsolicited mass mailing, or unrestricted outbound APIs.

## 10. Testing and commands

Before closing a task, run the relevant checks available in the execution environment:

```bash
# Docker syntax and service state
docker compose config
docker compose up -d --build
docker compose ps

# Existing backend checks and tests
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test core

# Frontend typecheck and build
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run build
```

Adjust commands to changed scripts/containers, and add focused tests for new behavior. Add a repository-wide test strategy as features grow (pytest-django, mocked SMTP/IMAP, frontend component tests, and integration smoke tests).

Minimum security regression cases include:

- Invalid setup token, repeat setup, and concurrent setup requests.
- Unauthenticated access, CSRF denial, wrong-user mailbox access, and unauthorized configuration changes.
- Stored-secret encryption/decryption and absence of passwords in API output/logs.
- SMTP failure and retry behavior without unintended duplicate sends.
- IMAP UID/UIDVALIDITY deduplication and partial/failing syncs.
- MIME parsing, HTML sanitization, attachment limits and malformed messages.

**Do not claim any command or test passed unless you actually ran it.** If Docker or external mail services are unavailable, state the precise limitation and run the subset that is possible. Do not fake integration tests or inject real account credentials into fixtures.

## 11. Open-source quality and documentation

- Maintain `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, roadmap, and GitHub Actions as features evolve.
- Keep security and installation instructions explicit, reproducible, and truthful about known limitations.
- Provide an `.env.example` only when useful for optional advanced deployments; normal local installation must not require `.env` editing.
- Never commit secrets, local databases, `.env` files, uploaded attachments, generated tokens, private keys, or real emails.
- Do not push, publish a release, create a remote repository, or alter remote GitHub settings without explicit authorization.
- Make small, reviewable changes; keep dependencies justified and update lockfiles where the ecosystem provides them.
- Add/adjust tests and documentation in the same change as the behavior they describe.

## 12. Priority order and execution workflow

Use this incremental implementation order unless the user requests a specific feature:

1. **Foundation:** verify Docker Compose, PostgreSQL, secret bootstrap, API-only Django, Next.js, migrations, health probes.
2. **Secure installer:** complete and test owner setup, status checks, setup lockout and settings persistence.
3. **Authentication:** session login/logout, CSRF, roles, authorization, protected frontend routes.
4. **Mail account settings:** CRUD, credential encryption, SMTP/IMAP tests, web forms.
5. **Real mail:** safe SMTP send/compose, IMAP sync, Celery/Redis, inbox/sent/drafts, reply/forward, attachments.
6. **Mailbox UX:** search, message actions, sync states, responsive UI, RTL/i18n foundations.
7. **Deliverability and ops:** DNS diagnostics, deployment security, backup/restore, CI, docs and release checks.

For **each user request**:

1. Inspect actual code and identify affected modules.
2. State a short implementation plan if the task is substantial.
3. Implement working code, including migrations as needed.
4. Add focused tests and run feasible checks.
5. Fix issues introduced by the change.
6. Update user-facing docs and any changed setup/deployment instructions.
7. Report exactly what changed, commands executed and results, limitations, and the next small milestone.

Do not stop after planning or scaffolding if coding was requested. If a full scope cannot be completed, leave the project runnable and **explicitly list unfinished work**. Never misrepresent a partial result as production-ready.

## 13. Definition of done for the first usable release

A fresh clone can run `docker compose up -d --build`; the owner completes setup in the browser; logs in; configures an external SMTP/IMAP account securely; tests connections; sends a real email; receives/synchronizes a real email; views and replies to mail; restarts without data loss; and runs documented automated tests. No Django Admin, Django templates, manual `.env` edits for the normal local path, exposed internal ports, or plaintext mail credentials are involved.

Until those conditions are validated, label functionality and releases according to their actual state.
