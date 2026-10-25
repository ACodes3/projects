# Crown of Winter — Frontend

**React + Vite client for the Crown of Winter multiplayer strategy prototype.**

This frontend provides the Winter Palace interface, account and world navigation, character-aware pages, a synchronized War Table, and Imperial Communications. It is part of an **unfinished portfolio prototype**, not a released game.

> Crown of Winter is an unofficial, non-commercial fan-inspired project and is not affiliated with or endorsed by HoYoverse or COGNOSPHERE. Genshin Impact characters, names, settings, and official assets remain the property of their respective rights holders.

## Technology

- **React** with JavaScript/JSX
- **Vite** for development and frontend builds
- **React Router** for client-side navigation
- **CSS** for the Winter Palace visual design
- **Lucide React** for interface icons
- **Socket.IO Client** for live multiplayer updates
- **Fetch-based API utilities** for backend requests

## Features Implemented

### World and Character Experience

- Login and authenticated application navigation
- World selection and world-specific routes
- Active character identity and role-aware presentation
- Sidebar pages including Imperial Command, The Tsaritsa, Palace, War Table, Harbingers, Intelligence, Project: Gnoses, and Relic Vault
- Some application sections are placeholders or still in development

### War Table

- Interactive board with movable pieces
- Board state retrieved and persisted through the server
- Socket.IO synchronization of updates between connected players
- Server-authorized actions; client controls alone are not a security boundary

### Imperial Communications

- Common **Imperial Alliance** conversation for a world
- Separate private correspondence between characters
- Searchable conversation list and player/contact selection
- Character names, message bubbles, and message history
- Live Socket.IO message delivery
- Unread-conversation badges and persisted read status via the backend

## Project Structure

```text
client/
├── src/
│   ├── components/
│   │   └── chat/              # Conversation list and message UI
│   ├── context/              # World access/character context
│   ├── layouts/              # AppShell and application navigation
│   ├── pages/                # Route-specific screens
│   └── services/             # API client and Socket.IO client
└── ...                       # Vite configuration and project files
```

This is a conceptual overview; check the repository for the exact current tree.

## Running Locally

### Prerequisites

- Node.js and npm
- The Crown of Winter backend running and connected to PostgreSQL
- A valid account and available world/character assignment in the development database

From the repository root:

```bash
cd client
npm install
npm run dev
```

The development client normally runs at **http://localhost:5173**.

### Connecting to the API

The Socket.IO client uses the Vite environment variable `VITE_API_URL` when set and otherwise defaults to **http://localhost:5000** as its server origin. If you configure it, supply the correct backend API URL, for example:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Keep the frontend URL consistent with the backend's `CLIENT_URL` setting. The project uses cookie-based authentication; API and socket requests must support credentials.

**Never put database credentials or private server secrets in `VITE_*` variables:** Vite exposes these values to client-side code.

## Architecture Notes

- React renders the UI and coordinates authenticated API calls.
- Server-issued cookies are used for sessions rather than storing the session token in frontend source code.
- `AppShell` maintains the shared Socket.IO connection used across world pages.
- The War Table and chat subscribe to relevant events while the Express backend validates permissions.
- The backend is the source of truth for world access, persisted messages, and board changes.

## Project Status and Limitations

This is a **portfolio prototype**. Core frontend flows for world navigation, multiplayer War Table updates, and communications have been developed, but gameplay systems and several sections remain incomplete. It has not been presented as a production-ready game or service.

## Copyright

Copyright © 2026 ACodes3. All rights reserved.

The author's **original frontend source code and original implementation** are publicly displayed for portfolio review. No general permission is granted to copy, modify, redistribute, sublicense, or commercially reuse the original code, except as permitted by applicable law or separately authorized.

This notice does **not** claim ownership of Genshin Impact, its characters, artwork, names, or other third-party materials. Third-party dependencies and assets retain their own applicable licenses and rights. Public GitHub hosting is also subject to GitHub's platform terms.

---

For the complete project overview, see the repository root `README.md`. For REST API, authorization, Socket.IO server details, and PostgreSQL setup, see `server/README.md`.