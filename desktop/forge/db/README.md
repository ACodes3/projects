
# FORGE Desktop — SQLite Database

This directory contains the SQL sources for FORGE's local, offline-first data store.

The active desktop database uses **SQLite**, accessed through `better-sqlite3` in the backend. Legacy PostgreSQL SQL files also exist but are **not** used to initialize the desktop edition.

## Active SQLite files

| File | Purpose |
| --- | --- |
| `schema.sqlite.sql` | Desktop SQLite tables, constraints and indexes |
| `seed.desktop.sql` | Safe starter dataset: internal user, profile and exercise catalog |
| `schema.sql` | Legacy PostgreSQL schema |
| `seed.sql` | Legacy PostgreSQL seed; do not apply to desktop data |
| `seed.sqlite.sql` | Older SQLite seed, not used by the Electron initializer |

The packaged desktop application includes `schema.sqlite.sql` and `seed.desktop.sql` as extra resources.

## Database tables

| Table | Stored information |
| --- | --- |
| `users` | Internal single-user identity |
| `profiles` | Name, training focus, height and bio |
| `nutrition_goals` | Daily calorie and macronutrient targets |
| `exercises` | Exercise library, muscle groups and equipment |
| `workouts` | Workout headers, dates and notes |
| `workout_exercises` | Exercises within a workout |
| `workout_sets` | Weight, repetitions or time for each set |
| `nutrition_entries` | Food entries and macronutrients |
| `progress_entries` | Weight, body measurements and notes |
| `rest_days` | Recovery dates and notes |

The schema defines relationships and constraints for users, workouts, exercises, and sets.

The `secondary_muscles` field uses a validated JSON array stored as text. Workout sets use mutually exclusive repetitions and duration values.

## First-run initialization

Electron invokes `server/src/config/initializeDatabase.js` when the user's database does not exist.

The initializer:

1. Creates the target directory and SQLite file.
2. Applies `schema.sqlite.sql` and `seed.desktop.sql` in a transaction.
3. Enables foreign keys and WAL mode.
4. Verifies database integrity and foreign-key consistency.
5. Leaves existing initialized databases untouched.

The seed creates an internal local identity using `demo@forge.local`, with a generic `FORGE Athlete` profile.

This is **not** a remote account or secure authentication system.

The seed does not intentionally preload personal workout, nutrition or progress history.

## Storage locations

### Installed Windows application

Electron stores the database in its userData directory:

```text
%APPDATA%\FORGE\data\forge.sqlite
```

This location is normally outside the application installation directory.

### Manual backend development

The development initializer uses:

```text
db/forge.sqlite
```

This path may be overridden with `FORGE_DB_PATH`.

### Automated tests

Tests use temporary SQLite databases, isolated from actual user data.

## Initialize development data

From `server/`:

```powershell
npm install
node scripts/init-db.js
```

The script creates the local development database.

Electron has its own first-run initialization process, which applies both the desktop schema and starter seed.

For normal desktop testing, launch FORGE through Electron.

## Backup and restore

Backup and restore functionality is implemented in:

```text
server/src/services/
server/scripts/
server/tests/
```

Backups and restore operations include validation and safety checks.

Before restoring data:

- Keep an independent backup.
- Confirm the selected backup file.
- Use the application's validation process.
- Avoid overwriting valuable personal records.

## Data safety

Never commit or distribute personal SQLite databases.

Exclude generated files such as:

```gitignore
*.sqlite
*.sqlite3
*.db
*.sqlite-wal
*.sqlite-shm
*.db-wal
*.db-shm
.env
.env.*
```

Do not apply legacy PostgreSQL seeds to the SQLite database.

Publishing a database schema is generally useful for reproducibility; the schema itself is not a substitute for protecting user data.

## Copyright and license

Copyright © 2026 ACodes3. All rights reserved in the author's original SQL and documentation.

Public source availability is for portfolio review; no general license to reuse or redistribute the original work is granted unless separately authorized.

Third-party materials retain their respective rights. Refer to the project's `LICENSE` and `COPYRIGHT.md`.
