/// Version 1 schema for this NEW standalone app. This is NOT an in-place
/// migration from a prior KINETIQ repository/database.
const schemaV1 = <String>[
  '''CREATE TABLE preferences (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )''',
  '''CREATE TABLE exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'strength',
    muscle_group TEXT NOT NULL DEFAULT 'Full body',
    equipment TEXT NOT NULL DEFAULT 'Bodyweight',
    tracking_mode TEXT NOT NULL DEFAULT 'weight_reps',
    custom INTEGER NOT NULL DEFAULT 0,
    favorite INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0
  )''',
  '''CREATE TABLE routines (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    favorite INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )''',
  '''CREATE TABLE routine_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    tracking_mode TEXT NOT NULL,
    position INTEGER NOT NULL,
    target_sets INTEGER NOT NULL DEFAULT 3,
    target_reps INTEGER,
    target_weight_kg REAL,
    rest_seconds INTEGER NOT NULL DEFAULT 90,
    notes TEXT NOT NULL DEFAULT ''
  )''',
  '''CREATE TABLE sessions (
    id TEXT PRIMARY KEY NOT NULL,
    routine_id TEXT REFERENCES routines(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'discarded')),
    started_at TEXT NOT NULL,
    finished_at TEXT,
    notes TEXT NOT NULL DEFAULT ''
  )''',
  '''CREATE TABLE session_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    source_exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    tracking_mode TEXT NOT NULL,
    position INTEGER NOT NULL,
    rest_seconds INTEGER NOT NULL DEFAULT 90,
    notes TEXT NOT NULL DEFAULT ''
  )''',
  '''CREATE TABLE session_sets (
    id TEXT PRIMARY KEY NOT NULL,
    session_exercise_id TEXT NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    weight_kg REAL,
    reps INTEGER,
    duration_seconds INTEGER,
    distance_meters REAL,
    completed INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT ''
  )''',
  '''CREATE TABLE cardio_entries (
    id TEXT PRIMARY KEY NOT NULL,
    activity TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    distance_meters REAL,
    occurred_at TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT ''
  )''',
  '''CREATE TABLE foods (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT '',
    kcal_100g REAL,
    protein_100g REAL,
    carbs_100g REAL,
    fat_100g REAL,
    source TEXT NOT NULL DEFAULT 'user',
    favorite INTEGER NOT NULL DEFAULT 0
  )''',
  '''CREATE TABLE meal_entries (
    id TEXT PRIMARY KEY NOT NULL,
    food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    grams REAL NOT NULL,
    kcal REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    occurred_at TEXT NOT NULL
  )''',
  '''CREATE TABLE hydration_entries (
    id TEXT PRIMARY KEY NOT NULL,
    volume_ml INTEGER NOT NULL,
    occurred_at TEXT NOT NULL
  )''',
  '''CREATE TABLE programs (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    goal TEXT NOT NULL DEFAULT '',
    weeks INTEGER NOT NULL DEFAULT 4,
    created_at TEXT NOT NULL
  )''',
  '''CREATE TABLE program_days (
    id TEXT PRIMARY KEY NOT NULL,
    program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    routine_id TEXT REFERENCES routines(id) ON DELETE SET NULL
  )''',
  '''CREATE TABLE recipes (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    instructions TEXT NOT NULL DEFAULT '',
    servings INTEGER NOT NULL DEFAULT 1
  )''',
  '''CREATE TABLE recipe_ingredients (
    id TEXT PRIMARY KEY NOT NULL,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    grams REAL NOT NULL,
    kcal REAL,
    protein REAL,
    carbs REAL,
    fat REAL
  )''',
  'CREATE INDEX ix_routine_exercises ON routine_exercises(routine_id, position)',
  'CREATE INDEX ix_session_exercises ON session_exercises(session_id, position)',
  'CREATE INDEX ix_session_sets ON session_sets(session_exercise_id, position)',
  'CREATE INDEX ix_sessions_status ON sessions(status, started_at)',
  'CREATE INDEX ix_meals_date ON meal_entries(occurred_at)',
  'CREATE INDEX ix_water_date ON hydration_entries(occurred_at)',
  'CREATE INDEX ix_cardio_date ON cardio_entries(occurred_at)',
];
