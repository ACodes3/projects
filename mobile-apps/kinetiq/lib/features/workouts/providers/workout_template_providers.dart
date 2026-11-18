import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/core/providers/database_provider.dart';
import 'package:kinetiq/features/workouts/data/repositories/workout_template_repository.dart';

// ------------------------------------------------------------
// WORKOUT TEMPLATE REPOSITORY PROVIDER
// ------------------------------------------------------------

/// Provides access to workout template database operations.
///
/// The repository uses the same SQLite database instance
/// as the rest of KINETIQ.
final workoutTemplateRepositoryProvider = Provider<WorkoutTemplateRepository>((
  ref,
) {
  final database = ref.watch(databaseProvider);

  return WorkoutTemplateRepository(database);
});

// ------------------------------------------------------------
// WORKOUT TEMPLATES STREAM PROVIDER
// ------------------------------------------------------------

/// Watches all saved workout templates.
///
/// Riverpod automatically rebuilds listening widgets when
/// templates are created, updated, or deleted.
final workoutTemplatesProvider = StreamProvider<List<WorkoutTemplate>>((ref) {
  final repository = ref.watch(workoutTemplateRepositoryProvider);

  return repository.watchAllTemplates();
});
