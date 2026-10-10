-- ==========================================================
-- Fitness Project - Production Schema
-- Cleaned and corrected version based on real DB usage
-- ==========================================================

-- ===============
-- USERS
-- ===============
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50),
  location VARCHAR(100),
  joined_at TIMESTAMP DEFAULT NOW(),
  avatar_url TEXT
);

-- ==========================================================
-- FITNESS PROFILE (1:1 with users)
-- ==========================================================
CREATE TABLE IF NOT EXISTS fitness_profile (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  goal VARCHAR(100),
  bmi NUMERIC(4,1),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- WORKOUTS (N:1 users)
-- ==========================================================
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,     -- Strength / Cardio / Flexibility / HIIT
  name VARCHAR(100),
  date DATE DEFAULT CURRENT_DATE,
  duration_min INT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date
ON workouts (user_id, date DESC);

-- ==========================================================
-- WORKOUT EXERCISES (N:1 workouts)
-- ==========================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id SERIAL PRIMARY KEY,
  workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name VARCHAR(100) NOT NULL,
  sets INT,
  reps INT,
  weight_kg NUMERIC(5,2),
  duration_min INT,
  rest_sec INT,
  notes TEXT
);

-- ==========================================================
-- STEPS LOGS (unique per user per day)
-- ==========================================================
CREATE TABLE IF NOT EXISTS steps_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  step_date DATE NOT NULL,
  steps_count INT NOT NULL,
  distance_km NUMERIC(5,2),
  calories_burned NUMERIC(6,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, step_date)
);

CREATE INDEX IF NOT EXISTS idx_steps_user_date
ON steps_logs (user_id, step_date DESC);

-- ==========================================================
-- SETTINGS (1:1 users)
-- ==========================================================
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications JSONB DEFAULT '{"emailAlerts": true, "smsNotifications": false}'
);

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- Users
INSERT INTO users (name, email, password_hash, role, location, avatar_url)
VALUES
('John Doe', 'john@example.com', 'hashed_pw_123', 'Intermediate', 'New York, USA', 'https://i.pravatar.cc/150?img=3'),
('Jane Smith', 'jane@example.com', 'hashed_pw_456', 'Beginner', 'Los Angeles, USA', 'https://i.pravatar.cc/150?img=5'),
('Alex Johnson', 'alex@example.com', 'hashed_pw_789', 'Advanced', 'London, UK', 'https://i.pravatar.cc/150?img=8');

-- Workouts
INSERT INTO workouts (user_id, type, name, date, duration_min, notes)
VALUES
(1, 'Strength', 'Push Day', '2025-10-18', NULL, 'Upper body focus'),
(1, 'Cardio', 'Morning Run', '2025-10-19', 35, 'Light jog around Central Park'),
(2, 'Strength', 'Leg Day', '2025-10-18', NULL, 'Heavy squats session'),
(3, 'Cardio', 'Cycling', '2025-10-19', 50, 'Outdoor cycling session');

-- Workout Exercises
INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, weight_kg)
VALUES
(1, 'Bench Press', 3, 10, 60),
(1, 'Overhead Press', 3, 8, 35),
(1, 'Tricep Dips', 3, 12, NULL);

INSERT INTO workout_exercises (workout_id, exercise_name, duration_min)
VALUES
(2, 'Running', 35),
(4, 'Cycling', 50);

INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, weight_kg)
VALUES
(3, 'Squats', 4, 8, 80),
(3, 'Lunges', 3, 10, 25),
(3, 'Leg Press', 3, 12, 100);

-- Steps Logs
INSERT INTO steps_logs (user_id, step_date, steps_count, distance_km, calories_burned) VALUES
(1, '2025-10-15', 8500, 6.8, 340),
(1, '2025-10-16', 9200, 7.4, 365),
(1, '2025-10-17', 10300, 8.3, 412),
(1, '2025-10-18', 12000, 9.6, 480),
(2, '2025-10-18', 7000, 5.6, 280),
(2, '2025-10-19', 8800, 7.0, 350),
(3, '2025-10-19', 11000, 8.8, 460);

-- Fitness Profiles
INSERT INTO fitness_profile (user_id, weight_kg, height_cm, goal, bmi)
VALUES
(1, 72, 175, 'Build Muscle', 23.5),
(2, 65, 168, 'Lose Weight', 23.0),
(3, 80, 182, 'Improve Endurance', 24.1);

-- Settings
INSERT INTO settings (user_id, theme, language, notifications)
VALUES
(1, 'light', 'en', '{"emailAlerts": true, "smsNotifications": false}'),
(2, 'dark', 'en', '{"emailAlerts": false, "smsNotifications": false}'),
(3, 'light', 'fr', '{"emailAlerts": true, "smsNotifications": true}');
-- ==========================================================