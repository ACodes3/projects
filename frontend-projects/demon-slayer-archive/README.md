# Demon Slayer Archive — Frontend

React/Vite client for exploring the Demon Slayer Archive. This app displays database-backed collections and related detail views using the project's Express API.

[← Project overview](../README.md) · [Backend](../server/README.md) · [Database](../db/README.md)

## Built with

- React 19 and React DOM
- Vite 8
- React Router 7
- Axios for HTTP requests
- Lucide React icons
- Page-level CSS and shared global styles

## Features and routes

| URL | Page |
| --- | --- |
| `/` | Archive landing page and collection overview |
| `/slayers` | Demon Slayer collection |
| `/slayers/:id` | Slayer detail view |
| `/demons` | Demon collection |
| `/demons/:id` | Demon detail view |
| `/breathing` | Breathing Styles collection |
| `/breathing/:id` | Breathing Style details |
| `/blood-arts` | Blood Demon Arts collection |
| `/blood-arts/:id` | Blood Demon Art details |
| `/techniques/:id` | Individual technique details |

Lists and detail views are implemented as separate components in `src/pages/`. Navigation is defined in `src/main.jsx`; the shared application shell resides in `src/App.jsx`.

## Project structure

```text
client/
├── public/
│   ├── images/slayers/        # Slayer art assets
│   ├── images/demons/         # Demon art assets
│   ├── data/                  # JSON files retained in public assets
│   └── favicon.svg
├── src/
│   ├── components/           # Navbar and Footer
│   ├── pages/                # Archive lists and details
│   ├── services/dataService.js
│   ├── utils/dataHelpers.js
│   ├── App.jsx
│   ├── main.jsx              # Client routes
│   └── index.css
├── package.json
└── vite.config.js
```

## Getting started

1. Start the PostgreSQL-backed API using [server setup instructions](../server/README.md).
2. From the `client/` directory:

```bash
npm install
npm run dev
```

Open the address shown by Vite (normally `http://localhost:5173`).

By default `src/services/dataService.js` targets `http://localhost:5000/api`. To change the API address, create `client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after changing environment variables. Also ensure `CLIENT_ORIGIN` on the backend includes your frontend origin.

## Data flow

1. Page components request archive collections or a record by ID from `src/services/dataService.js`.
2. Axios calls the Express API under `/api`.
3. `dataService.js` recursively transforms response property names from `snake_case` into `camelCase` for the React views.
4. Collection helpers request `limit=100`; individual lookups return `null` for HTTP 404.
5. Pages render their loading/error/empty states and related content.

The JSON files under `public/data/` are present in the ZIP, but the checked-in `dataService.js` fetches the live API. Keep the backend running for the current full-stack experience.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview a built site locally |
| `npm run lint` | ESLint analysis |

## Notes

This client is focused on browsing and detail exploration. Administrative create/edit/delete screens are not evidenced in the checked-in frontend; those operations exist on the backend API. Character images included in `public/images/` are third-party fan/franchise imagery and are not covered by ownership claims for original application code.

## Copyright and fan-project disclaimer

Copyright © 2026 ACodes3. All rights reserved in original code and original documentation, to the extent held by the author.

This public repository is intended as a portfolio and educational showcase. Demon Slayer / Kimetsu no Yaiba, its characters, names, lore, and associated imagery belong to their respective rights holders. This is an unofficial fan-made project, not affiliated with or endorsed by those rights holders. Third-party assets and dependencies remain subject to their own rights and licenses.