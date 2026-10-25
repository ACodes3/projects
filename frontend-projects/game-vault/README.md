# Game Vault

**A frontend-only gaming library and launcher UI built with React and Vite.**

Game Vault is a portfolio project exploring the interface of a desktop-style gaming platform in the browser. It brings together a home dashboard, searchable game library, game details, store catalogue, community feed, and simulated launch screens in a cohesive dark-themed application.

> **Project scope:** This is an interactive frontend demonstration, not a functional game launcher or commercial storefront. Games, profile information, achievements, social activity, and store content are sample data. There is no backend, user authentication, payment processing, or real game installation/launching.

## Features

- **Home dashboard:** Featured and recently played game presentation.
- **Game library:** Search games by title, browse the full collection, and view favorites as defined in the sample dataset.
- **Game details:** Explore descriptions, genres, platforms, achievements, playtime, add-ons, updates, and related information.
- **Play page:** Navigate to an individual game and trigger a **simulated** launch overlay.
- **Store:** Browse and search a mock game catalogue with purchase-style UI.
- **Community:** View example player posts and social activity generated from the local game dataset.
- **Navigation:** Dedicated pages using React Router, reusable layout components, and responsive styling.
- **Local data loading:** Axios fetches game records from a static JSON file served by Vite.

Some interface controls are visual placeholders rather than fully implemented functionality. For example, favorites originate in the dataset rather than being persistently toggleable.

## Technology Stack

| Area | Technology |
| --- | --- |
| UI | React 19, JavaScript, CSS |
| Build tooling | Vite 8 |
| Routing | React Router 7 |
| Data requests | Axios |
| Iconography | Lucide React |
| Data source | Static `public/data/games.json` |
| Code quality | ESLint and React Hooks lint rules |

## Getting Started

**Prerequisites:** Node.js and npm compatible with the installed Vite version. Check the supported Node.js version in the [Vite documentation](https://vite.dev/guide/).

From the `game-vault` project directory:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal (typically `http://localhost:5173`).

Additional scripts:

```bash
npm run build    # Production build into dist/
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

No `.env` file, API key, database, or separate backend service is required for the code supplied with this project.

## Application Routes

Defined in `src/main.jsx`:

| Route | Screen |
| --- | --- |
| `/` | Home dashboard |
| `/library` | Game library |
| `/store` | Mock store |
| `/community` | Community demonstration |
| `/play/:gameId` | Individual game page and simulated launch |

## Project Structure

```text
game-vault/
├── public/
│   ├── data/games.json       # Sample game catalogue
│   ├── images/               # Locally bundled imagery
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/           # Navbar, Sidebar, cards, details, footer
│   ├── pages/                # Home, Store, Community, Play screens
│   ├── services/
│   │   └── gameService.js    # Axios-based static JSON fetch
│   ├── assets/               # Frontend assets
│   ├── App.jsx               # Library interface
│   ├── main.jsx              # Route definitions and React root
│   └── index.css             # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Data Flow

The app loads sample records through `getGames()` in `src/services/gameService.js`:

```js
import axios from "axios";

export const getGames = async () => {
  const response = await axios.get("/data/games.json");
  return response.data;
};
```

Vite serves `public/data/games.json` at `/data/games.json`. The library and store filter the resulting data on the client. There is no database or write API: changes to the sample catalogue are made by editing the JSON file.

## Purpose and Limitations

This project demonstrates React component composition, client-side routing, asynchronous data loading, conditional rendering, search/filter state, and detailed UI implementation. It does **not** provide account management, persistent favorites, real purchases, online community interactions, or executable game integration.

Potential future enhancements include persistent user preferences, richer catalogue filtering, accessibility improvements, and integration with a real backend.

## Copyright and Licensing

Copyright © 2026 ACodes3. All rights reserved **for the author's original code and original content**.

Source code is publicly available for portfolio review. Unless explicitly stated otherwise, no general license is granted to copy, modify, redistribute, or commercially exploit the author's original work, except where allowed by applicable law.
Third-party software, icons, images, fonts, trademarks, and other assets remain subject to their respective owners' terms. **The provenance and redistribution rights of bundled image/SVG assets should be reviewed before reuse or commercial distribution.**

The application is a demonstration project and is not affiliated with any real game publisher or storefront.