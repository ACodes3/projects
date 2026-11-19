/// Non-destructive upgrade from schema version 1, applied within Drift's
/// upgrade transaction. Existing sets/foods/diary/history remain intact.
const schemaV2 = <String>[
  '''CREATE TABLE saved_meals (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  )''',
  '''CREATE TABLE saved_meal_items (
    id TEXT PRIMARY KEY NOT NULL,
    saved_meal_id TEXT NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
    food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    grams REAL NOT NULL CHECK(grams > 0),
    kcal REAL, protein REAL, carbs REAL, fat REAL
  )''',
  '''CREATE TABLE nutrition_goals (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL DEFAULT 'Custom targets',
    kcal REAL, protein REAL, carbs REAL, fat REAL,
    created_at TEXT NOT NULL
  )''',
  '''CREATE TABLE local_notifications (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    time_of_day TEXT,
    consented_at TEXT
  )''',
  '''ALTER TABLE session_sets ADD COLUMN kind TEXT NOT NULL DEFAULT 'working' ''',
  '''ALTER TABLE session_sets ADD COLUMN rpe REAL''',
  '''ALTER TABLE session_sets ADD COLUMN rir REAL''',
  '''ALTER TABLE cardio_entries ADD COLUMN session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL''',
  '''ALTER TABLE hydration_entries ADD COLUMN beverage TEXT NOT NULL DEFAULT 'Water' ''',
  '''ALTER TABLE foods ADD COLUMN serving_grams REAL''',
  '''ALTER TABLE foods ADD COLUMN source_version TEXT''',
  '''ALTER TABLE programs ADD COLUMN version INTEGER NOT NULL DEFAULT 1''',
  'CREATE INDEX ix_saved_meal_items ON saved_meal_items(saved_meal_id)',
];
