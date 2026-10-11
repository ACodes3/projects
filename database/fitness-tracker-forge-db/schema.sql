-- ============================================================
-- FORGE DATABASE
-- Foundation tables
-- ============================================================


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROFILES
-- One profile per user
-- ============================================================

CREATE TABLE public.profiles (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    name VARCHAR(100),

    training_focus VARCHAR(150),

    height_cm NUMERIC(5, 2)
        CHECK (
            height_cm IS NULL
            OR height_cm > 0
        ),

    bio TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- NUTRITION GOALS
-- One current target set per user
-- ============================================================

CREATE TABLE public.nutrition_goals (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    calories INTEGER
        CHECK (
            calories IS NULL
            OR calories > 0
        ),

    protein_g NUMERIC(7, 2)
        CHECK (
            protein_g IS NULL
            OR protein_g > 0
        ),

    carbs_g NUMERIC(7, 2)
        CHECK (
            carbs_g IS NULL
            OR carbs_g > 0
        ),

    fat_g NUMERIC(7, 2)
        CHECK (
            fat_g IS NULL
            OR fat_g > 0
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- EXERCISE LIBRARY
-- Shared reference data
-- ============================================================

CREATE TABLE public.exercises (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL UNIQUE,

    primary_muscle VARCHAR(100) NOT NULL,

    secondary_muscles TEXT[] NOT NULL DEFAULT '{}',

    equipment VARCHAR(50) NOT NULL
        CHECK (
            equipment IN (
                'Bodyweight',
                'Dumbbells',
                'Resistance Band',
                'Mini Band'
            )
        ),

    exercise_type VARCHAR(50) NOT NULL
        CHECK (
            exercise_type IN (
                'Compound',
                'Isolation',
                'Core',
                'Carry'
            )
        ),

    movement_pattern VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- ============================================================
-- WORKOUTS
-- One row = one completed workout session
-- ============================================================

CREATE TABLE public.workouts (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    workout_date DATE NOT NULL,

    youtube_url TEXT,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE TABLE public.workout_exercises (
    id BIGSERIAL PRIMARY KEY,

    workout_id BIGINT NOT NULL
        REFERENCES public.workouts(id)
        ON DELETE CASCADE,

    exercise_id BIGINT
        REFERENCES public.exercises(id)
        ON DELETE SET NULL,

    exercise_name VARCHAR(150) NOT NULL,

    tracking_mode VARCHAR(20) NOT NULL
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

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

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

CREATE TABLE public.workout_sets (
    id BIGSERIAL PRIMARY KEY,

    workout_exercise_id BIGINT NOT NULL
        REFERENCES public.workout_exercises(id)
        ON DELETE CASCADE,

    set_number INTEGER NOT NULL
        CHECK (
            set_number > 0
        ),

    weight_kg NUMERIC(7, 2) NOT NULL DEFAULT 0
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

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

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
    ON public.workouts (
        user_id,
        workout_date DESC
    );


CREATE INDEX idx_workout_exercises_workout
    ON public.workout_exercises (
        workout_id
    );


CREATE INDEX idx_workout_sets_exercise
    ON public.workout_sets (
        workout_exercise_id
    );


-- ============================================================
-- NUTRITION ENTRIES
-- One row = one food item logged by the user
-- ============================================================

CREATE TABLE public.nutrition_entries (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    entry_date DATE NOT NULL,

    meal VARCHAR(20) NOT NULL
        CHECK (
            meal IN (
                'Breakfast',
                'Lunch',
                'Snacks',
                'Dinner'
            )
        ),

    name VARCHAR(200) NOT NULL,

    calories INTEGER NOT NULL DEFAULT 0
        CHECK (
            calories >= 0
        ),

    protein_g NUMERIC(7, 2) NOT NULL DEFAULT 0
        CHECK (
            protein_g >= 0
        ),

    carbs_g NUMERIC(7, 2) NOT NULL DEFAULT 0
        CHECK (
            carbs_g >= 0
        ),

    fat_g NUMERIC(7, 2) NOT NULL DEFAULT 0
        CHECK (
            fat_g >= 0
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROGRESS ENTRIES
-- Body measurements over time
-- ============================================================

CREATE TABLE public.progress_entries (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    entry_date DATE NOT NULL,

    weight_kg NUMERIC(6, 2)
        CHECK (
            weight_kg IS NULL
            OR weight_kg > 0
        ),

    body_fat_percent NUMERIC(5, 2)
        CHECK (
            body_fat_percent IS NULL
            OR (
                body_fat_percent >= 0
                AND body_fat_percent <= 100
            )
        ),

    waist_cm NUMERIC(6, 2)
        CHECK (
            waist_cm IS NULL
            OR waist_cm > 0
        ),

    chest_cm NUMERIC(6, 2)
        CHECK (
            chest_cm IS NULL
            OR chest_cm > 0
        ),

    arms_cm NUMERIC(6, 2)
        CHECK (
            arms_cm IS NULL
            OR arms_cm > 0
        ),

    thighs_cm NUMERIC(6, 2)
        CHECK (
            thighs_cm IS NULL
            OR thighs_cm > 0
        ),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

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

CREATE TABLE public.rest_days (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    rest_date DATE NOT NULL,

    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (
        user_id,
        rest_date
    )
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_nutrition_entries_user_date
    ON public.nutrition_entries (
        user_id,
        entry_date DESC
    );


CREATE INDEX idx_nutrition_entries_user_date_meal
    ON public.nutrition_entries (
        user_id,
        entry_date,
        meal
    );


CREATE INDEX idx_progress_entries_user_date
    ON public.progress_entries (
        user_id,
        entry_date DESC
    );


CREATE INDEX idx_rest_days_user_date
    ON public.rest_days (
        user_id,
        rest_date DESC
    );


-- ============================================================
-- FORGE
-- Automatic updated_at handling
-- ============================================================


-- ============================================================
-- ADD updated_at TO TABLES THAT DID NOT HAVE IT YET
-- ============================================================

ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();


ALTER TABLE public.workout_sets
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();


ALTER TABLE public.rest_days
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ============================================================
-- GENERIC TRIGGER FUNCTION
--
-- Any table using this trigger will automatically set
-- updated_at = current timestamp whenever a row is updated.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$;


-- ============================================================
-- USERS
-- ============================================================

DROP TRIGGER IF EXISTS users_set_updated_at
ON public.users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- PROFILES
-- ============================================================

DROP TRIGGER IF EXISTS profiles_set_updated_at
ON public.profiles;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- NUTRITION GOALS
-- ============================================================

DROP TRIGGER IF EXISTS nutrition_goals_set_updated_at
ON public.nutrition_goals;

CREATE TRIGGER nutrition_goals_set_updated_at
BEFORE UPDATE
ON public.nutrition_goals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- EXERCISES
-- ============================================================

DROP TRIGGER IF EXISTS exercises_set_updated_at
ON public.exercises;

CREATE TRIGGER exercises_set_updated_at
BEFORE UPDATE
ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- WORKOUTS
-- ============================================================

DROP TRIGGER IF EXISTS workouts_set_updated_at
ON public.workouts;

CREATE TRIGGER workouts_set_updated_at
BEFORE UPDATE
ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- WORKOUT EXERCISES
-- ============================================================

DROP TRIGGER IF EXISTS workout_exercises_set_updated_at
ON public.workout_exercises;

CREATE TRIGGER workout_exercises_set_updated_at
BEFORE UPDATE
ON public.workout_exercises
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- WORKOUT SETS
-- ============================================================

DROP TRIGGER IF EXISTS workout_sets_set_updated_at
ON public.workout_sets;

CREATE TRIGGER workout_sets_set_updated_at
BEFORE UPDATE
ON public.workout_sets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- NUTRITION ENTRIES
-- ============================================================

DROP TRIGGER IF EXISTS nutrition_entries_set_updated_at
ON public.nutrition_entries;

CREATE TRIGGER nutrition_entries_set_updated_at
BEFORE UPDATE
ON public.nutrition_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- PROGRESS ENTRIES
-- ============================================================

DROP TRIGGER IF EXISTS progress_entries_set_updated_at
ON public.progress_entries;

CREATE TRIGGER progress_entries_set_updated_at
BEFORE UPDATE
ON public.progress_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- REST DAYS
-- ============================================================

DROP TRIGGER IF EXISTS rest_days_set_updated_at
ON public.rest_days;

CREATE TRIGGER rest_days_set_updated_at
BEFORE UPDATE
ON public.rest_days
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();