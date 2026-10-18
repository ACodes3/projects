-- FORGE desktop SQLite schema. Converted from PostgreSQL schema.sql.
-- Keep this file alongside your original schema.sql.
-- SQLite connections must execute PRAGMA foreign_keys = ON;
-- secondary_muscles is stored as a JSON array string (TEXT).
-- Dates are ISO date strings; timestamps are UTC ISO-8601 strings.

-- ============================================================
-- FORGE DATABASE
-- Foundation tables
-- ============================================================


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);


-- ============================================================
-- PROFILES
-- One profile per user
-- ============================================================

CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    name TEXT,

    training_focus TEXT,

    height_cm REAL
        CHECK (
            height_cm IS NULL
            OR height_cm > 0
        ),

    bio TEXT,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);


-- ============================================================
-- NUTRITION GOALS
-- One current target set per user
-- ============================================================

CREATE TABLE nutrition_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    calories INTEGER
        CHECK (
            calories IS NULL
            OR calories > 0
        ),

    protein_g REAL
        CHECK (
            protein_g IS NULL
            OR protein_g > 0
        ),

    carbs_g REAL
        CHECK (
            carbs_g IS NULL
            OR carbs_g > 0
        ),

    fat_g REAL
        CHECK (
            fat_g IS NULL
            OR fat_g > 0
        ),

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);


-- ============================================================
-- EXERCISE LIBRARY
-- Shared reference data
-- ============================================================

CREATE TABLE exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL UNIQUE,

    primary_muscle TEXT NOT NULL,

    secondary_muscles TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(secondary_muscles) AND json_type(secondary_muscles) = 'array'),

    equipment TEXT NOT NULL
        CHECK (
            equipment IN (
                'Bodyweight',
                'Dumbbells',
                'Barbell',
                'EZ Bar',
                'Kettlebell',
                'Cable',
                'Machine',
                'Smith Machine',
                'Resistance Band',
                'Mini Band',
                'Pull-Up Bar',
                'Bench',
                'Medicine Ball',
                'Suspension Trainer',
                'Cardio Machine',
                'Other'
            )
        ),

    exercise_type TEXT NOT NULL
        CHECK (
            exercise_type IN (
                'Compound',
                'Isolation',
                'Core',
                'Carry'
            )
        ),

    movement_pattern TEXT,

    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);



-- ============================================================
-- WORKOUTS
-- One row = one completed workout session
-- ============================================================

CREATE TABLE workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    workout_date TEXT NOT NULL,

    youtube_url TEXT,

    notes TEXT,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);


-- ============================================================
-- WORKOUT EXERCISES
-- Exercises performed inside one workout
--
-- exercise_id is nullable because FORGE supports
-- custom exercises that are not in the library.
--
-- exercise_name is stored as a snapshot so old
-- workout history remains readable even if an
-- exercise library entry is later renamed/deactivated.
-- ============================================================

CREATE TABLE workout_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    workout_id INTEGER NOT NULL
        REFERENCES workouts(id)
        ON DELETE CASCADE,

    exercise_id INTEGER
        REFERENCES exercises(id)
        ON DELETE SET NULL,

    exercise_name TEXT NOT NULL,

    tracking_mode TEXT NOT NULL
        CHECK (
            tracking_mode IN (
                'reps',
                'time'
            )
        ),

    position INTEGER NOT NULL
        CHECK (
            position > 0
        ),

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    UNIQUE (
        workout_id,
        position
    )
);


-- ============================================================
-- WORKOUT SETS / TIMED INTERVALS
--
-- Reps-based example:
-- weight_kg = 12.5
-- reps = 10
-- duration_seconds = NULL
--
-- Time-based example:
-- weight_kg = 10
-- reps = NULL
-- duration_seconds = 40
--
-- Bodyweight:
-- weight_kg = 0
-- ============================================================

CREATE TABLE workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    workout_exercise_id INTEGER NOT NULL
        REFERENCES workout_exercises(id)
        ON DELETE CASCADE,

    set_number INTEGER NOT NULL
        CHECK (
            set_number > 0
        ),

    weight_kg REAL NOT NULL DEFAULT 0
        CHECK (
            weight_kg >= 0
        ),

    reps INTEGER
        CHECK (
            reps IS NULL
            OR reps > 0
        ),

    duration_seconds INTEGER
        CHECK (
            duration_seconds IS NULL
            OR duration_seconds > 0
        ),

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    CONSTRAINT workout_sets_tracking_value_check
        CHECK (
            (
                reps IS NOT NULL
                AND duration_seconds IS NULL
            )
            OR
            (
                reps IS NULL
                AND duration_seconds IS NOT NULL
            )
        ),

    UNIQUE (
        workout_exercise_id,
        set_number
    )
);


-- ============================================================
-- WORKOUT INDEXES
-- ============================================================

CREATE INDEX idx_workouts_user_date
    ON workouts (
        user_id,
        workout_date DESC
    );


CREATE INDEX idx_workout_exercises_workout
    ON workout_exercises (
        workout_id
    );


CREATE INDEX idx_workout_sets_exercise
    ON workout_sets (
        workout_exercise_id
    );


-- ============================================================
-- NUTRITION ENTRIES
-- One row = one food item logged by the user
-- ============================================================

CREATE TABLE nutrition_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    entry_date TEXT NOT NULL,

    meal TEXT NOT NULL
        CHECK (
            meal IN (
                'Breakfast',
                'Lunch',
                'Snacks',
                'Dinner'
            )
        ),

    name TEXT NOT NULL,

    calories INTEGER NOT NULL DEFAULT 0
        CHECK (
            calories >= 0
        ),

    protein_g REAL NOT NULL DEFAULT 0
        CHECK (
            protein_g >= 0
        ),

    carbs_g REAL NOT NULL DEFAULT 0
        CHECK (
            carbs_g >= 0
        ),

    fat_g REAL NOT NULL DEFAULT 0
        CHECK (
            fat_g >= 0
        ),

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);


-- ============================================================
-- PROGRESS ENTRIES
-- Body measurements over time
-- ============================================================

CREATE TABLE progress_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    entry_date TEXT NOT NULL,

    weight_kg REAL
        CHECK (
            weight_kg IS NULL
            OR weight_kg > 0
        ),

    body_fat_percent REAL
        CHECK (
            body_fat_percent IS NULL
            OR (
                body_fat_percent >= 0
                AND body_fat_percent <= 100
            )
        ),

    waist_cm REAL
        CHECK (
            waist_cm IS NULL
            OR waist_cm > 0
        ),

    chest_cm REAL
        CHECK (
            chest_cm IS NULL
            OR chest_cm > 0
        ),

    arms_cm REAL
        CHECK (
            arms_cm IS NULL
            OR arms_cm > 0
        ),

    thighs_cm REAL
        CHECK (
            thighs_cm IS NULL
            OR thighs_cm > 0
        ),

    notes TEXT,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    CONSTRAINT progress_entries_has_value_check
        CHECK (
            weight_kg IS NOT NULL
            OR body_fat_percent IS NOT NULL
            OR waist_cm IS NOT NULL
            OR chest_cm IS NOT NULL
            OR arms_cm IS NOT NULL
            OR thighs_cm IS NOT NULL
            OR NULLIF(TRIM(notes), '') IS NOT NULL
        )
);


-- ============================================================
-- REST DAYS
-- One intentional recovery entry per user/date
-- ============================================================

CREATE TABLE rest_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    rest_date TEXT NOT NULL,

    note TEXT,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    UNIQUE (
        user_id,
        rest_date
    )
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_nutrition_entries_user_date
    ON nutrition_entries (
        user_id,
        entry_date DESC
    );


CREATE INDEX idx_nutrition_entries_user_date_meal
    ON nutrition_entries (
        user_id,
        entry_date,
        meal
    );


CREATE INDEX idx_progress_entries_user_date
    ON progress_entries (
        user_id,
        entry_date DESC
    );


CREATE INDEX idx_rest_days_user_date
    ON rest_days (
        user_id,
        rest_date DESC
    );



-- Timestamp maintenance (UTC, ISO-8601)
CREATE TRIGGER users_set_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER profiles_set_updated_at
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE profiles
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER nutrition_goals_set_updated_at
AFTER UPDATE ON nutrition_goals
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE nutrition_goals
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER exercises_set_updated_at
AFTER UPDATE ON exercises
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE exercises
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER workouts_set_updated_at
AFTER UPDATE ON workouts
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE workouts
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER workout_exercises_set_updated_at
AFTER UPDATE ON workout_exercises
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE workout_exercises
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER workout_sets_set_updated_at
AFTER UPDATE ON workout_sets
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE workout_sets
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER nutrition_entries_set_updated_at
AFTER UPDATE ON nutrition_entries
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE nutrition_entries
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER progress_entries_set_updated_at
AFTER UPDATE ON progress_entries
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE progress_entries
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER rest_days_set_updated_at
AFTER UPDATE ON rest_days
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE rest_days
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
END;

