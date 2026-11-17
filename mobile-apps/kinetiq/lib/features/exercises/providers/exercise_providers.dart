import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/core/providers/database_provider.dart';
import 'package:kinetiq/features/exercises/data/repositories/exercise_repository.dart';

/// Provides access to exercise-related database operations.
final exerciseRepositoryProvider = Provider<ExerciseRepository>((ref) {
  final database = ref.watch(databaseProvider);

  return ExerciseRepository(database);
});

/// Watches all exercises in the local SQLite database.
///
/// Automatically updates when exercises are added,
/// modified, or deleted.
final exercisesProvider = StreamProvider<List<Exercise>>((ref) {
  final repository = ref.watch(exerciseRepositoryProvider);

  return repository.watchAllExercises();
});
