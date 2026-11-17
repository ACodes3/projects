import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'app_database.g.dart';

/// Main SQLite database for the KINETIQ application.
///
/// Drift provides type-safe queries and database migrations.
/// All fitness data will be stored locally on the device.
@DriftDatabase(tables: [])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'kinetiq'));

  /// Current database schema version.
  ///
  /// Increment this whenever we introduce a schema migration.
  @override
  int get schemaVersion => 1;
}
