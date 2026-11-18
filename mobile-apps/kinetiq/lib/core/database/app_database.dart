import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'package:kinetiq/core/database/tables/exercises.dart';
import 'package:kinetiq/core/database/tables/workout_templates.dart';
import 'package:kinetiq/core/database/tables/workout_template_exercises.dart';

part 'app_database.g.dart';

/// Main SQLite database for the KINETIQ application.
///
/// All workout data is stored locally on the device.
@DriftDatabase(tables: [Exercises, WorkoutTemplates, WorkoutTemplateExercises])
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
  int get schemaVersion => 3;

  // ----------------------------------------------------------
  // DATABASE MIGRATIONS
  // ----------------------------------------------------------

  @override
  MigrationStrategy get migration => MigrationStrategy(
    // New installations receive all three tables.
    onCreate: (Migrator m) async {
      await m.createAll();
    },

    // Upgrade existing installations without deleting data.
    onUpgrade: (Migrator m, int from, int to) async {
      // Version 1 -> Version 2
      // Add workout templates.
      if (from < 2) {
        await m.createTable(workoutTemplates);
      }

      // Version 2 -> Version 3
      // Add exercises belonging to workout templates.
      if (from < 3) {
        await m.createTable(workoutTemplateExercises);
      }
    },

    // Enable SQLite foreign-key enforcement for every
    // connection, including existing installations.
    beforeOpen: (details) async {
      await customStatement('PRAGMA foreign_keys = ON');
    },
  );
}
