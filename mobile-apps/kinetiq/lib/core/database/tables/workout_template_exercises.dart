import 'package:drift/drift.dart';

import 'package:kinetiq/core/database/tables/exercises.dart';
import 'package:kinetiq/core/database/tables/workout_templates.dart';

/// Exercises belonging to saved workout templates.
///
/// Each row represents one exercise in a workout routine.
///
/// The same exercise may appear in multiple templates,
/// and each template maintains its own exercise order
/// and training configuration.
class WorkoutTemplateExercises extends Table {
  // ----------------------------------------------------------
  // PRIMARY KEY
  // ----------------------------------------------------------

  IntColumn get id => integer().autoIncrement()();

  // ----------------------------------------------------------
  // RELATIONSHIPS
  // ----------------------------------------------------------

  /// The workout template containing this exercise.
  IntColumn get templateId => integer().references(
    WorkoutTemplates,
    #id,
    onDelete: KeyAction.cascade,
  )();

  /// Exercise selected from the Exercise Library.
  IntColumn get exerciseId => integer().references(Exercises, #id)();

  // ----------------------------------------------------------
  // EXERCISE ORDER
  // ----------------------------------------------------------

  /// Position of this exercise within the workout.
  ///
  /// Starts at 0.
  IntColumn get position => integer().withDefault(const Constant(0))();

  // ----------------------------------------------------------
  // TRAINING CONFIGURATION
  // ----------------------------------------------------------

  /// Number of planned sets.
  IntColumn get sets => integer().withDefault(const Constant(3))();

  /// Optional target repetitions per set.
  IntColumn get targetReps => integer().nullable()();

  /// Optional target weight in kilograms.
  RealColumn get targetWeight => real().nullable()();

  /// Optional target duration in seconds.
  IntColumn get targetDurationSeconds => integer().nullable()();

  /// Optional target distance in kilometers.
  RealColumn get targetDistanceKm => real().nullable()();

  // ----------------------------------------------------------
  // REST SETTINGS
  // ----------------------------------------------------------

  /// Rest between sets, in seconds.
  IntColumn get restBetweenSetsSeconds =>
      integer().withDefault(const Constant(60))();

  /// Rest after completing this exercise, in seconds.
  IntColumn get restAfterExerciseSeconds =>
      integer().withDefault(const Constant(90))();

  // ----------------------------------------------------------
  // OPTIONAL NOTES
  // ----------------------------------------------------------

  /// Exercise-specific instructions for this workout.
  TextColumn get notes => text().nullable()();
}
