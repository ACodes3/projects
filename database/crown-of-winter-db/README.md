# Crown of Winter — Database

**PostgreSQL data layer for the Crown of Winter multiplayer strategy prototype.**

This directory contains the foundational relational schema, development reference data, database-level protections, and incremental migrations. The database supports accounts, sessions, multiplayer worlds, character assignments, permissions, the War Table, and Imperial Communications.

> Crown of Winter is an unofficial, noncommercial fan-inspired portfolio project. Genshin Impact characters, names, and lore belong to their respective rights holders. Copyright notices in this repository concern the author's original code and database design, not the source franchise.

## Technology

- PostgreSQL **15+** (as specified by the baseline schema)
- SQL tables, foreign keys, unique and check constraints, and indexes
- PostgreSQL transactions and migrations
- Database triggers for selected integrity protections
- UUID identifiers and `TIMESTAMPTZ` timestamps

## Directory Structure

```text
db/
├── README.md                  # This file
├── schema.sql                 # Original baseline schema
├── seed.sql                   # Reference characters, roles, permissions
├── protect_sovereign.sql      # Sovereign-role protection triggers
└── migrations/
    ├── 001_imperial_chat.sql  # Chat messages/read-state migration (if named this way locally)
    └── 002_chat_conversations.sql # Conversation model and data migration
```

**Note:** The baseline `schema.sql` is an early snapshot, not a complete export of the current live database. Later War Table and chat tables were developed separately. The filenames and availability of earlier migrations should be checked against this repository before attempting a fresh installation. A complete fresh-install migration sequence has not yet been verified.

## Core Data Model

| Area | Tables | Purpose |
| --- | --- | --- |
| Accounts | `users`, `user_sessions` | User identities and authenticated sessions |
| Multiplayer worlds | `worlds`, `world_members` | Worlds and world-specific membership |
| Characters | `characters`, `world_characters`, `character_assignments` | Character definitions, per-world instances, and player assignments |
| Authorization | `roles`, `permissions`, `role_permissions`, `world_character_roles` | Role-based access controls |
| Auditing | `audit_logs` | Security and administrative activity records |
| War Table | `war_board_pieces` | Persisted world board pieces and positions |
| Messaging | `chat_messages`, `chat_conversations`, `chat_conversation_participants` | World and one-to-one correspondence |
| Read tracking | `chat_read_states`, `chat_conversation_read_states` | Legacy world-chat and conversation-specific read positions |

The application enforces permissions and access checks in its Express backend. Database constraints provide additional integrity guarantees but **do not replace server-side authorization**.

## Schema and Relationships

### Worlds and Characters

A world contains members and world-specific character instances. Active character assignments connect members to the characters they control. World-scoped foreign keys and uniqueness constraints help prevent inconsistent assignments.

### Roles and Permissions

Roles are assigned to world characters and mapped to permissions. `protect_sovereign.sql` defines database-side triggers intended to protect the Sovereign role from unauthorized modification. Application middleware separately validates what authenticated users are allowed to do.

### War Table

`war_board_pieces` stores board state for a world, including region and grid positions. Moves are validated by the backend and persisted before clients receive Socket.IO updates.

### Imperial Communications

The messaging schema distinguishes two conversation types:

- **`world`** — a common channel for all authorized members of a world.
- **`direct`** — a unique pair of world characters, with explicit participant records.

Each message belongs to exactly one conversation through `chat_messages.conversation_id`. The schema enforces one world conversation per world and prevents duplicate direct conversations for the same character pair.

`chat_conversation_read_states` stores each member's last-read timestamp for each conversation. Unread counts are calculated by excluding the current user's own messages. The older `chat_read_states` table is retained for compatibility with the migration path.

## Local Setup

### Prerequisites

- PostgreSQL 15 or newer
- A PostgreSQL client such as `psql` or DataGrip
- The Crown of Winter backend's database connection settings

### 1. Create a Local Database

```sql
CREATE DATABASE "crown-of-winter";
```

### 2. Apply the Baseline Schema

On an **empty database**, run `schema.sql`, followed by `seed.sql`.

Example from the repository root:

```bash
psql -U postgres -d crown-of-winter -f db/schema.sql
psql -U postgres -d crown-of-winter -f db/seed.sql
```

**Important:** This does **not** by itself recreate the complete current database. Apply any intervening schema changes (including War Table and original chat tables), then the later conversation migration in the actual development order.

### 3. Apply Migrations in Order

The conversation migration `002_chat_conversations.sql` requires the earlier `chat_messages` and `chat_read_states` tables. It must **not** be run directly against only the baseline schema.

Run each migration **once** and confirm its prerequisites. Migration 002 wraps its changes in a transaction, creates a common conversation for existing worlds, and links previously saved chat messages to that conversation.

If your repository lacks an earlier migration, reconstruct or export that schema change before documenting the database as reproducible from scratch. Do not rerun `schema.sql` against an existing populated database.

### 4. Configure the Backend

The database is accessed by the Express backend through a PostgreSQL connection pool. Check `server/README.md` for the environment variables and server startup steps. Never commit real database credentials or `.env` files.

## Example Verification Queries

Run these against a database where the corresponding migrations have been applied.

**Inspect tables:**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Count common and direct conversations:**

```sql
SELECT kind, COUNT(*) AS conversations
FROM chat_conversations
GROUP BY kind
ORDER BY kind;
```

**Confirm all messages are associated with conversations:**

```sql
SELECT COUNT(*) AS total_messages,
       COUNT(conversation_id) AS linked_messages
FROM chat_messages;
```

The two message counts should match.

## Data and Security Notes

- `seed.sql` contains **reference data**, not production users or account passwords.
- Do not commit development database dumps containing sessions, tokens, email addresses, or private messages.
- Use parameterized queries from the backend; never build SQL from untrusted strings.
- Back up existing data before modifying the schema or running a migration.
- Treat PostgreSQL constraints and triggers as integrity controls, not as complete authorization rules.
- The repository is a portfolio prototype and has not been presented as a production-ready database deployment.

## Current Scope and Limitations

The schema implements the foundational multiplayer model plus selected interactive features. Additional game systems are not yet implemented. The baseline schema predates some later features, so the database directory should be reviewed and consolidated before claiming one-command installation or production readiness.

## Copyright

Copyright © 2026 ACodes3. All rights reserved.

The author's **original SQL, schema design, migrations, and documentation** are published for portfolio review, without granting a general license to copy, modify, redistribute, sublicense, or commercially reuse them, except where permitted by law. Third-party material retains its respective ownership and terms.

---

See the root `README.md` for the project overview and `server/README.md` for the backend API and configuration.