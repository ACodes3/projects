import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/core/providers/database_provider.dart';
import 'package:kinetiq/features/workouts/data/repositories/workout_template_exercise_repository.dart';

// ------------------------------------------------------------
// WORKOUT TEMPLATE EXERCISE REPOSITORY PROVIDER
// ------------------------------------------------------------

/// Provides access to the database operations for exercises
/// assigned to workout templates.
///
/// Uses the same SQLite database as the rest of KINETIQ.
final workoutTemplateExerciseRepositoryProvider =
    Provider<WorkoutTemplateExerciseRepository>((ref) {
      final database = ref.watch(databaseProvider);

      return WorkoutTemplateExerciseRepository(database);
    });

// ------------------------------------------------------------
// TEMPLATE EXERCISES STREAM PROVIDER
// ------------------------------------------------------------

/// Watches the configured exercises belonging to one workout.
///
/// The family parameter is the workout template's ID.
///
/// Each template has its own reactive stream, so updating one
/// template does not require every template detail screen
/// to watch the same exercise list.
final workoutTemplateExercisesProvider =
    StreamProvider.family<List<WorkoutTemplateExercise>, int>((
      ref,
      templateId,
    ) {
      final repository = ref.watch(workoutTemplateExerciseRepositoryProvider);

      return repository.watchExercisesForTemplate(templateId);
    });
