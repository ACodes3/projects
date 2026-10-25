# Demon Slayer Archive — Backend API

REST API implemented with **Node.js, Express 5, and PostgreSQL**. It manages Slayers, Demons, Breathing Styles, Blood Demon Arts, and Techniques for the React archive.

[← Project overview](../README.md) · [Frontend](../client/README.md) · [Database](../db/README.md)

## Tech stack

Express 5 · `pg` · Zod · Swagger/OpenAPI · Helmet · CORS · express-rate-limit · Winston/Morgan · Vitest/Supertest.

## Structure

```text
server/
├── app.js                          # Express app and middleware
├── server.js                       # DB connectivity and listener
├── src/
│   ├── config/                     # env, DB connection, logger
│   ├── controllers/archiveController.js
│   ├── docs/                       # Swagger specification and paths
│   ├── middleware/                 # validation, limits, errors, logging
│   ├── routes/archiveRoutes.js
│   ├── validators/                 # Zod and relationship validation
│   └── utils/AppError.js
├── tests/                          # API, CRUD, validation, DB, docs
└── package.json
```

## Start locally

Initialize the development database with `../db/schema.sql` and optionally `../db/seed.sql` (see [database README](../db/README.md)), then:

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
TEST_DB_NAME=demon_slayer_archive_test
CLIENT_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

Environment settings are validated with Zod in `src/config/env.js`. The server verifies PostgreSQL connectivity before listening.

```bash
npm run dev
# or
npm start
```

- Health endpoint: `GET http://localhost:5000/`
- Swagger UI: `http://localhost:5000/api-docs`
- API prefix: `http://localhost:5000/api`

## REST resources

| Resource | Collection URL | Item URL |
| --- | --- | --- |
| Slayers | `/api/slayers` | `/api/slayers/:id` |
| Demons | `/api/demons` | `/api/demons/:id` |
| Breathing Styles | `/api/breathing-styles` | `/api/breathing-styles/:id` |
| Blood Demon Arts | `/api/blood-demon-arts` | `/api/blood-demon-arts/:id` |
| Techniques | `/api/techniques` | `/api/techniques/:id` |

All five resources expose:

- `GET /api/<resource>` — list records (supports query options documented in Swagger).
- `GET /api/<resource>/:id` — retrieve a single record.
- `POST /api/<resource>` — create a record.
- `PATCH /api/<resource>/:id` — partially update a record.
- `DELETE /api/<resource>/:id` — delete a record when relationship checks allow it.

Example:

```bash
curl 'http://localhost:5000/api/slayers?limit=100'
```

The route definitions are in `src/routes/archiveRoutes.js`; input validation and relationship checks run before write controllers. Swagger provides the precise request bodies and response schemas.

## Safeguards

- Zod validation for incoming payloads and environment configuration.
- Relationship validation on creates and updates, plus protection against invalid deletions.
- Helmet security headers and an explicit CORS allowlist from `CLIENT_ORIGIN`.
- General API rate limiting plus stricter limits on `POST`, `PATCH`, and `DELETE`.
- Request logging and centralized 404/error handling.
- SQL queries executed through the PostgreSQL pool.

**Deployment note:** The checked-in routes do not include login/authorization middleware. Do not expose write endpoints to untrusted users without adding authentication, authorization, and deployment controls.

## Tests

Test suites: `archive.test.js`, `crud.test.js`, `database.test.js`, `swagger.test.js`, and `validation.test.js`.

The checked-in `tests/setup.js` requires `NODE_ENV=test` and an **actual database named `demon_slayer_archive_test`**. `src/config/db.js` additionally requires the test DB to be different from `DB_NAME` and end in `_test`.

Create the separate database and apply the test schema before running tests:

```sql
CREATE DATABASE demon_slayer_archive_test;
```

From the repository root:

```bash
psql -U postgres -d demon_slayer_archive_test -f db/test-schema.sql
```

Set `TEST_DB_NAME=demon_slayer_archive_test` in `server/.env`, then from `server/`:

```bash
npm run test-two
```

`npm test` runs the Vitest command but does **not** set `NODE_ENV=test` itself; prefer `npm run test-two` for the safety checks. Tests may create or modify records in the dedicated test database.

## npm commands

| Script | Command |
| --- | --- |
| `npm run dev` | Nodemon with `server.js` |
| `npm start` | Node with `server.js` |
| `npm test` | Vitest run (requires manually set test env) |
| `npm run test-two` | `NODE_ENV=test` + Vitest run |

## Copyright and fan-project disclaimer

Copyright © 2026 ACodes3. All rights reserved in original code and original documentation, to the extent held by the author.

This public repository is intended as a portfolio and educational showcase. Demon Slayer / Kimetsu no Yaiba, its characters, names, lore, and associated imagery belong to their respective rights holders. This is an unofficial fan-made project, not affiliated with or endorsed by those rights holders. Third-party assets and dependencies remain subject to their own rights and licenses.

**Licensing note:** `server/package.json` currently declares `"license": "ISC"`. If you intend to reserve rights in the original code rather than grant an ISC license, reconcile that metadata (and any other license files/notices) before publication. A README notice does not override an existing license grant. Review image rights separately before distributing assets.
