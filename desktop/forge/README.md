# FORGE — Offline Fitness Tracker

FORGE is a desktop fitness tracker for Windows, built to help you manage your training, nutrition, and fitness progress in one place. It uses a React interface, a local Express API, and a SQLite database, all brought together with Electron.

The application is designed for **local, offline-first use**. Your workout history and personal tracking data are stored on your computer rather than in a hosted account.

> **Project status:** FORGE runs in development mode, and an unpacked Windows executable has been generated. The packaged application and installer still require final verification before they are considered ready for release.

## Features

- **Dashboard:** Overview of workouts, nutrition, weight, and recent activity.
- **Workouts:** Log training sessions, exercises, sets, weights, repetitions, timed intervals, and rest days.
- **Exercise library:** Search and filter a preloaded library of **598 exercises**; add and manage your own exercises.
- **Nutrition:** Log meals, calories, protein, carbohydrates, and fat; configure daily targets.
- **Progress:** Record body weight, body measurements, and progress over time.
- **Calendar:** View training and recovery activity by date.
- **Profile:** Personalize your name, training focus, height, and bio.
- **Backup & Restore:** Download SQLite backups, validate them, and restore data with confirmation and safety-backup protections.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Desktop application | Electron |
| Frontend | React, Vite, React Router, Lucide icons |
| Backend | Node.js, Express |
| Database | SQLite (`better-sqlite3`) |
| API tests | Vitest, Supertest |
| Windows packaging | electron-builder |

## Repository Structure

```text
forge/
├── client/                # React frontend
│   └── src/
├── server/                # Express API, database services, scripts, tests
│   └── src/
├── db/                    # SQLite schema and starter exercise seed (SQL source)
│   ├── schema.sqlite.sql
│   └── seed.desktop.sql
├── electron/              # Desktop main process and packaging configuration
│   ├── assets/            # FORGE application icons
│   ├── main.js
│   ├── preload.cjs
│   └── package.json
└── .gitignore
```

## Running the Project Locally

### Requirements

- Windows (the current desktop packaging target)
- Node.js and npm for **development**

Install dependencies in each project directory:

```powershell
cd client
npm install

cd ../server
npm install

cd ../electron
npm install
```

### Frontend and backend development

Start the Express API in one terminal:

```powershell
cd server
npm start
```

Start Vite in another terminal:

```powershell
cd client
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

### Electron desktop development

Build the frontend first:

```powershell
cd client
npm run build
```

Then start Electron:

```powershell
cd ../electron
npm start
```

Electron starts the local backend and loads the built React frontend. **Do not leave a separate backend running on port 5000** when starting Electron, because the application verifies that it owns its API process.

## Database and First-Run Data

A new FORGE installation is designed to initialize a local SQLite database containing:

- **598 preloaded exercises**
- One internal local account used by the offline application
- A generic **FORGE Athlete** profile
- No workout history, meals, progress measurements, or rest days

The internal account identifier (`demo@forge.local`) is a local implementation detail, **not** an online login or a prepopulated demo history.

On Windows, the persistent application database is stored at:

```text
%APPDATA%\FORGE\data\forge.sqlite
```

Safety backups are stored under:

```text
%APPDATA%\FORGE\backups\
```

These locations are outside the application installation directory so that application updates do not intentionally replace user data.

**Do not commit personal `.sqlite` database files to Git.** The repository should contain the SQL schema and seed definitions, not user data.

## Backup and Restore

FORGE includes SQLite backup functionality for preserving local data.

- Download a copy of the current database from Settings.
- Select and validate an existing FORGE SQLite backup.
- Restore a backup after explicit confirmation; the restore workflow is designed to create a safety copy of the current database.

**Recommendation:** Keep independent backup copies outside the application folder, especially before testing new builds or restoration features.

## Testing

Run the API test suite from the server directory:

```powershell
cd server
npm test
```

Tests cover database behavior, API validation, CRUD operations, and other backend functionality. The exact test count may change as the project develops.

## Building FORGE for Windows

From the Electron directory:

```powershell
cd electron
npm run pack:dir
```

This produces an **unpacked build** for testing (typically in `electron/dist/win-unpacked/`).

After verifying that the unpacked build launches correctly, can access the bundled backend and SQLite module, and initializes a fresh database, build the installer:

```powershell
npm run dist
```

The intended Windows installer is generated under the configured Electron Builder output directory (typically `electron/dist/`).

> **Important:** Creating an `.exe` does not by itself verify that it works on a clean PC. Test the unpacked application, first-run initialization, backup functionality, and installer before distributing a release.

## Privacy and Local Data

FORGE is designed to store fitness data locally in SQLite. A hosted account is not required for the desktop workflow described here. Users are responsible for backing up their own data.

The `.gitignore` excludes local databases, environment files, dependencies, and generated build outputs. If sensitive files were committed previously, ignoring them does **not** remove them from Git history.

## Creator

Made with lots of coffee ☕ and a computer 💻 by **Aspasija**.

© FORGE. The app displays its copyright year dynamically.

---

*FORGE is an actively developed personal software project. Functionality and packaging details may change before the first public release.*