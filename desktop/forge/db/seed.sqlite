BEGIN TRANSACTION;


-- ============================================================
-- DEVELOPMENT USER
-- ============================================================

INSERT INTO users (
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

INSERT INTO profiles (
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
FROM users
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

INSERT INTO nutrition_goals (
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
FROM users
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

INSERT INTO exercises (
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
    '["Glutes", "Hamstrings", "Core"]',
    'Dumbbells',
    'Compound',
    'Squat'
),

(
    'Dumbbell Romanian Deadlift',
    'Hamstrings',
    '["Glutes", "Lower Back"]',
    'Dumbbells',
    'Compound',
    'Hip Hinge'
),

(
    'Dumbbell Bulgarian Split Squat',
    'Quads',
    '["Glutes", "Hamstrings"]',
    'Dumbbells',
    'Compound',
    'Lunge'
),

(
    'Dumbbell Hip Thrust',
    'Glutes',
    '["Hamstrings"]',
    'Dumbbells',
    'Compound',
    'Hip Extension'
),

(
    'Banded Glute Bridge',
    'Glutes',
    '["Hamstrings", "Hip Abductors"]',
    'Mini Band',
    'Isolation',
    'Hip Extension'
),

(
    'Push-Up',
    'Chest',
    '["Triceps", "Shoulders", "Core"]',
    'Bodyweight',
    'Compound',
    'Horizontal Push'
),

(
    'Dumbbell Bent-Over Row',
    'Back',
    '["Biceps", "Rear Delts"]',
    'Dumbbells',
    'Compound',
    'Horizontal Pull'
),

(
    'Dumbbell Shoulder Press',
    'Shoulders',
    '["Triceps"]',
    'Dumbbells',
    'Compound',
    'Vertical Push'
),

(
    'Dumbbell Bicep Curl',
    'Biceps',
    '["Forearms"]',
    'Dumbbells',
    'Isolation',
    'Elbow Flexion'
),

(
    'Dumbbell Overhead Tricep Extension',
    'Triceps',
    '["Shoulders"]',
    'Dumbbells',
    'Isolation',
    'Elbow Extension'
),

(
    'Resistance Band Row',
    'Back',
    '["Biceps", "Rear Delts"]',
    'Resistance Band',
    'Compound',
    'Horizontal Pull'
),

(
    'Resistance Band Lateral Raise',
    'Shoulders',
    '[]',
    'Resistance Band',
    'Isolation',
    'Shoulder Abduction'
),

(
    'Forearm Plank',
    'Core',
    '["Shoulders", "Glutes"]',
    'Bodyweight',
    'Core',
    'Anti-Extension'
),

(
    'Dead Bug',
    'Core',
    '["Hip Flexors"]',
    'Bodyweight',
    'Core',
    'Anti-Extension'
),

(
    'Bodyweight Squat',
    'Quads',
    '["Glutes", "Hamstrings", "Core"]',
    'Bodyweight',
    'Compound',
    'Squat'
),

(
    'Banded Lateral Walk',
    'Glutes',
    '["Hip Abductors", "Quads"]',
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
    is_active = 1;



-- Reset only demo activity; never run this seed on real user data.
DELETE FROM rest_days WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local');
DELETE FROM progress_entries WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local');
DELETE FROM nutrition_entries WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local');
DELETE FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local');
INSERT INTO workouts (user_id,name,workout_date,youtube_url,notes) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),'Lower Body Strength',date('now', '-4 days'),'https://www.youtube.com/','Dumbbell and band lower-body session.');
INSERT INTO workouts (user_id,name,workout_date,youtube_url,notes) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),'Upper Body & Core',date('now', '-2 days'),NULL,'Upper-body dumbbells with a bodyweight core finisher.');
INSERT INTO workout_exercises (workout_id,exercise_id,exercise_name,tracking_mode,position) VALUES ((SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength'),(SELECT id FROM exercises WHERE name = 'Dumbbell Goblet Squat'),'Dumbbell Goblet Squat','reps',1);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 1),1,16,12);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 1),2,16,10);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 1),3,16,10);
INSERT INTO workout_exercises (workout_id,exercise_id,exercise_name,tracking_mode,position) VALUES ((SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength'),(SELECT id FROM exercises WHERE name = 'Dumbbell Romanian Deadlift'),'Dumbbell Romanian Deadlift','time',2);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 2),1,12.5,40);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 2),2,12.5,40);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 2),3,12.5,40);
INSERT INTO workout_exercises (workout_id,exercise_id,exercise_name,tracking_mode,position) VALUES ((SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength'),(SELECT id FROM exercises WHERE name = 'Banded Glute Bridge'),'Banded Glute Bridge','time',3);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 3),1,0,45);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 3),2,0,45);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Lower Body Strength') AND we.position = 3),3,0,45);
INSERT INTO workout_exercises (workout_id,exercise_id,exercise_name,tracking_mode,position) VALUES ((SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core'),(SELECT id FROM exercises WHERE name = 'Dumbbell Bent-Over Row'),'Dumbbell Bent-Over Row','reps',1);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 1),1,10,12);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 1),2,10,12);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 1),3,10,10);
INSERT INTO workout_exercises (workout_id,exercise_id,exercise_name,tracking_mode,position) VALUES ((SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core'),(SELECT id FROM exercises WHERE name = 'Dumbbell Shoulder Press'),'Dumbbell Shoulder Press','reps',2);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 2),1,7.5,10);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 2),2,7.5,10);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,reps) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 2),3,7.5,8);
INSERT INTO workout_exercises (workout_id,exercise_id,exercise_name,tracking_mode,position) VALUES ((SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core'),(SELECT id FROM exercises WHERE name = 'Push-Up'),'Push-Up','time',3);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 3),1,0,30);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 3),2,0,30);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 3),3,0,30);
INSERT INTO workout_exercises (workout_id,exercise_id,exercise_name,tracking_mode,position) VALUES ((SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core'),(SELECT id FROM exercises WHERE name = 'Forearm Plank'),'Forearm Plank','time',4);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 4),1,0,45);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 4),2,0,45);
INSERT INTO workout_sets (workout_exercise_id,set_number,weight_kg,duration_seconds) VALUES ((SELECT we.id FROM workout_exercises we WHERE we.workout_id = (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = 'demo@forge.local') AND name = 'Upper Body & Core') AND we.position = 4),3,0,45);
INSERT INTO nutrition_entries (user_id,entry_date,meal,name,calories,protein_g,carbs_g,fat_g) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),date('now'),'Breakfast','Greek Yogurt with Berries',350,28,45,7);
INSERT INTO nutrition_entries (user_id,entry_date,meal,name,calories,protein_g,carbs_g,fat_g) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),date('now'),'Lunch','Chicken Rice Bowl',620,45,75,14);
INSERT INTO nutrition_entries (user_id,entry_date,meal,name,calories,protein_g,carbs_g,fat_g) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),date('now'),'Snacks','Apple with Peanut Butter',250,7,30,12);
INSERT INTO nutrition_entries (user_id,entry_date,meal,name,calories,protein_g,carbs_g,fat_g) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),date('now'),'Dinner','Salmon with Potatoes and Vegetables',700,42,65,28);
INSERT INTO progress_entries (user_id,entry_date,weight_kg,body_fat_percent,waist_cm,chest_cm,arms_cm,thighs_cm,notes) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),date('now', '-28 days'),66.2,NULL,74,89,28.5,55.5,'Starting measurements.');
INSERT INTO progress_entries (user_id,entry_date,weight_kg,body_fat_percent,waist_cm,chest_cm,arms_cm,thighs_cm,notes) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),date('now', '-14 days'),65.7,NULL,73.5,88.5,28.5,55,'Two-week check-in.');
INSERT INTO progress_entries (user_id,entry_date,weight_kg,body_fat_percent,waist_cm,chest_cm,arms_cm,thighs_cm,notes) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),date('now'),65.3,NULL,73,88,29,55,'Current progress entry.');
INSERT INTO rest_days (user_id,rest_date,note) VALUES ((SELECT id FROM users WHERE email = 'demo@forge.local'),date('now', '-1 day'),'Intentional recovery day.');
COMMIT;
