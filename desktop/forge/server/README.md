
# FORGE Desktop — Local Express API

This directory contains the local Node.js/Express backend for **FORGE Desktop v1.0.0**.

The active desktop database is **SQLite via `better-sqlite3`**, not PostgreSQL. Some PostgreSQL-era files (`src/config/db.js` and dependency `pg`) remain in the source tree; `src/server.js` imports `src/config/sqlite.js` for the desktop runtime.

## API responsibilities

The API manages exercises, workouts and sets, nutrition entries/goals, progress, rest days, the local profile, dashboard data, and SQLite backups/restores.

| Base endpoint | Role |
| --- | --- |
| `GET /api/health` | Health check; includes an instance ID when launched by Electron |
| `/api/exercises` | Exercise catalog CRUD |
| `/api/workouts` | Workout sessions, exercises and sets |
| `/api/nutrition` | Meal entries and macro goals |
| `/api/progress` | Body weight and measurements |
| `/api/rest-days` | Recovery dates |
| `/api/profile` | Profile |
| `/api/dashboard` | Dashboard summary |
| `/api/backup` | Backup/restore routes |

Consult `src/routes/` for precise methods and request payloads.

## Folder layout

```text
server/
├── src/
│   ├── app.js                        # Express routes and middleware
│   ├── server.js                     # Localhost server entry
│   ├── config/sqlite.js              # Active SQLite connection
│   ├── config/initializeDatabase.js  # First-run provisioning
│   ├── routes/                       # Endpoint definitions
│   ├── controllers/                  # HTTP handlers
│   ├── services/                     # Backup and restore logic
│   └── middleware/                   # Local user context
├── scripts/                          # Initialization and validation
├── tests/                            # Vitest + Supertest
└── package.json
```

## Development: SQLite API

From `server/`:

```powershell
npm install
node scripts/init-db.js
npm run dev
```

The initialization script creates the **development** SQLite file under `db/forge.sqlite` if not already initialized.

The API listens at `http://127.0.0.1:5000`. Its health endpoint is:

```text
http://localhost:5000/api/health
```

### npm scripts

```powershell
npm start
npm run dev
npm test
npm run test:watch
```

For installed desktop usage, **do not manually launch the server**. Electron initializes the database under its userData directory and starts a managed backend subprocess with `FORGE_DB_PATH` and `FORGE_INSTANCE_ID` environment variables.

## Data initialization and safety

- `db/schema.sqlite.sql` is the active desktop schema.
- `db/seed.desktop.sql` creates an internal local user/profile and starter exercise catalog without demo activity history.
- `src/config/initializeDatabase.js` provisions missing databases and performs SQLite integrity and foreign-key checks.
- `src/config/sqlite.js` enables foreign keys and WAL journaling.
- `FORGE_DB_PATH` selects the database file.

Do not commit generated `.sqlite` files, WAL/SHM files, real workout history, or exported backups.

## Testing

`tests/setup.js` creates a **temporary SQLite database per test worker** and inserts the local test identity.

The test suite covers health checks, exercises, workouts, nutrition, progress, profiles, rest days, database initialization, backups and restore behavior.

Run:

```powershell
npm test
```

Keep restore testing isolated from real personal databases.

## Security boundaries

The API binds to `127.0.0.1`, but its single-user middleware does **not** implement production authentication.

Treat this backend as a trusted local desktop component, **not** an internet-facing service.

The Electron instance ID distinguishes the managed process; it is **not** an authentication credential.

Backup and restore paths should be validated, and untrusted database files require appropriate safeguards.

## Copyright and license

Copyright © 2026 ACodes3. All rights reserved in the author's original code and documentation.

Public source availability is for portfolio review; no general license to reuse or redistribute the original code is granted unless separately authorized.

Third-party dependencies and assets retain their own rights and license terms. See the repository's `LICENSE` and `COPYRIGHT.md` for the project's full notices.
