# FORGE — Backend

REST API for **FORGE Training & Nutrition**, a personal fitness tracker. Built with Node.js, Express, and PostgreSQL. The server handles exercise records, workout sessions, food logs, nutrition targets, body measurements, rest days, user profile information, and dashboard data.

## Tech stack

- **Node.js** with ECMAScript modules
- **Express 5** for HTTP routes and middleware
- **PostgreSQL** with the `pg` connection pool
- **dotenv** for environment variables
- **cors** for requests from the React frontend
- **nodemon** for development-time restarts

## Prerequisites

- Node.js and npm (use a current LTS release compatible with the dependencies)
- A running PostgreSQL instance
- The `forge-full-stack/` project, including the `db/` and `server/` directories

## Project structure

```text
forge-full-stack/
├── db/
│   ├── schema.sql                 # Database schema and related SQL
│   └── seed.sql                   # Demo user and development data
└── server/
    ├── src/
    │   ├── app.js                 # Express app, CORS, routes, 404 handler
    │   ├── server.js              # Database check and HTTP startup
    │   ├── config/db.js           # PostgreSQL connection pool
    │   ├── controllers/           # Request handling and database logic
    │   ├── routes/                # API route definitions
    │   └── middleware/            # Demo/single-user context
    ├── .env                       # Local configuration (do not commit)
    └── package.json
```

## Local setup

### 1. Create a PostgreSQL database

Create a database (for example, `forge`) using `psql` or your preferred PostgreSQL client:

```sql
CREATE DATABASE forge;
```

Run the SQL scripts **in order**, from the repository root:

```bash
psql -U postgres -d forge -f db/schema.sql
psql -U postgres -d forge -f db/seed.sql
```

Replace `postgres` with your PostgreSQL user and `forge` with your database name if necessary. The seed inserts the demo user, profile, nutrition goals, exercises, and sample activity. **Re-running `seed.sql` resets the demo user's activity data**, so avoid reseeding a database with activity you want to keep.

### 2. Install packages

```bash
cd server
npm install
```

### 3. Configure environment variables

Create or update `server/.env`:

```dotenv
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forge
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

These are illustrative values: match them to your local PostgreSQL configuration. Keep `.env` and database credentials private.

### 4. Start the API

For development with automatic restarts:

```bash
npm run dev
```

Or run it normally:

```bash
npm start
```

The default API address is `http://localhost:5000/api`. The server checks its PostgreSQL connection during startup and exits if it cannot connect.

### 5. Check the health endpoint

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "FORGE API is running."
}
```

## API endpoints

All routes below are relative to `http://localhost:5000`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| GET | `/api/exercises` | List active exercises |
| GET | `/api/exercises/:id` | Get an exercise |
| POST | `/api/exercises` | Create an exercise |
| PUT | `/api/exercises/:id` | Update an exercise |
| DELETE | `/api/exercises/:id` | Soft-delete an exercise |
| GET | `/api/workouts` | List workouts |
| GET | `/api/workouts/:id` | Get a workout |
| POST | `/api/workouts` | Create a workout |
| PUT | `/api/workouts/:id` | Update a workout |
| DELETE | `/api/workouts/:id` | Delete a workout |
| GET | `/api/nutrition` | List nutrition entries; optional `?date=YYYY-MM-DD` |
| POST | `/api/nutrition` | Add a food entry |
| PUT | `/api/nutrition/:id` | Edit a food entry |
| DELETE | `/api/nutrition/:id` | Delete a food entry |
| GET | `/api/nutrition/goals` | Read nutrition goals |
| PUT | `/api/nutrition/goals` | Save nutrition goals |
| GET | `/api/progress` | List progress entries; optional date filter |
| POST | `/api/progress` | Add a progress entry |
| PUT | `/api/progress/:id` | Edit a progress entry |
| DELETE | `/api/progress/:id` | Delete a progress entry |
| GET | `/api/rest-days` | List rest days |
| POST | `/api/rest-days` | Add a rest day |
| DELETE | `/api/rest-days/:date` | Delete a rest day for a date |
| GET | `/api/profile` | Read the user's profile |
| PUT | `/api/profile` | Save the user's profile |
| GET | `/api/dashboard` | Fetch dashboard summary data |

Most resources return JSON. See `src/controllers/` and the frontend's `src/api/forgeApi.js` for the exact request and response fields.

## Database design

The schema includes users, profiles, exercises, workouts, workout exercises, workout sets, nutrition entries, nutrition goals, progress entries, and rest days. Workout exercises store a name snapshot so historical workouts remain understandable even when an exercise is renamed or removed from the active library. Workout sets support either repetition counts or timed durations, with optional weight.

## Development and security notes

- **Demo-only user model:** This version does **not** implement registration or login. User-scoped routes load the seeded `demo@forge.local` user. Do **not** deploy it as a publicly accessible multi-user service without real authentication and authorization.
- **CORS:** `src/app.js` currently permits the frontend at `http://localhost:5173`. Update the origin for another deployment address.
- **Database:** PostgreSQL must be running, and the schema and seed must be applied before user-scoped API routes work.
- **Scripts:** `npm run dev` and `npm start` are provided; the backend package does not define an automated test script.
- **Missing routes:** Unknown endpoints return a JSON `404` response.

## Run with the frontend

Start this backend first, then run the frontend from `forge-full-stack/client` using `npm run dev`. The frontend defaults to calling `http://localhost:5000/api`, unless `VITE_API_URL` overrides it.

## Copyright and license

Copyright © 2026 **ACodes3**. All rights reserved in original work owned by the copyright holder. The API source is displayed for portfolio review, without a general reuse grant. Dependencies keep their respective licenses. See the root `LICENSE` and `COPYRIGHT.md` if included.