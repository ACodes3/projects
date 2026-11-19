# Optional KINETIQ accounts + backup server

Python 3.11+ standard library. For local testing (from `server/`):

```powershell
python kinetiq_server.py
```

On the Android emulator, launch Flutter with:

```powershell
flutter run --dart-define=KINETIQ_API_BASE_URL=http://10.0.2.2:8765 --dart-define=KINETIQ_ALLOW_DEV_HTTP=true
```

The Android emulator needs a **debug-only cleartext HTTP exception** (or use HTTPS); prefer HTTPS when possible. Android's `10.0.2.2` reaches the Windows host's loopback server. On a physical device use an HTTPS hostname and deploy the server behind a TLS reverse proxy. Credentials must never be sent over public HTTP.

This backend genuinely supports email/password registration and login, revocable session tokens, secure password hashing, password reset/verification via configured SMTP, account deletion, and per-account revision-checked snapshots. Configure `KINETIQ_SMTP_HOST`, `KINETIQ_SMTP_PORT`, `KINETIQ_SMTP_FROM`, `KINETIQ_SMTP_USER`, and `KINETIQ_SMTP_PASS` for emails. **Email reset/verification deliberately fails when SMTP is not configured; it never pretends a code was sent.**

## Not provided

This is a developer reference service, **not production-ready**: further work is needed for distributed rate limiting, security review, HTTPS deployment, monitoring, credential rotation, infrastructure backups, account privacy/legal documentation, cloud object size/quotas and billing. Backup is a **single revisioned account snapshot**, not automatic incremental two-way syncing, conflict-free record merges, or verified multi-device restore. Conflicting writes are rejected instead of silently overwritten. AI routes and requests are not included.

Start tests via `python -m unittest discover -s tests -v` in `server/`.
