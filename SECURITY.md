# Security Policy

Peykbox is currently an early-stage prototype, **not a production-ready email server**. Do not expose an installation to the public Internet or use it for sensitive email.

Do not disclose vulnerabilities in public issues. Until an official private reporting channel has been published, contact the repository maintainers privately using the GitHub security advisory interface (when enabled).

The initial setup token, database credentials, Django signing secret, and encryption key belong only in the Docker secrets volume. Never commit or publish their values.
