# Crown of Winter — Backend

**Node.js, Express, PostgreSQL, and Socket.IO backend for the Crown of Winter multiplayer strategy prototype.**

The backend implements server-side sessions, world and character access rules, data persistence, War Table operations, and shared/private chat. This is a **portfolio prototype**, not a production deployment.

> Crown of Winter is an independent, unofficial fan-inspired project, not affiliated with or endorsed by HoYoverse or COGNOSPHERE. This repository does not claim ownership of Genshin Impact intellectual property.

## Technology

- **Node.js** with ECMAScript modules
- **Express** for REST endpoints
- **PostgreSQL** using the `pg` connection pool
- **Socket.IO** for authenticated multiplayer events
- **Cookie-based sessions** and server-side session verification
- **Helmet**, **CORS**, and **CSRF origin protection** as part of the HTTP middleware stack

## Implemented Systems

### Authentication and World Access

- Authentication endpoints with server-managed sessions
- Session validity checks on protected requests and Socket.IO connections
- World membership and character assignments
- Role/permission-aware middleware for protected actions
- World access checks for multiplayer resources

### War Table

- World-specific persisted board pieces and positions
- Server-side move validation and authorization
- Socket.IO broadcasting of board changes to world participants

### Imperial Communications

- Persistent common-world conversations
- One-to-one direct conversations between world characters
- Contact and conversation discovery endpoints
- Last-message history and message creation endpoints
- Server-enforced access checks for private conversation reads and writes
- Recipient-authorized Socket.IO delivery for private messages
- Conversation-specific read positions and unread count endpoints

## Directory Overview

```text
server/
├── app.js                    # Express setup, middleware, routes
├── server.js                 # HTTP + Socket.IO entry point
└── src/
    ├── controllers/         # API request handlers
    ├── db/                  # PostgreSQL pool
    ├── middleware/          # Authentication, authorization, CSRF
    ├── routes/              # Express route modules
    └── services/            # Supporting server-side services

db/
├── schema.sql               # Baseline database schema (repository-level)
├── seed.sql                 # Development data (if applicable)
└── migrations/              # Incremental schema changes
```

Check the repository for exact filenames and available migrations.

## Local Development

### Requirements

- Node.js and npm
- PostgreSQL database
- Applied baseline schema and relevant database migrations
- Appropriate development users, worlds, membership, and character assignments to test multiplayer flows

From the repository root:

```bash
cd server
npm install
npm run dev
```

The development API normally runs at **http://localhost:5000**. Verify that `npm run dev` is defined in your current `server/package.json`.

### Environment Variables

Configure the backend environment locally (for example with `server/.env`). The following names are used by the server and PostgreSQL pool code:

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crown-of-winter
DB_USER=your_local_database_user
DB_PASSWORD=your_local_database_password
```

Additional environment variables may be required by other modules; review the current code before starting from a fresh clone. Do not publish real credentials, session tokens, production URLs, or `.env` files.

### Database Setup

1. Create a PostgreSQL database.
2. Apply the repository's baseline schema.
3. Apply subsequent migrations **in order**, including the Imperial Communications and conversation migrations.
4. Add suitable local development records/seed data as documented in the repository.
5. Start the backend after the database is available.

**Do not run baseline schema or migrations indiscriminately against a populated database.** Migrations should be applied once, in the correct order.

### Health Check

```http
GET /api/health
```

Example local URL: `http://localhost:5000/api/health`.

## API Overview

All paths below are under `/api`. Unless otherwise noted, world-scoped endpoints require a valid session and active world/character access.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/worlds/:worldId/chat/conversations` | List accessible conversations |
| GET | `/worlds/:worldId/chat/contacts` | List possible direct-message contacts |
| POST | `/worlds/:worldId/chat/conversations` | Create or reopen private correspondence |
| GET | `/worlds/:worldId/chat/conversations/:conversationId/messages` | Get selected conversation history |
| POST | `/worlds/:worldId/chat/conversations/:conversationId/messages` | Send a message to selected conversation |
| GET | `/worlds/:worldId/chat/unread` | Get unread counts |
| POST | `/worlds/:worldId/chat/conversations/:conversationId/read` | Mark conversation as read |

Additional route modules provide authentication, worlds, characters, invitations, permissions, auditing, and War Table actions. See `src/routes/` for the exact endpoint definitions and request bodies.

## Socket.IO

The server shares one HTTP server between Express and Socket.IO. Socket connections are authenticated through the existing session cookie and must join an authorized world before receiving world-scoped updates.

Relevant chat events include:

- `chat:message-created` — legacy common-world message notification
- `chat:conversation-message-created` — conversation-aware event, including authorized private recipients
- `world:access-revoked` — access revocation notification

Private correspondence must **not** be broadcast to the unrestricted world room: recipients are validated individually against the active session, character assignment, and conversation participation.

## Security Model

- Cookies identify server-side sessions; protected operations must be authorized on the server.
- World membership and character assignment determine access to world-specific resources.
- Direct conversations are only readable or writable by authorized participants (subject to the implemented controller and broadcast checks).
- Messages are persisted in PostgreSQL before server-side broadcast.
- Cross-origin requests use the configured `CLIENT_URL`; state-changing HTTP requests include origin checks.
- SQL uses parameterized queries rather than string interpolation for user inputs.

Security work remains subject to further review and testing; the prototype should not be treated as production-hardened without an audit.

## Current Limitations

This project does not yet implement every planned game mechanic, administration workflow, or production operational feature. For deployment, additional work would be required around configuration management, automated testing, monitoring, backups, rate limiting, and production security review.

## Copyright

Copyright © 2026 ACodes3. All rights reserved.

The original backend source code, original schema design, and original software implementation are shared for **portfolio review**, not under a general open-source reuse license. No permission is granted to reproduce, modify, redistribute, sublicense, or commercially reuse the author's original work except as separately authorized or permitted by law.

This notice applies only to material for which the author holds the relevant rights. Third-party packages and intellectual property retain their own licenses and rights, and GitHub platform terms still apply.

---

For the overall project overview, see the repository root `README.md`. For the React client, see `client/README.md`.