# FORGE — Offline Training & Nutrition Tracker

**FORGE v1.0.0** is a Windows-oriented, offline-first desktop fitness tracker built with Electron, React, Express and SQLite. It brings workout logging, an exercise library, nutrition tracking and body-progress records together in one locally stored application.

> **Portfolio and development status:** The desktop source and Windows packaging configuration are available here. The installer and generated `electron/dist/` artifacts are intentionally **not** committed to GitHub. An installer has been built locally; its presence is not implied by this source repository. Further release verification is recommended before broader distribution.

## Features

- **Dashboard:** Training, nutrition, and recent activity overview.
- **Workouts:** Create and edit sessions, exercise sets, weights, repetitions and timed work.
- **Exercise library:** Preloaded exercise catalog with search/filtering and custom exercise management.
- **Nutrition:** Meal entries, calories, macronutrients and daily targets.
- **Progress:** Weight and body measurement records.
- **Calendar and rest days:** Review scheduled activity and recovery.
- **Profile and settings:** Personalized local preferences and profile data.
- **Backup and restore:** SQLite backup, validation, restore checks and recovery safeguards.

## Architecture

```text
FORGE Desktop (Electron main + preload)
  ├── React / Vite client (renderer)
  ├── Local Express API (127.0.0.1:5000)
  └── SQLite file (persisted in Electron userData)
```

The Electron main process initializes the database on first launch, starts its own backend subprocess and verifies its instance before loading the interface. Data stays on the local device; there is no hosted account or cloud synchronization. The seeded internal `demo@forge.local` identifier is a single-user local implementation detail, **not a login system**.

## Technology stack

| Layer    | Technologies                                          |
| -------- | ----------------------------------------------------- |
| Desktop  | Electron, electron-builder / NSIS                     |
| Frontend | React 19, Vite 8, React Router 7, Axios, Lucide React |
| API      | Node.js ESM, Express 5                                |
| Database | SQLite via `better-sqlite3`                           |
| Tests    | Vitest, Supertest                                     |

## Repository layout

```text
forge-desktop/
├── README.md
├── client/         # React pages, components, Vite setup
├── server/         # Express routes, SQLite services, tests
├── db/             # SQLite schema and safe starter seed
├── electron/       # main.js, preload.cjs, icon, packaging config
└── downloads/      # No installer committed
```

Each subsystem has its own README: [client](client/README.md), [server](server/README.md), [database](db/README.md) and [Electron](electron/README.md).

## Development setup

Install Node.js/npm compatible with Electron 44 and Vite 8. In PowerShell from the repository root:

```powershell
cd client
npm install
cd ../server
npm install
cd ../electron
npm install
```

**Recommended desktop development flow:** Build the React client and start Electron (it initializes its own SQLite data and launches the API):

```powershell
cd client
npm run build
cd ../electron
npm start
```

Do **not** leave a separate FORGE API process listening on port 5000 while launching Electron. It checks that the server it reaches is the subprocess it started.

**Optional browser/API development:** Initialize the development database first, then start the backend and Vite separately:

```powershell
cd server
node scripts/init-db.js
npm run dev
```

In a second terminal:

```powershell
cd client
npm run dev
```

The browser client defaults to `http://localhost:5000/api`. This development database is separate from the installed application's userData database.

## Persistent data

The desktop database is provisioned only when missing and is stored in Electron's `userData/data/forge.sqlite` (normally `%APPDATA%\FORGE\data\forge.sqlite` on Windows). Starter data comes from `db/schema.sqlite.sql` and `db/seed.desktop.sql`. The startup initializer is designed not to overwrite an existing database.

Keep personal `.sqlite` files, WAL/SHM files, exported backups, `.env` files and build artifacts out of Git. **Never run reset-style seeds against a database containing personal workout records.**

## Testing and packaging

```powershell
cd server
npm test
```

To produce a Windows build after installing all dependencies and building the frontend:

```powershell
cd electron
npm run pack:dir    # Unpacked Windows app
npm run dist        # NSIS installer, output electron/dist/
```

Generated installers are excluded from this repository. Review bundled content, third-party licenses and the application on a clean Windows machine before distribution.

## Limitations and security

- This edition is designed for **one local user**, not networked multi-user authentication.
- The backend binds to localhost and uses a local single-user context; it is **not** hardened for exposure to the public internet.
- It is offline-first, not a cloud-sync service.
- No `.exe` installer is downloadable from this repository.

## Copyright and license

Copyright © 2026 ACodes3. All rights reserved in the author's original code and documentation. Public source availability is for portfolio review; no general license to reuse or redistribute the original code is granted unless separately authorized. Third-party dependencies and assets retain their own rights and license terms. See the repository's `LICENSE` and `COPYRIGHT.md` for the project's full notices. This notice is not a claim to ownership of third-party libraries or assets.
