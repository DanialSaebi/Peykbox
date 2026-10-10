# Roadmap

- [x] **M1** — Monorepo, Docker Compose, Postgres, Next.js app, Django REST API, web installer, first-owner creation, initial tests.
- [ ] **M2** — Login / logout, secure session authentication, instance settings dashboard, secret storage and rotation.
- [ ] **M3** — SMTP provider configuration, connection test, one-to-one transactional sends, sent history, retry queue, bounce handling.
- [ ] **M4** — IMAP inbox sync (or inbound webhook provider), mailbox views, read/unread, threads, replies, attachments.
- [ ] **M5** — DNS guidance + verification (SPF, DKIM, DMARC, MX), abuse controls, sending caps, observability.
- [ ] **M6** — Caddy/Traefik HTTPS reverse proxy, backup/restore, GitHub CI, security hardening, tagged stable release.

Provider integration in M3/M4 is **not the same** as running a full independent SMTP + IMAP server. A standalone mail server remains a possible future integration, not part of the MVP.
