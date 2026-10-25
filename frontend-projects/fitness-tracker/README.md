# FORGE — Frontend

**FORGE Training & Nutrition** is a web-based fitness tracker for recording workouts, managing an exercise library, tracking meals and nutrition goals, reviewing progress, and planning training and recovery. This folder contains the React frontend; data is served by the separate FORGE backend API.

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
- A configured PostgreSQL database for the backend (see the backend README)

## Project structure

```text
forge-full-stack/client/
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
└── package.json
```

## Getting started

### 1. Install dependencies

From the project root:

```bash
cd client
npm install
```

### 2. Configure the API address

Create or update `client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

The API helper in `src/api/forgeApi.js` uses this variable and defaults to `http://localhost:5000/api` when it is not set. Restart the Vite dev server after changing `.env`.

### 3. Start the backend

In another terminal, start the FORGE backend and make sure `http://localhost:5000/api/health` responds. The backend must be configured with PostgreSQL and its database scripts first.

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

## Related documentation

See `../server/README.md` for backend setup, the database scripts, and the available API endpoints.

## Copyright and license

Copyright © 2026 **ACodes3**. All rights reserved in original work owned by the copyright holder. This source is shared for portfolio review, not as an open-source grant. Third-party dependencies and assets keep their own licenses. See the root `LICENSE` and `COPYRIGHT.md` if included.