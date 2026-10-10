# Contributing to Peykbox

Thanks for your interest in building an approachable self-hosted mail workspace.

1. Open an issue describing a bug or proposed feature before starting a large change.
2. Fork the repository and work in a dedicated branch.
3. Keep all API endpoints under `/api/` and ensure they are JSON-only.
4. Run Django checks and tests with Docker Compose before opening a pull request.
5. Never commit credentials, mail payloads, access tokens, or Docker volumes.
6. Write tests for installer state transitions, concurrent requests, and mail security controls.

We welcome documentation, tests, and accessibility improvements.
