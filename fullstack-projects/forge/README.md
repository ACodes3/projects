# FORGE — Training & Nutrition

**A full-stack fitness tracking application built with React, Express, and PostgreSQL.**

FORGE helps users plan and record strength-training sessions, manage an exercise library, log nutrition, track body measurements, schedule recovery, and review activity through a dashboard. This repository contains the **web/full-stack edition**; any Electron desktop distribution is a separate project and should be documented independently.

> **Project status:** Portfolio / local-development application. This version is intentionally **single-user**, using a seeded demo account rather than registration and authentication. It is not configured for public multi-user hosting.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Axios, Lucide React, CSS |
| Backend | Node.js, Express 5, REST API, `pg`, `dotenv`, CORS |
| Database | PostgreSQL, relational tables, foreign keys, constraints and indexes |
| Development | npm, Vite, nodemon, ESLint |

## Implemented functionality

- **Workouts:** Browse workout history, create and edit sessions, associate exercises and log repetition-, duration- or weight-based sets.
- **Exercise library:** Browse and manage exercises, including muscle groups and equipment information.
- **Nutrition:** Record meal entries and configure daily calorie and macronutrient targets.
- **Progress:** Record and review body measurements and progress information.
- **Calendar and rest days:** View training activity and log recovery days.
- **Profile:** Maintain the demonstration user's profile.
- **Dashboard:** View aggregated training and nutrition information.

## Project structure

```text
forge-full-stack/
├── client/             # React web application
│   └── README.md
├── server/             # Express API and PostgreSQL access
│   └── README.md
├── db/                 # Schema and development seed SQL
│   ├── schema.sql
│   ├── seed.sql
│   └── README.md
├── LICENSE             # Proprietary source-code notice (add separately)
├── COPYRIGHT.md        # Copyright and attribution scope (add separately)
└── README.md
```

## Running locally

### Requirements

- Node.js and npm compatible with the included Vite and Express versions
- PostgreSQL running locally
- A PostgreSQL user with permission to create databases and tables

### 1. Initialize PostgreSQL

Create an empty database named `forge` (or use another name and update the backend configuration). From the repository root:

```bash
psql -U postgres -c "CREATE DATABASE forge;"
psql -U postgres -d forge -f db/schema.sql
psql -U postgres -d forge -f db/seed.sql
```

If you already created the database, skip the first command. **The seed removes and recreates demo workout, nutrition, progress, and rest-day data**; do not rerun it if you need to preserve entries. See [db/README.md](db/README.md).

### 2. Start the backend

```bash
cd server
npm install
```

Create `server/.env`:

```dotenv
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forge
DB_USER=postgres
DB_PASSWORD=replace_with_your_local_password
```

Then run:

```bash
npm run dev
```

The backend serves `http://localhost:5000/api`; check `http://localhost:5000/api/health`.

### 3. Start the frontend

In a separate terminal, from the repository root:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` (or the URL reported by Vite). If necessary, create `client/.env` containing:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

### Available scripts

| Directory | Command | Purpose |
| --- | --- | --- |
| `client/` | `npm run dev` | Start Vite |
| `client/` | `npm run build` | Build static frontend |
| `client/` | `npm run preview` | Preview frontend build |
| `client/` | `npm run lint` | Run ESLint |
| `server/` | `npm run dev` | Start API with nodemon |
| `server/` | `npm start` | Start API with Node.js |

The supplied package manifests do not define automated test scripts.

## Architecture and development notes

The React client calls the Express REST API using Axios. The Express controllers read and write PostgreSQL data for one seeded user (`demo@forge.local`). The frontend's start-screen gate uses a `sessionStorage` flag; it **is not authentication**. The backend's current CORS configuration accepts `http://localhost:5173`.

**Do not expose the current API on the public internet as a user-data service:** there is no real login or per-user authorization. Use synthetic data during portfolio demonstrations and keep local `.env` credentials out of Git.

## Documentation

- [Frontend](client/README.md) — UI, routes, configuration and client build
- [Backend](server/README.md) — API, controllers, configuration and security notes
- [Database](db/README.md) — tables, relationships, schema and seed

## Copyright and usage

Copyright © 2026 **ACodes3**. All rights reserved **in original work owned by the copyright holder**.

The original source code is publicly shown for portfolio review. No general open-source reuse license is granted. See the repository's `LICENSE` and `COPYRIGHT.md` notices if included. Third-party packages, graphics, icons and other assets remain subject to their own terms and are not covered by claims of exclusive ownership.