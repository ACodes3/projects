
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "../..");

const databasePath = path.join(rootDir, "db", "forge.sqlite");
const backupPath = path.join(
  rootDir,
  "db",
  "forge-before-equipment-migration.sqlite"
);

if (!fs.existsSync(backupPath)) {
  console.error("Migration stopped: database backup not found.");
  process.exit(1);
}

const db = new Database(databasePath, { fileMustExist: true });

try {
  const oldSchema = db.prepare(`
    SELECT sql
    FROM sqlite_master
    WHERE type = 'table' AND name = 'exercises'
  `).get();

  if (!oldSchema) {
    throw new Error("The exercises table does not exist.");
  }

  if (oldSchema.sql.includes("'Barbell'")) {
    console.log("Equipment migration already applied.");
  } else {
    const beforeCount = db.prepare(`
      SELECT COUNT(*) AS total FROM exercises
    `).get().total;

    console.log(`Existing exercises: ${beforeCount}`);

    // Must be disabled before starting the transaction.
    db.pragma("foreign_keys = OFF");

    const migrate = db.transaction(() => {
      db.exec(`
        CREATE TABLE exercises_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,

          name TEXT NOT NULL UNIQUE,

          primary_muscle TEXT NOT NULL,

          secondary_muscles TEXT NOT NULL DEFAULT '[]'
            CHECK (
              json_valid(secondary_muscles)
              AND json_type(secondary_muscles) = 'array'
            ),

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

          is_active INTEGER NOT NULL DEFAULT 1
            CHECK (is_active IN (0, 1)),

          created_at TEXT NOT NULL DEFAULT (
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          ),

          updated_at TEXT NOT NULL DEFAULT (
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          )
        );

        INSERT INTO exercises_new (
          id,
          name,
          primary_muscle,
          secondary_muscles,
          equipment,
          exercise_type,
          movement_pattern,
          is_active,
          created_at,
          updated_at
        )
        SELECT
          id,
          name,
          primary_muscle,
          secondary_muscles,
          equipment,
          exercise_type,
          movement_pattern,
          is_active,
          created_at,
          updated_at
        FROM exercises;

        DROP TABLE exercises;

        ALTER TABLE exercises_new RENAME TO exercises;

        CREATE TRIGGER exercises_set_updated_at
        AFTER UPDATE ON exercises
        FOR EACH ROW
        WHEN NEW.updated_at = OLD.updated_at
        BEGIN
          UPDATE exercises
          SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = NEW.id;
        END;
      `);

      const afterCount = db.prepare(`
        SELECT COUNT(*) AS total FROM exercises
      `).get().total;

      if (afterCount !== beforeCount) {
        throw new Error("Exercise count changed during migration.");
      }

      const foreignKeyErrors = db.pragma("foreign_key_check");

      if (foreignKeyErrors.length > 0) {
        throw new Error(
          `Foreign key errors: ${JSON.stringify(foreignKeyErrors)}`
        );
      }

      const integrity = db.pragma("integrity_check", {
        simple: true
      });

      if (integrity !== "ok") {
        throw new Error(`Database integrity check failed: ${integrity}`);
      }
    });

    migrate();

    console.log("Equipment migration completed successfully!");
  }

  db.pragma("foreign_keys = ON");

  const count = db.prepare(`
    SELECT COUNT(*) AS total FROM exercises
  `).get().total;

  console.log(`Exercises preserved: ${count}`);
  console.log(
    "Foreign key check:",
    db.pragma("foreign_key_check").length === 0 ? "PASSED" : "FAILED"
  );
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
