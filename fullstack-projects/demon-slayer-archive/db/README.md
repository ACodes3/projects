# Demon Slayer Archive — Database

PostgreSQL data layer for the Demon Slayer Archive API. The schema models five related archive categories and uses PostgreSQL `TEXT[]` and `JSONB` fields for lists, combat statistics, and visual themes.

[← Project overview](../README.md) · [Frontend](../client/README.md) · [Backend](../server/README.md)

## Files

| File | Purpose |
| --- | --- |
| `schema.sql` | Development database schema (`CREATE TABLE IF NOT EXISTS`) |
| `seed.sql` | Curated sample content, inserted/upserted by ID |
| `test-schema.sql` | Schema initialization for an isolated test database |

## Tables and relationships

| Table | Key fields / purpose |
| --- | --- |
| `slayers` | Slayer names, ranks, breathing style IDs, technique IDs, related characters, stats, image |
| `demons` | Demon names, ranks, Blood Demon Art IDs, ability IDs, related characters, stats, image |
| `breathing_styles` | Styles, derived-from style, user IDs, technique IDs, theme and image |
| `blood_demon_arts` | Arts, linked demon (`user_id`), ability IDs, theme and image |
| `techniques` | Technique category (`breathing` or `blood-demon-art`), parent ID and user IDs |

Each table uses a human-readable `TEXT` primary key, such as `tanjiro-kamado`. Collections of related IDs are often stored as `TEXT[]` rather than separate join tables. Two relationships are implemented with actual foreign keys: `breathing_styles.derived_from_id` and `blood_demon_arts.user_id`. These are declared `DEFERRABLE INITIALLY DEFERRED`. Other cross-collection references are validated by backend application logic, not all by database foreign keys.

`slayers.stats` and `demons.stats` use `JSONB`, as do `breathing_styles.theme` and `blood_demon_arts.theme`. The `techniques.category` column has a database-level check constraint.

## Setup (development database)

Ensure PostgreSQL is running. Create a database with your preferred SQL tool:

```sql
CREATE DATABASE demon_slayer_archive;
```

From the project root:

```bash
psql -U postgres -d demon_slayer_archive -f db/schema.sql
psql -U postgres -d demon_slayer_archive -f db/seed.sql
```

You may instead execute the files against the selected database in DataGrip or another PostgreSQL SQL editor. Run `schema.sql` before `seed.sql`.

**Seed behavior:** `seed.sql` uses `INSERT ... ON CONFLICT (id) DO UPDATE`. Re-running it may overwrite changes in existing records that share IDs. The included sample is not the complete fictional universe. Some associated image paths may not have a matching local asset.

## Isolated tests

Tests must not share the development database. Create the specifically named database required by `server/tests/setup.js`:

```sql
CREATE DATABASE demon_slayer_archive_test;
```

Initialize it:

```bash
psql -U postgres -d demon_slayer_archive_test -f db/test-schema.sql
```

Set `TEST_DB_NAME=demon_slayer_archive_test` in `server/.env`. The test code confirms the active DB name and rejects tests pointed at the normal database. Then run `npm run test-two` in `server/`.

## Useful verification queries

```sql
-- Confirm tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check archive coverage
SELECT 'slayers' AS collection, COUNT(*) AS records FROM slayers
UNION ALL SELECT 'demons', COUNT(*) FROM demons
UNION ALL SELECT 'breathing_styles', COUNT(*) FROM breathing_styles
UNION ALL SELECT 'blood_demon_arts', COUNT(*) FROM blood_demon_arts
UNION ALL SELECT 'techniques', COUNT(*) FROM techniques;

-- Inspect one character
SELECT id, name, rank, stats FROM slayers WHERE id = 'tanjiro-kamado';
```

## Data design notes

- Some IDs reference records in another collection through arrays rather than enforced foreign keys. The API validates relationship integrity for writes, but direct SQL changes can bypass those checks.
- `techniques.parent_id` identifies a style or art in application logic; there is no single SQL foreign key across both possible parent tables.
- The SQL files are intended as initial schema/seed scripts, not a versioned migration framework.
- Character rankings and combat statistics in the dataset are project-specific illustrative values, not official rankings.

## Copyright and fan-project disclaimer

Copyright © 2026 ACodes3. All rights reserved in original code and original documentation, to the extent held by the author.

This public repository is intended as a portfolio and educational showcase. Demon Slayer / Kimetsu no Yaiba, its characters, names, lore, and associated imagery belong to their respective rights holders. This is an unofficial fan-made project, not affiliated with or endorsed by those rights holders. Third-party assets and dependencies remain subject to their own rights and licenses.

