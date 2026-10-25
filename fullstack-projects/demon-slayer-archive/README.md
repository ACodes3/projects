# Demon Slayer Archive

**Full-stack character and abilities archive** inspired by *Demon Slayer: Kimetsu no Yaiba*. A React interface explores Demon Slayers, demons, Breathing Styles, Blood Demon Arts, and techniques using data served by a Node.js/Express API backed by PostgreSQL.

> **Portfolio project · Unofficial fan creation.** This repository showcases full-stack development and database-backed content browsing. It is not an official Demon Slayer product.

## Features

- Browse dedicated lists and detail pages for Slayers, Demons, Breathing Styles, and Blood Demon Arts.
- Open individual technique detail pages from related archive content.
- Navigate relationships between characters, styles, arts, and techniques.
- Load collection and detail data from a REST API instead of relying on hardcoded frontend datasets.
- API supports listing, individual retrieval, creation, partial updates, and deletion across all five resource types.
- Server-side Zod validation, relationship integrity checks, and deletion protection.
- Interactive Swagger/OpenAPI reference, request logging, security headers, CORS restrictions, and API rate limits.
- Automated backend tests with Vitest and Supertest; test configuration protects against using the production/development database.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Axios, Lucide React, CSS |
| Backend | Node.js (ES modules), Express 5, Zod, Swagger/OpenAPI |
| Database | PostgreSQL, `pg` connection pool, SQL seed scripts |
| API safeguards | Helmet, CORS, express-rate-limit, relationship validation |
| Logging and tests | Winston, Morgan, Vitest, Supertest |

## Repository structure

```text
demon-slayer-archive/
├── client/                  # React/Vite interface
│   ├── src/pages/           # Lists and detail pages
│   ├── src/services/        # Axios API integration
│   └── public/images/       # Character images
├── server/                  # Express REST API
│   ├── src/controllers/     # Archive CRUD logic
│   ├── src/routes/          # Route definitions
│   ├── src/validators/      # Schemas and relationships
│   ├── src/docs/            # Swagger/OpenAPI
│   └── tests/               # Integration tests
└── db/
    ├── schema.sql          # PostgreSQL tables
    ├── seed.sql            # Public sample archive data
    └── test-schema.sql     # Isolated test schema
```

Read more: [Frontend](client/README.md) · [Backend](server/README.md) · [Database](db/README.md).

## Run locally

**Prerequisites:** Node.js and npm compatible with the checked-in packages, plus PostgreSQL. Use two terminals for the client and server.

### 1. Initialize PostgreSQL

Create the development database using `psql` or your SQL client:

```sql
CREATE DATABASE demon_slayer_archive;
```

From the project root, apply the schema and sample data:

```bash
psql -U postgres -d demon_slayer_archive -f db/schema.sql
psql -U postgres -d demon_slayer_archive -f db/seed.sql
```

`seed.sql` uses upserts, so existing rows with the same identifiers may be updated. Use a disposable/development database if you want to preserve your own edits.

### 2. Configure and run the backend

```bash
cd server
npm install
```

Create `server/.env`:

```dotenv
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=demon_slayer_archive
DB_USER=postgres
DB_PASSWORD=your_local_postgres_password
CLIENT_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

Then start the API:

```bash
npm run dev
```

API health response: `http://localhost:5000/` · Swagger UI: `http://localhost:5000/api-docs`.

### 3. Run the frontend

In a **second** terminal:

```bash
cd client
npm install
npm run dev
```

The Vite development server is typically at `http://localhost:5173`. The client defaults to `http://localhost:5000/api`, or you can create `client/.env` with:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

## API overview

Each resource supports `GET /api/<resource>`, `GET /api/<resource>/:id`, `POST`, `PATCH /:id`, and `DELETE /:id`.

| Resource | Base endpoint |
| --- | --- |
| Demon Slayers | `/api/slayers` |
| Demons | `/api/demons` |
| Breathing Styles | `/api/breathing-styles` |
| Blood Demon Arts | `/api/blood-demon-arts` |
| Techniques | `/api/techniques` |

Example: `GET http://localhost:5000/api/slayers?limit=100`. See the Swagger UI and [backend documentation](server/README.md) for request and response details.

## Tests

The backend includes archive, CRUD, validation, database, and Swagger tests. The provided test setup requires **a separate database named `demon_slayer_archive_test`** and refuses to run in any other database.

After creating and initializing that database and setting `TEST_DB_NAME=demon_slayer_archive_test` in `server/.env`, run from `server/`:

```bash
npm run test-two
```

The frontend provides:

```bash
npm run lint
npm run build
```

## Project status and limitations

This is a portfolio-oriented archive rather than a finished encyclopedia or official data source. The checked-in seed dataset is a curated subset, not a comprehensive character catalog. Frontend image availability depends on matching files under `client/public/images/`; some records may not have corresponding assets. Ratings and statistics are application-defined rather than canonical rankings. The client is primarily a browsing interface; the backend exposes CRUD endpoints that can be exercised using an HTTP client or Swagger.

## Copyright and fan-project disclaimer

Copyright © 2026 ACodes3. All rights reserved in original code and original documentation, to the extent held by the author.

This public repository is intended as a portfolio and educational showcase. Demon Slayer / Kimetsu no Yaiba, its characters, names, lore, and associated imagery belong to their respective rights holders. This is an unofficial fan-made project, not affiliated with or endorsed by those rights holders. Third-party assets and dependencies remain subject to their own rights and licenses.
