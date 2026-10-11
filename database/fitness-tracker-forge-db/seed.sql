BEGIN;


-- ============================================================
-- DEVELOPMENT USER
-- ============================================================

INSERT INTO public.users (
    email,
    password_hash
)
VALUES (
    'demo@forge.local',
    'DEV_ONLY_NOT_A_REAL_PASSWORD_HASH'
)
ON CONFLICT (email)
DO NOTHING;


-- ============================================================
-- PROFILE
-- ============================================================

INSERT INTO public.profiles (
    user_id,
    name,
    training_focus,
    height_cm,
    bio
)
SELECT
    id,
    'Forge Demo',
    'Strength & Conditioning',
    168,
    'Development profile used to test the FORGE application.'
FROM public.users
WHERE email = 'demo@forge.local'

ON CONFLICT (user_id)
DO UPDATE SET
    name = EXCLUDED.name,
    training_focus = EXCLUDED.training_focus,
    height_cm = EXCLUDED.height_cm,
    bio = EXCLUDED.bio;


-- ============================================================
-- NUTRITION GOALS
-- Demo values only
-- ============================================================

INSERT INTO public.nutrition_goals (
    user_id,
    calories,
    protein_g,
    carbs_g,
    fat_g
)
SELECT
    id,
    2000,
    130,
    220,
    65
FROM public.users
WHERE email = 'demo@forge.local'

ON CONFLICT (user_id)
DO UPDATE SET
    calories = EXCLUDED.calories,
    protein_g = EXCLUDED.protein_g,
    carbs_g = EXCLUDED.carbs_g,
    fat_g = EXCLUDED.fat_g;


-- ============================================================
-- EXERCISE LIBRARY
-- Small test set for now
-- ============================================================

INSERT INTO public.exercises (
    name,
    primary_muscle,
    secondary_muscles,
    equipment,
    exercise_type,
    movement_pattern
)
VALUES

(
    'Dumbbell Goblet Squat',
    'Quads',
    ARRAY['Glutes', 'Hamstrings', 'Core'],
    'Dumbbells',
    'Compound',
    'Squat'
),

(
    'Dumbbell Romanian Deadlift',
    'Hamstrings',
    ARRAY['Glutes', 'Lower Back'],
    'Dumbbells',
    'Compound',
    'Hip Hinge'
),

(
    'Dumbbell Bulgarian Split Squat',
    'Quads',
    ARRAY['Glutes', 'Hamstrings'],
    'Dumbbells',
    'Compound',
    'Lunge'
),

(
    'Dumbbell Hip Thrust',
    'Glutes',
    ARRAY['Hamstrings'],
    'Dumbbells',
    'Compound',
    'Hip Extension'
),

(
    'Banded Glute Bridge',
    'Glutes',
    ARRAY['Hamstrings', 'Hip Abductors'],
    'Mini Band',
    'Isolation',
    'Hip Extension'
),

(
    'Push-Up',
    'Chest',
    ARRAY['Triceps', 'Shoulders', 'Core'],
    'Bodyweight',
    'Compound',
    'Horizontal Push'
),

(
    'Dumbbell Bent-Over Row',
    'Back',
    ARRAY['Biceps', 'Rear Delts'],
    'Dumbbells',
    'Compound',
    'Horizontal Pull'
),

(
    'Dumbbell Shoulder Press',
    'Shoulders',
    ARRAY['Triceps'],
    'Dumbbells',
    'Compound',
    'Vertical Push'
),

(
    'Dumbbell Bicep Curl',
    'Biceps',
    ARRAY['Forearms'],
    'Dumbbells',
    'Isolation',
    'Elbow Flexion'
),

(
    'Dumbbell Overhead Tricep Extension',
    'Triceps',
    ARRAY['Shoulders'],
    'Dumbbells',
    'Isolation',
    'Elbow Extension'
),

(
    'Resistance Band Row',
    'Back',
    ARRAY['Biceps', 'Rear Delts'],
    'Resistance Band',
    'Compound',
    'Horizontal Pull'
),

(
    'Resistance Band Lateral Raise',
    'Shoulders',
    ARRAY[]::TEXT[],
    'Resistance Band',
    'Isolation',
    'Shoulder Abduction'
),

(
    'Forearm Plank',
    'Core',
    ARRAY['Shoulders', 'Glutes'],
    'Bodyweight',
    'Core',
    'Anti-Extension'
),

(
    'Dead Bug',
    'Core',
    ARRAY['Hip Flexors'],
    'Bodyweight',
    'Core',
    'Anti-Extension'
),

(
    'Bodyweight Squat',
    'Quads',
    ARRAY['Glutes', 'Hamstrings', 'Core'],
    'Bodyweight',
    'Compound',
    'Squat'
),

(
    'Banded Lateral Walk',
    'Glutes',
    ARRAY['Hip Abductors', 'Quads'],
    'Mini Band',
    'Isolation',
    'Hip Abduction'
)

ON CONFLICT (name)
DO UPDATE SET
    primary_muscle = EXCLUDED.primary_muscle,
    secondary_muscles = EXCLUDED.secondary_muscles,
    equipment = EXCLUDED.equipment,
    exercise_type = EXCLUDED.exercise_type,
    movement_pattern = EXCLUDED.movement_pattern,
    is_active = TRUE;


-- ============================================================
-- DEMO ACTIVITY
--
-- This block deletes only the demo user's activity first.
-- That means you can rerun this seed without creating
-- duplicate workouts, meals, progress entries or rest days.
-- ============================================================

DO $$
DECLARE

    v_user_id BIGINT;

    v_workout_id BIGINT;
    v_workout_exercise_id BIGINT;

    v_exercise_id BIGINT;

BEGIN

    SELECT id
    INTO v_user_id
    FROM public.users
    WHERE email = 'demo@forge.local';


    -- ========================================================
    -- RESET DEMO USER ACTIVITY
    -- ========================================================

    DELETE FROM public.rest_days
    WHERE user_id = v_user_id;


    DELETE FROM public.progress_entries
    WHERE user_id = v_user_id;


    DELETE FROM public.nutrition_entries
    WHERE user_id = v_user_id;


    -- workout_exercises and workout_sets are removed
    -- automatically because of ON DELETE CASCADE

    DELETE FROM public.workouts
    WHERE user_id = v_user_id;


    -- ========================================================
    -- WORKOUT 1
    -- LOWER BODY
    -- ========================================================

    INSERT INTO public.workouts (
        user_id,
        name,
        workout_date,
        youtube_url,
        notes
    )
    VALUES (
        v_user_id,
        'Lower Body Strength',
        CURRENT_DATE - 4,
        'https://www.youtube.com/',
        'Dumbbell and band lower-body session.'
    )
    RETURNING id
    INTO v_workout_id;


    -- --------------------------------------------------------
    -- Goblet Squat
    -- --------------------------------------------------------

    SELECT id
    INTO v_exercise_id
    FROM public.exercises
    WHERE name = 'Dumbbell Goblet Squat';


    INSERT INTO public.workout_exercises (
        workout_id,
        exercise_id,
        exercise_name,
        tracking_mode,
        position
    )
    VALUES (
        v_workout_id,
        v_exercise_id,
        'Dumbbell Goblet Squat',
        'reps',
        1
    )
    RETURNING id
    INTO v_workout_exercise_id;


    INSERT INTO public.workout_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        reps
    )
    VALUES
        (
            v_workout_exercise_id,
            1,
            16,
            12
        ),
        (
            v_workout_exercise_id,
            2,
            16,
            10
        ),
        (
            v_workout_exercise_id,
            3,
            16,
            10
        );


    -- --------------------------------------------------------
    -- Romanian Deadlift
    -- Timed Caroline-style intervals
    -- --------------------------------------------------------

    SELECT id
    INTO v_exercise_id
    FROM public.exercises
    WHERE name = 'Dumbbell Romanian Deadlift';


    INSERT INTO public.workout_exercises (
        workout_id,
        exercise_id,
        exercise_name,
        tracking_mode,
        position
    )
    VALUES (
        v_workout_id,
        v_exercise_id,
        'Dumbbell Romanian Deadlift',
        'time',
        2
    )
    RETURNING id
    INTO v_workout_exercise_id;


    INSERT INTO public.workout_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        duration_seconds
    )
    VALUES
        (
            v_workout_exercise_id,
            1,
            12.5,
            40
        ),
        (
            v_workout_exercise_id,
            2,
            12.5,
            40
        ),
        (
            v_workout_exercise_id,
            3,
            12.5,
            40
        );


    -- --------------------------------------------------------
    -- Banded Glute Bridge
    -- --------------------------------------------------------

    SELECT id
    INTO v_exercise_id
    FROM public.exercises
    WHERE name = 'Banded Glute Bridge';


    INSERT INTO public.workout_exercises (
        workout_id,
        exercise_id,
        exercise_name,
        tracking_mode,
        position
    )
    VALUES (
        v_workout_id,
        v_exercise_id,
        'Banded Glute Bridge',
        'time',
        3
    )
    RETURNING id
    INTO v_workout_exercise_id;


    INSERT INTO public.workout_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        duration_seconds
    )
    VALUES
        (
            v_workout_exercise_id,
            1,
            0,
            45
        ),
        (
            v_workout_exercise_id,
            2,
            0,
            45
        ),
        (
            v_workout_exercise_id,
            3,
            0,
            45
        );


    -- ========================================================
    -- WORKOUT 2
    -- UPPER BODY + CORE
    -- ========================================================

    INSERT INTO public.workouts (
        user_id,
        name,
        workout_date,
        youtube_url,
        notes
    )
    VALUES (
        v_user_id,
        'Upper Body & Core',
        CURRENT_DATE - 2,
        NULL,
        'Upper-body dumbbells with a bodyweight core finisher.'
    )
    RETURNING id
    INTO v_workout_id;


    -- --------------------------------------------------------
    -- Bent-Over Row
    -- --------------------------------------------------------

    SELECT id
    INTO v_exercise_id
    FROM public.exercises
    WHERE name = 'Dumbbell Bent-Over Row';


    INSERT INTO public.workout_exercises (
        workout_id,
        exercise_id,
        exercise_name,
        tracking_mode,
        position
    )
    VALUES (
        v_workout_id,
        v_exercise_id,
        'Dumbbell Bent-Over Row',
        'reps',
        1
    )
    RETURNING id
    INTO v_workout_exercise_id;


    INSERT INTO public.workout_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        reps
    )
    VALUES
        (
            v_workout_exercise_id,
            1,
            10,
            12
        ),
        (
            v_workout_exercise_id,
            2,
            10,
            12
        ),
        (
            v_workout_exercise_id,
            3,
            10,
            10
        );


    -- --------------------------------------------------------
    -- Shoulder Press
    -- --------------------------------------------------------

    SELECT id
    INTO v_exercise_id
    FROM public.exercises
    WHERE name = 'Dumbbell Shoulder Press';


    INSERT INTO public.workout_exercises (
        workout_id,
        exercise_id,
        exercise_name,
        tracking_mode,
        position
    )
    VALUES (
        v_workout_id,
        v_exercise_id,
        'Dumbbell Shoulder Press',
        'reps',
        2
    )
    RETURNING id
    INTO v_workout_exercise_id;


    INSERT INTO public.workout_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        reps
    )
    VALUES
        (
            v_workout_exercise_id,
            1,
            7.5,
            10
        ),
        (
            v_workout_exercise_id,
            2,
            7.5,
            10
        ),
        (
            v_workout_exercise_id,
            3,
            7.5,
            8
        );


    -- --------------------------------------------------------
    -- Push-Up
    -- Timed
    -- --------------------------------------------------------

    SELECT id
    INTO v_exercise_id
    FROM public.exercises
    WHERE name = 'Push-Up';


    INSERT INTO public.workout_exercises (
        workout_id,
        exercise_id,
        exercise_name,
        tracking_mode,
        position
    )
    VALUES (
        v_workout_id,
        v_exercise_id,
        'Push-Up',
        'time',
        3
    )
    RETURNING id
    INTO v_workout_exercise_id;


    INSERT INTO public.workout_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        duration_seconds
    )
    VALUES
        (
            v_workout_exercise_id,
            1,
            0,
            30
        ),
        (
            v_workout_exercise_id,
            2,
            0,
            30
        ),
        (
            v_workout_exercise_id,
            3,
            0,
            30
        );


    -- --------------------------------------------------------
    -- Forearm Plank
    -- --------------------------------------------------------

    SELECT id
    INTO v_exercise_id
    FROM public.exercises
    WHERE name = 'Forearm Plank';


    INSERT INTO public.workout_exercises (
        workout_id,
        exercise_id,
        exercise_name,
        tracking_mode,
        position
    )
    VALUES (
        v_workout_id,
        v_exercise_id,
        'Forearm Plank',
        'time',
        4
    )
    RETURNING id
    INTO v_workout_exercise_id;


    INSERT INTO public.workout_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        duration_seconds
    )
    VALUES
        (
            v_workout_exercise_id,
            1,
            0,
            45
        ),
        (
            v_workout_exercise_id,
            2,
            0,
            45
        ),
        (
            v_workout_exercise_id,
            3,
            0,
            45
        );


    -- ========================================================
    -- TODAY'S NUTRITION
    -- ========================================================

    INSERT INTO public.nutrition_entries (
        user_id,
        entry_date,
        meal,
        name,
        calories,
        protein_g,
        carbs_g,
        fat_g
    )
    VALUES

    (
        v_user_id,
        CURRENT_DATE,
        'Breakfast',
        'Greek Yogurt with Berries',
        350,
        28,
        45,
        7
    ),

    (
        v_user_id,
        CURRENT_DATE,
        'Lunch',
        'Chicken Rice Bowl',
        620,
        45,
        75,
        14
    ),

    (
        v_user_id,
        CURRENT_DATE,
        'Snacks',
        'Apple with Peanut Butter',
        250,
        7,
        30,
        12
    ),

    (
        v_user_id,
        CURRENT_DATE,
        'Dinner',
        'Salmon with Potatoes and Vegetables',
        700,
        42,
        65,
        28
    );


    -- ========================================================
    -- PROGRESS HISTORY
    -- ========================================================

    INSERT INTO public.progress_entries (
        user_id,
        entry_date,
        weight_kg,
        body_fat_percent,
        waist_cm,
        chest_cm,
        arms_cm,
        thighs_cm,
        notes
    )
    VALUES

    (
        v_user_id,
        CURRENT_DATE - 28,
        66.20,
        NULL,
        74.0,
        89.0,
        28.5,
        55.5,
        'Starting measurements.'
    ),

    (
        v_user_id,
        CURRENT_DATE - 14,
        65.70,
        NULL,
        73.5,
        88.5,
        28.5,
        55.0,
        'Two-week check-in.'
    ),

    (
        v_user_id,
        CURRENT_DATE,
        65.30,
        NULL,
        73.0,
        88.0,
        29.0,
        55.0,
        'Current progress entry.'
    );


    -- ========================================================
    -- REST DAY
    -- ========================================================

    INSERT INTO public.rest_days (
        user_id,
        rest_date,
        note
    )
    VALUES (
        v_user_id,
        CURRENT_DATE - 1,
        'Intentional recovery day.'
    );

END $$;


COMMIT;

SELECT *
FROM public.exercises
ORDER BY primary_muscle, name;

SELECT
    w.name AS workout,
    w.workout_date,

    we.position,
    we.exercise_name,
    we.tracking_mode,

    ws.set_number,
    ws.weight_kg,
    ws.reps,
    ws.duration_seconds

FROM public.workouts w

JOIN public.workout_exercises we
    ON we.workout_id = w.id

JOIN public.workout_sets ws
    ON ws.workout_exercise_id = we.id

WHERE w.user_id = (
    SELECT id
    FROM public.users
    WHERE email = 'demo@forge.local'
)

ORDER BY
    w.workout_date DESC,
    we.position,
    ws.set_number;