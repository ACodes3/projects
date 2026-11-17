import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kinetiq/core/database/app_database.dart';

/// Provides the local SQLite database to the application.
///
/// The database is created when first requested and stays
/// available while the provider container is alive.
final databaseProvider = Provider<AppDatabase>((ref) {
  final database = AppDatabase();

  // Close the SQLite connection when the provider is disposed.
  ref.onDispose(() {
    database.close();
  });

  return database;
});
