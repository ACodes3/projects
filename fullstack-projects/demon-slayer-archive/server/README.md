# Demon Slayer Archive API

A RESTful backend for a Demon Slayer character and abilities archive, built with Node.js, Express, and PostgreSQL. This API powers a separate React frontend and manages Slayers, Demons, Breathing Styles, Blood Demon Arts, and Techniques.

> Portfolio / learning project. The public seed data is intentionally spoiler-conscious; the local database may contain additional records. Character ratings are custom application data, not official rankings.

## Tech Stack

- **Node.js** + **Express 5** — HTTP API
- **PostgreSQL** + **pg** — relational database and connection pooling
- **Zod** — request and environment validation
- **Swagger / OpenAPI** — interactive API documentation
- **Helmet** and **CORS** — HTTP headers and allowed frontend origins
- **express-rate-limit** — request limiting
- **Winston** and **Morgan** — logging
- **Vitest** + **Supertest** — automated API tests

## Project Structure

```text
demon-slayer/
├── db/
│   ├── schema.sql
│   ├── seed.sql
│   └── test-schema.sql
└── server/
    ├── app.js                  # Express configuration and middleware
    ├── server.js               # Connects to PostgreSQL and starts server
    ├── package.json
    ├── .env                    # Local configuration (do not commit)
    ├── src/
    │   ├── config/            # Database, environment, logger
    │   ├── controllers/       # CRUD and collection operations
    │   ├── docs/              # Swagger/OpenAPI definitions
    │   ├── middleware/        # Validation, rate limits, errors, logging
    │   ├── routes/            # API endpoints
    │   ├── utils/             # Application error helper
    │   └── validators/        # Zod schemas and relationship checks
    └── tests/                 # Automated test suites
```

## Requirements

- Node.js and npm
- A running PostgreSQL server
- A PostgreSQL database for the application

## Getting Started

From the repository's `server` directory:

```bash
cd server
npm install
```

Create a PostgreSQL database (example name):

```sql
CREATE DATABASE demon_slayer_archive;
```

From the repository root, apply the schema and optional **public** seed:

```bash
psql -U postgres -d demon_slayer_archive -f db/schema.sql
psql -U postgres -d demon_slayer_archive -f db/seed.sql
```

If you're using pgAdmin, you can open and execute the same SQL files in the Query Tool instead. The seed is optional if your database already contains the data you want to use.

Create `server/.env` with values appropriate for your machine:

```dotenv
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=demon_slayer_archive
DB_USER=postgres
DB_PASSWORD=replace_with_your_password
TEST_DB_NAME=demon_slayer_archive_test
CLIENT_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

Never commit `.env` or real database credentials.

Start the API:

```bash
npm run dev
```

For a normal Node.js start without Nodemon:

```bash
npm start
```

Default API URL: **http://localhost:5000**

Check that it's running:

```text
GET http://localhost:5000/
```

## API Endpoints

All archive routes have the `/api` prefix.

| Resource | List | Get one | Create | Update | Delete |
| --- | --- | --- | --- | --- | --- |
| Slayers | `GET /api/slayers` | `GET /api/slayers/:id` | `POST /api/slayers` | `PATCH /api/slayers/:id` | `DELETE /api/slayers/:id` |
| Demons | `GET /api/demons` | `GET /api/demons/:id` | `POST /api/demons` | `PATCH /api/demons/:id` | `DELETE /api/demons/:id` |
| Breathing Styles | `GET /api/breathing-styles` | `GET /api/breathing-styles/:id` | `POST /api/breathing-styles` | `PATCH /api/breathing-styles/:id` | `DELETE /api/breathing-styles/:id` |
| Blood Demon Arts | `GET /api/blood-demon-arts` | `GET /api/blood-demon-arts/:id` | `POST /api/blood-demon-arts` | `PATCH /api/blood-demon-arts/:id` | `DELETE /api/blood-demon-arts/:id` |
| Techniques | `GET /api/techniques` | `GET /api/techniques/:id` | `POST /api/techniques` | `PATCH /api/techniques/:id` | `DELETE /api/techniques/:id` |

### Example list request

```http
GET /api/slayers?limit=100
```

Collection responses contain `data` (the records) and `pagination` metadata. The frontend currently uses `limit=100` to retrieve collections beyond the default page size.

Database / API field names use `snake_case` (for example, `breathing_style_ids`). The React frontend's `dataService.js` converts them to `camelCase` for components.

### Example partial update

```http
PATCH /api/slayers/gyomei-himejima
Content-Type: application/json
```

```json
{
  "stats": {
    "power": 100,
    "speed": 92,
    "defense": 99
  }
}
```

This is an illustrative request; use an existing ID and valid values. Updates change the **database**, not the public `seed.sql` file.

## API Documentation

While the server is running, open:

**http://localhost:5000/api-docs**

Swagger UI documents the endpoints, request formats, and response schemas.

## Database

The schema includes five tables:

- `slayers`
- `demons`
- `breathing_styles`
- `blood_demon_arts`
- `techniques`

IDs are readable text slugs (for example, `tanjiro-kamado`). Related record IDs are stored in array fields; stats and themes use PostgreSQL `JSONB`. Some relationships also have foreign-key constraints. The backend validates supported relationships before writes and protects against invalid deletions.

**Important:** `db/seed.sql` is the public dataset. Your local PostgreSQL database can contain additional spoiler records, so do not export the complete local database into the public seed unless you intend to publish that content.

Images are **not stored inside PostgreSQL**. The `image` field holds a path such as `/images/slayers/Tanjiro_anime_right_face.webp`. The React/Vite frontend serves the corresponding file from `client/public/images/`.

## Validation, Errors and Security

- Zod validates incoming create/update payloads and environment configuration.
- Relationship validation checks references between records.
- Centralized error handling returns consistent errors; unknown routes return 404.
- Helmet configures security-related HTTP headers.
- CORS accepts the configured `CLIENT_ORIGIN` value(s), separated by commas.
- General rate limit: **100 requests / 15 minutes / IP**.
- Additional write limit: **30 POST/PATCH/DELETE requests / 15 minutes / IP**.
- JSON request bodies are limited to **100 KB**.

These protections are useful for a portfolio API, but they are **not authentication or authorization**. Write endpoints are not restricted to logged-in admins, so do not expose this server publicly with valuable writable data without adding access controls.

## Tests

The project has automated suites covering database connectivity, archive endpoints, validation, CRUD operations, and Swagger documentation.

**Tests must run against the separate test database, never the main archive database.** Create a test database named exactly `demon_slayer_archive_test` and apply the test schema:

```sql
CREATE DATABASE demon_slayer_archive_test;
```

From the repository root:

```bash
psql -U postgres -d demon_slayer_archive_test -f db/test-schema.sql
```

From `server/`:

```bash
npm run test-two
```

This script sets `NODE_ENV=test`. The test setup also checks that PostgreSQL is actually connected to `demon_slayer_archive_test`, and the environment validation requires the test DB to be different from the main DB and end in `_test`.

In the most recent completed test run, **37 tests passed across 5 test files**.

`npm test` is also defined, but for local usage the `npm run test-two` command is the safer documented choice because it explicitly sets the test environment.

## Frontend Integration

The separate React/Vite client typically runs at **http://localhost:5173**. Its service layer makes requests to **http://localhost:5000/api** and translates API response fields to the format expected by React components.

Run the backend and frontend in separate terminals during development.

## Notes

This backend was created as a learning and portfolio project. Its main goals are clean routing, reusable CRUD logic, validation, PostgreSQL integration, API documentation, and automated tests. Demon Slayer characters and franchise names belong to their respective rights holders; this project is unofficial and fan-made.