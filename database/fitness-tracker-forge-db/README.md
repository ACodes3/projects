# FORGE — Database

This directory contains the **PostgreSQL database schema and development seed** for the FORGE Training & Nutrition full-stack application.

## Files

| File | Purpose |
| --- | --- |
| `schema.sql` | Creates the application tables, foreign-key relationships, checks and indexes in the `public` schema |
| `seed.sql` | Creates or updates the single development user and sample training/nutrition data |

## Requirements

- PostgreSQL and a SQL client (`psql`, pgAdmin or DataGrip)
- A database role able to create tables and indexes

## Setup

From the repository root:

```bash
psql -U postgres -c "CREATE DATABASE forge;"
psql -U postgres -d forge -f db/schema.sql
psql -U postgres -d forge -f db/seed.sql
```

Use your own PostgreSQL username and database name if different. When using a GUI, connect to your target database and execute `schema.sql` **before** `seed.sql`.

**Important:** These are initialization scripts, not a repeatable migration framework. Do not rerun `schema.sql` against an initialized database expecting it to be idempotent. `seed.sql` deliberately **deletes existing seeded-user activity records** for rest days, progress, nutrition and workouts before recreating demo records. Back up data you want to keep.

## Table overview

| Table | Responsibility |
| --- | --- |
| `users` | User identity record; the current API uses one seeded demo user |
| `profiles` | One profile per user, including training focus and height |
| `nutrition_goals` | One set of calorie and macronutrient targets per user |
| `exercises` | Exercise definitions and training metadata |
| `workouts` | Workout-level history and dates |
| `workout_exercises` | Exercises included in workouts, with an exercise-name snapshot and ordering |
| `workout_sets` | Logged workout sets, including repetitions, time and optional weight |
| `nutrition_entries` | Food/meal logs and nutrient amounts |
| `progress_entries` | Logged body measurements and progress |
| `rest_days` | Planned or recorded recovery days |

### Relationship outline

```text
users
  ├── profiles (1:1)
  ├── nutrition_goals (1:1)
  ├── workouts (1:many)
  │     └── workout_exercises (1:many)
  │             └── workout_sets (1:many)
  ├── nutrition_entries (1:many)
  ├── progress_entries (1:many)
  └── rest_days (1:many)

exercises -> workout_exercises (exercise reference)
```

The schema uses PostgreSQL numeric types, timestamps with time zones, foreign keys, check constraints and indexes for common access patterns (including user/date lookups and workout detail retrieval). Historic workout exercise names are retained as snapshots so past records remain understandable.

## Seed data and single-user design

The backend's `singleUser` middleware looks up `demo@forge.local`. This row must exist for user-scoped API routes to work. The seed also provides a demo profile, goals, exercise library, workouts and other sample records.

The seeded `password_hash` is a **development placeholder**, not a working credential. This application has **no authentication flow**; a row in `users` does not imply secure account management.

## Quick checks

```sql
SELECT COUNT(*) AS users FROM public.users;
SELECT COUNT(*) AS exercises FROM public.exercises;
SELECT COUNT(*) AS workouts FROM public.workouts;
SELECT COUNT(*) AS nutrition_entries FROM public.nutrition_entries;
SELECT COUNT(*) AS progress_entries FROM public.progress_entries;
SELECT COUNT(*) AS rest_days FROM public.rest_days;
```

Run these against the same database configured by `server/.env`.

## Safety and maintenance

- Do not commit real personal data, database dumps containing sensitive records, or `.env` passwords.
- Always back up a populated database before using the seed or modifying the schema.
- This schema is designed for the current local demo, not production multi-user isolation.
- Database code accesses user-specific records through the server's user context. Production use would require real authentication and authorization.

## Related documentation

- [Project README](../README.md)
- [Backend README](../server/README.md)

## Copyright

Copyright © 2026 **ACodes3**. All rights reserved in the original SQL and documentation owned by the copyright holder. No general reuse license is granted for that original work; third-party rights remain unaffected. Refer to the root `LICENSE` and `COPYRIGHT.md` where provided.