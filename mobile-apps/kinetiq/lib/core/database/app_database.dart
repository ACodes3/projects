import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'package:kinetiq/core/database/tables/exercises.dart';
import 'package:kinetiq/core/database/tables/workout_templates.dart';

part 'app_database.g.dart';

/// Main SQLite database for the KINETIQ application.
///
/// All workout data is stored locally on the device.
@DriftDatabase(
  tables: [
    Exercises,
    WorkoutTemplates,
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
  int get schemaVersion => 2;

  // ----------------------------------------------------------
  // DATABASE MIGRATIONS
  // ----------------------------------------------------------

  @override
  MigrationStrategy get migration => MigrationStrategy(
    // Create all tables for new installations.
    onCreate: (Migrator m) async {
      await m.createAll();
    },

    // Upgrade existing databases without deleting data.
    onUpgrade: (Migrator m, int from, int to) async {
      if (from < 2) {
        await m.createTable(workoutTemplates);
      }
    },
  );
}
