
import db from "../src/config/sqlite.js";

try {
  const exercises = db
    .prepare("SELECT COUNT(*) AS total FROM exercises")
    .get();

  const workouts = db
    .prepare("SELECT COUNT(*) AS total FROM workouts")
    .get();

  const integrity = db.pragma("integrity_check", {
    simple: true,
  });

  console.log("FORGE SQLite connection successful!");
  console.log("Exercises:", exercises.total);
  console.log("Workouts:", workouts.total);
  console.log("Integrity:", integrity);
} finally {
  db.close();
}
