import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'package:kinetiq/core/database/tables/exercises.dart';

part 'app_database.g.dart';

/// Main SQLite database for the KINETIQ application.
///
/// All workout data is stored locally on the device.
@DriftDatabase(
  tables: [Exercises],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'kinetiq'));

  AppDatabase.forTesting(super.executor);

  /// Current database schema version.
  @override
  int get schemaVersion => 1;
}
