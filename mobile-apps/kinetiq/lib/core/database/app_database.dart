import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'package:kinetiq/core/database/tables/exercises.dart';
import 'package:kinetiq/core/database/tables/workout_templates.dart';
import 'package:kinetiq/core/database/tables/workout_template_exercises.dart';
import 'package:kinetiq/core/database/tables/workout_sessions.dart';

part 'app_database.g.dart';

/// Main SQLite database for the KINETIQ application.
///
/// All workout data is stored locally on the device.
///
/// Database responsibilities:
/// - Exercise Library
/// - Workout Templates
/// - Exercises assigned to workout templates
/// - Workout Sessions
@DriftDatabase(
  tables: [
    Exercises,
    WorkoutTemplates,
    WorkoutTemplateExercises,
    WorkoutSessions,
  ],
)
class AppDatabase extends _$AppDatabase {
  // ----------------------------------------------------------
  // CONSTRUCTORS
  // ----------------------------------------------------------

  /// Persistent database used by the application.
  AppDatabase() : super(driftDatabase(name: 'kinetiq'));

  /// In-memory database used by automated tests.
  AppDatabase.forTesting(super.executor);

  // ----------------------------------------------------------
  // DATABASE VERSION
  // ----------------------------------------------------------

  @override
  int get schemaVersion => 4;

  // ----------------------------------------------------------
  // DATABASE MIGRATIONS
  // ----------------------------------------------------------

  @override
  MigrationStrategy get migration => MigrationStrategy(
    // --------------------------------------------------------
    // NEW DATABASE INSTALLATIONS
    // --------------------------------------------------------

    /// New installations receive every registered table.
    onCreate: (Migrator m) async {
      await m.createAll();
    },

    // --------------------------------------------------------
    // EXISTING DATABASE UPGRADES
    // --------------------------------------------------------

    /// Upgrade existing installations without deleting
    /// previously saved exercises or workout templates.
    onUpgrade: (Migrator m, int from, int to) async {
      // ------------------------------------------------------
      // VERSION 1 -> VERSION 2
      // ------------------------------------------------------

      // Introduce saved workout templates.
      if (from < 2) {
        await m.createTable(workoutTemplates);
      }

      // ------------------------------------------------------
      // VERSION 2 -> VERSION 3
      // ------------------------------------------------------

      // Introduce exercises configured inside templates.
      if (from < 3) {
        await m.createTable(workoutTemplateExercises);
      }

      // ------------------------------------------------------
      // VERSION 3 -> VERSION 4
      // ------------------------------------------------------

      // Introduce actual workout sessions.
      //
      // This adds a new table and does not modify the
      // existing exercise or workout template tables.
      if (from < 4) {
        await m.createTable(workoutSessions);
      }
    },

    // --------------------------------------------------------
    // DATABASE CONNECTION SETUP
    // --------------------------------------------------------

    /// Enable foreign-key enforcement for every connection,
    /// including persistent and in-memory test databases.
    beforeOpen: (details) async {
      await customStatement('PRAGMA foreign_keys = ON');
    },
  );
}
