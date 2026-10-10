"""One-time, idempotent generation of server-side secrets.

This script runs in a private Docker volume before PostgreSQL starts.
Do not mount this volume into the Next.js container.
"""
import base64
import os
from pathlib import Path
import secrets

ROOT = Path('/run/peykbox')
ROOT.mkdir(parents=True, exist_ok=True)

VALUES = {
    'db_password': lambda: secrets.token_urlsafe(36),
    'django_secret': lambda: secrets.token_urlsafe(64),
    'encryption_key': lambda: base64.urlsafe_b64encode(os.urandom(32)).decode(),
    'setup_token': lambda: secrets.token_urlsafe(24),
}

for filename, factory in VALUES.items():
    path = ROOT / filename
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        continue
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(factory() + '\n')
    except BaseException:
        path.unlink(missing_ok=True)
        raise
    # The backend runs as user 10001; PostgreSQL's entrypoint reads secrets as root.
    os.chown(path, 10001, 10001)

print('Bootstrap secrets ready.')
print('For the one-time web installation key, run:')
print('  docker compose exec backend cat /run/peykbox/setup_token')
