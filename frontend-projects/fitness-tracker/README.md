# FORGE — Frontend

**FORGE Training & Nutrition** is a web-based fitness tracker for recording workouts, managing an exercise library, tracking meals and nutrition goals, reviewing progress, and planning training and recovery. This standalone repository contains the React frontend. Data is served by the FORGE backend API, which is maintained and run as a separate project.

## Tech stack

- **React 19** and **React DOM**
- **Vite 8** for the development server and production builds
- **React Router 7** for client-side navigation
- **Axios** for API requests
- **Lucide React** for icons
- **CSS** for page and component styling

## Prerequisites

- Node.js and npm (use a current version compatible with Vite 8)
- The FORGE backend running locally or at an accessible API URL
- A configured PostgreSQL database on the **separate backend project** (not required inside this frontend repository)

## Repository structure

This README is for the **frontend-only repository**. Its root contains the files originally found in `forge/client/`.

```text
forge-frontend/
├── public/                    # Static assets and images
├── src/
│   ├── api/forgeApi.js        # Axios client and API helpers
│   ├── assets/                # Imported images
│   ├── components/            # Shared application shell and styles
│   ├── data/                  # Local exercise/workout data files
│   ├── pages/                 # Page components and page-specific CSS
│   ├── App.jsx                # Route definitions and entry guard
│   ├── main.jsx               # React app entry point
│   └── index.css              # Global styling
├── .env                       # Local API configuration
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Getting started

### 1. Install dependencies

From this frontend repository root:

```bash
npm install
```

### 2. Configure the API address

Create or update `.env` in this frontend repository:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

The API helper in `src/api/forgeApi.js` uses this variable and defaults to `http://localhost:5000/api` when it is not set. Restart the Vite dev server after changing `.env`.

### 3. Start the separate backend

Start the FORGE backend from **its own repository** and verify that `http://localhost:5000/api/health` responds. PostgreSQL, the database schema, and seed data are configured in the backend repository, not here. If your backend runs on a different host or port, update `VITE_API_URL` accordingly.

### 4. Start the frontend

```bash
npm run dev
```

Open the URL printed by Vite, typically `http://localhost:5173`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite's development server |
| `npm run build` | Generate a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Pages and routes

| Route | Page | Description |
| --- | --- | --- |
| `/start` | Start | Entry screen |
| `/` | Dashboard | Training and nutrition overview |
| `/workouts` | Workouts | Workout history and management |
| `/workouts/session` | Workout Session | Log a workout |
| `/workouts/:id/edit` | Workout Session | Edit an existing workout |
| `/nutrition` | Nutrition | Food entries and nutrition targets |
| `/calendar` | Calendar | Training and recovery calendar |
| `/progress` | Progress | Body measurements and progress history |
| `/library` | Exercise Library | Browse and manage exercises |
| `/profile` | Profile | Personal profile information |
| `/settings` | Settings | Application settings |

The app wraps its main routes in a `RequireEntry` component. It checks `sessionStorage` for the `forge:entered` flag and redirects to `/start` if the flag is absent. **This is an entry-screen gate, not secure user authentication.**

## How frontend and backend communicate

`src/api/forgeApi.js` creates a shared Axios client and exposes functions for exercises, workouts, nutrition entries and goals, progress, rest days, profile, dashboard, and API health. It also converts some workout fields between the backend's `snake_case` responses and the frontend's `camelCase` objects.

The default backend URL is:

```text
http://localhost:5000/api
```

The backend's current CORS setting allows `http://localhost:5173`. If you run the Vite server on another port or host, update the backend CORS configuration accordingly.

## Build for production

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static hosting provider configured to serve `index.html` for client-side routes. Set `VITE_API_URL` to your deployed backend's **public API URL before building**. Your backend must also allow the deployed frontend origin through CORS.

## Notes

- The frontend expects a running backend for persisted data.
- The current project uses one seeded demo account on the backend; it has no full login system.
- Vite environment variables prefixed with `VITE_` are included in client-side code. Never put passwords or secrets in them.
- If API calls fail, verify the backend is running, the database seed has been applied, the `.env` API URL is correct, and backend CORS allows the frontend origin.
- The current frontend package does not define an automated test script.

## Separate backend project

This frontend does not contain the server, database schema, or SQL seed files. Configure and run those in the standalone **FORGE backend repository**. You can deploy the repositories independently; just make sure `VITE_API_URL` points to the correct backend `/api` endpoint and that the backend's CORS configuration permits the frontend URL.