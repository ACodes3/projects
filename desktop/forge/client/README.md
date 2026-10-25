
# FORGE Desktop — React Frontend

This folder contains the renderer UI for **FORGE — Offline Training & Nutrition Tracker**. It is built with **React 19**, **Vite 8**, React Router, Axios and Lucide icons. In the desktop edition, Electron loads its built output and a local Express server provides persistent data from SQLite.

## Screens and routes

| Route | Feature |
| --- | --- |
| `/start` | Entry screen |
| `/` | Dashboard |
| `/workouts` | Workout list |
| `/workouts/session` | Session recording |
| `/workouts/:id/edit` | Edit workout |
| `/nutrition` | Food and macro tracking |
| `/calendar` | Training and recovery calendar |
| `/progress` | Measurements and progress |
| `/library` | Exercise catalog |
| `/profile` | Personal profile |
| `/settings` | Settings, including desktop backup interactions |

The route guard uses `sessionStorage` (`forge:entered`) only to manage the entry experience. **It is not an authentication boundary.**

## Structure

```text
client/
├── public/                    # Images, favicon, other public assets
├── src/
│   ├── api/forgeApi.js        # Axios API helper + data mappers
│   ├── components/AppShell.jsx
│   ├── pages/                 # Page components and CSS
│   ├── App.jsx                # Router and entry guard
│   └── main.jsx
├── vite.config.js
└── package.json
```

## Local development

From `client/`:

```powershell
npm install
npm run dev
```

The default API base URL in `src/api/forgeApi.js` is `http://localhost:5000/api`, overridden at build/dev time using `VITE_API_URL`. Start the SQLite backend in a separate terminal after creating its development database (see [server README](../server/README.md)).

```dotenv
VITE_API_URL=http://localhost:5000/api
```

For the actual desktop app, build the client **before** running Electron:

```powershell
npm run build
cd ../electron
npm start
```

Electron reads the built frontend from `client/dist/` in development and packs it under `resources/client/dist/` for installed builds.

## npm scripts

| Command | Meaning |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Produce `client/dist/` |
| `npm run preview` | Preview compiled frontend |
| `npm run lint` | ESLint checks |

## Integration details

- `forgeApi.js` translates selected snake_case response fields into camelCase UI objects.
- The API is local; it serves workouts, exercises, nutrition, profile, progress, rest days and dashboard data.
- Backup and restore actions use the restricted `window.forgeDesktop` preload bridge **when running inside Electron**, not direct filesystem access from React.
- The UI expects a working local backend to display saved records.

## Known boundaries

This frontend is not a standalone database-backed app without the server, and its entry-screen flag is not a login. Do not expose the development server as if it were a secure hosted multi-user product. Third-party visual assets, if any, retain their own rights.

## Copyright and license

Copyright © 2026 ACodes3. All rights reserved in the author's original code and documentation.

Public source availability is for portfolio review; no general license to reuse or redistribute the original code is granted unless separately authorized.

Third-party dependencies and assets retain their own rights and license terms. See the repository's `LICENSE` and `COPYRIGHT.md` for the project's full notices.
