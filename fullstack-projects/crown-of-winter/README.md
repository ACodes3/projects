# Crown of Winter

**A full-stack, multiplayer strategy-game prototype inspired by the world of Genshin Impact.**

Crown of Winter is an independent portfolio project exploring the architecture of a character-driven multiplayer application. It combines account and session management, world-specific character assignments, a role-aware backend, an interactive War Table, and real-time communications in a unified Winter Palace interface.

The project is a **technical prototype and work in progress**, not a complete or officially released game. Its purpose is to demonstrate full-stack engineering, relational data modeling, authorization, and real-time application development.

> **Unofficial fan project:** Crown of Winter is not affiliated with, sponsored by, or endorsed by HoYoverse or COGNOSPHERE. Genshin Impact and associated characters, names, settings, artwork, and other third-party intellectual property belong to their respective rights holders.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, JavaScript/JSX, Vite, React Router |
| Styling and icons | CSS, Lucide React |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Real-time communication | Socket.IO |
| Authentication | Server-side sessions with HTTP cookies |

## Implemented Features

### Accounts, Worlds, and Characters

- Account authentication and session management.
- World selection and world-specific membership.
- Character assignments tied to world membership.
- Role-aware authorization and character identity throughout the application.
- Server-side access checks for protected world resources.

### War Table

- Interactive board with draggable pieces.
- PostgreSQL-backed world-specific board state.
- Real-time synchronization between connected players using Socket.IO.
- Server-side validation and authorization for board operations.

### Imperial Communications

- A shared **Imperial Alliance** conversation for players in the same world.
- Separate one-to-one private correspondences between characters.
- Conversation selection and contact discovery.
- Persistent message history in PostgreSQL.
- Real-time message delivery through Socket.IO.
- Server-side private-conversation access checks and recipient-aware delivery.
- Conversation unread indicators and persisted read positions.

### Interface

- Winter Palace visual theme with dark navy and icy-blue styling.
- Sidebar navigation and character-aware application header.
- Integrated messaging popup with conversation search and notifications.
- Dedicated application sections for the Palace, Harbingers, Intelligence, Project: Gnoses, Relic Vault, and related areas. Some sections are exploratory or incomplete.

## Architecture Overview

```text
client/                      React + Vite frontend
    |
    | REST API + Socket.IO
    v
server/                      Express application and Socket.IO server
    |
    | SQL queries and authorization
    v
PostgreSQL                   Users, sessions, worlds, characters,
                             War Table state, conversations, messages
```

**REST** handles authentication, world data, conversation history, and message creation. **Socket.IO** distributes relevant real-time updates to connected clients. The backend enforces permissions rather than relying on frontend visibility alone.

## Repository Structure

```text
client/
  src/
    components/
      chat/                  Conversation list and message components
    context/                World access state
    layouts/                Shared AppShell and navigation
    pages/                  Application views
    services/               API and Socket.IO clients

server/
  src/
    controllers/            REST request handlers
    db/                     Database connection
    middleware/             Authentication and authorization
    routes/                 API routes
    services/               Server-side services
  app.js                    Express application
  server.js                 HTTP and Socket.IO server

db/
  migrations/               Database schema changes
```

> Folder names reflect the development structure; refer to the repository itself for the authoritative file layout.

## Running Locally

**Requirements:** Node.js, npm, and PostgreSQL. The database schema backup targets PostgreSQL 15 or newer.

1. Clone this repository.
2. Create a local PostgreSQL database (for example, `crown-of-winter`).
3. Apply the database schema and migrations in the order documented in `db/`. Use appropriate seed data for your local development environment.
4. Configure the backend's environment variables and database connection. Do **not** commit credentials or session secrets.
5. Install dependencies and start the backend:

   ```bash
   cd server
   npm install
   npm run dev
   ```

6. In a separate terminal, install dependencies and start the frontend:

   ```bash
   cd client
   npm install
   npm run dev
   ```

In the local development configuration used for this project, the backend runs on `http://localhost:5000` and the Vite frontend on `http://localhost:5173`.

**Note:** Confirm the available npm scripts in each `package.json` and the required environment-variable names before running. The application requires a configured PostgreSQL database and suitable world/character seed data; a fresh clone may not be immediately usable without these steps.

## Project Status

**Portfolio prototype — active development milestone.**

The core authentication, world authorization, War Table synchronization, and Imperial Communications workflows have been implemented. The project is intentionally not presented as a finished strategy game. Some navigation sections, gameplay mechanics, administrative workflows, deployment configuration, and production hardening remain incomplete.

This repository documents practical engineering work rather than a production-ready service.

## Engineering Focus

This project was built to practice and demonstrate:

- Designing REST endpoints and permission boundaries for multi-user applications.
- Modeling users, memberships, character identities, and chat conversations in a relational database.
- Synchronizing client state across browser sessions.
- Combining persisted data with real-time events.
- Managing incremental database migrations as features evolve.
- Organizing a React frontend and Express backend into maintainable modules.

## Copyright and Intellectual Property

**Copyright © 2026 ACodes3. All rights reserved.**

The original source code and original software implementation authored for this project are presented publicly for portfolio review. Unless separately authorized or permitted by applicable law, no license is granted to reproduce, modify, redistribute, sublicense, or commercially reuse that original code.

A public repository is not, by itself, an open-source license. GitHub platform permissions and any applicable third-party software licenses still apply.

**Third-party intellectual property:** Crown of Winter is an unofficial, non-commercial fan-inspired project. Genshin Impact and associated characters, names, lore, artwork, and other protected material are owned by their respective rights holders. This repository's copyright notice covers only original material for which the author holds the relevant rights; it does not claim ownership of the Genshin Impact universe or third-party assets.

Third-party packages, icons, fonts, and other dependencies remain under their own licenses. Any assets included in a public repository should be reviewed for redistribution rights.

---

*Crown of Winter — a portfolio study in full-stack systems and multiplayer communication.*