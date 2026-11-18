import 'package:drift/drift.dart';

import 'package:kinetiq/core/database/app_database.dart';

/// Manages exercises assigned to workout templates.
///
/// Each row stores an exercise's position, planned sets,
/// targets, rest settings, and optional notes.
///
/// Removing a row from this table does not delete the
/// corresponding exercise from the Exercise Library.
class WorkoutTemplateExerciseRepository {
  const WorkoutTemplateExerciseRepository(this._database);

  final AppDatabase _database;

  // ----------------------------------------------------------
  // READ TEMPLATE EXERCISES
  // ----------------------------------------------------------

  /// Returns exercises assigned to a template in their
  /// configured order.
  Future<List<WorkoutTemplateExercise>> getExercisesForTemplate(
    int templateId,
  ) {
    return (_database.select(_database.workoutTemplateExercises)
          ..where((table) => table.templateId.equals(templateId))
          ..orderBy([
            (table) => OrderingTerm.asc(table.position),
            (table) => OrderingTerm.asc(table.id),
          ]))
        .get();
  }

  // ----------------------------------------------------------
  // WATCH TEMPLATE EXERCISES
  // ----------------------------------------------------------

  /// Emits updated exercise configurations whenever
  /// the template's rows change.
  Stream<List<WorkoutTemplateExercise>> watchExercisesForTemplate(
    int templateId,
  ) {
    return (_database.select(_database.workoutTemplateExercises)
          ..where((table) => table.templateId.equals(templateId))
          ..orderBy([
            (table) => OrderingTerm.asc(table.position),
            (table) => OrderingTerm.asc(table.id),
          ]))
        .watch();
  }

  // ----------------------------------------------------------
  // READ ONE TEMPLATE EXERCISE
  // ----------------------------------------------------------

  Future<WorkoutTemplateExercise?> getTemplateExerciseById(int id) {
    return (_database.select(
      _database.workoutTemplateExercises,
    )..where((table) => table.id.equals(id))).getSingleOrNull();
  }

  // ----------------------------------------------------------
  // ADD EXERCISE
  // ----------------------------------------------------------

  /// Adds an exercise and its training configuration.
  ///
  /// [exercise] must include templateId and exerciseId.
  ///
  /// Returns the new relationship row's SQLite ID.
  Future<int> addExercise(WorkoutTemplateExercisesCompanion exercise) {
    return _database.into(_database.workoutTemplateExercises).insert(exercise);
  }

  // ----------------------------------------------------------
  // UPDATE EXERCISE CONFIGURATION
  // ----------------------------------------------------------

  /// Updates sets, reps, weight, duration, rest, or notes
  /// while preserving the relationship row's ID.
  Future<bool> updateExercise(WorkoutTemplateExercise exercise) {
    return _database
        .update(_database.workoutTemplateExercises)
        .replace(exercise);
  }

  // ----------------------------------------------------------
  // REMOVE EXERCISE FROM TEMPLATE
  // ----------------------------------------------------------

  /// Removes a configured exercise from a workout template.
  ///
  /// The original Exercise Library record remains untouched.

  // ----------------------------------------------------------
  // REMOVE EXERCISE AND NORMALIZE POSITIONS
  // ----------------------------------------------------------

  /// Removes an exercise from its workout template.
  ///
  /// The original Exercise Library record is preserved.
  ///
  /// Remaining exercises are renumbered starting at zero.
  /// All changes happen in a single database transaction.
  Future<int> removeExercise(int id) async {
    return _database.transaction(() async {
      // Find the exercise before deleting it.
      final existing = await getTemplateExerciseById(id);

      if (existing == null) {
        return 0;
      }

      final templateId = existing.templateId;

      // Delete only the workout's configured exercise.
      final deletedRows = await (_database.delete(
        _database.workoutTemplateExercises,
      )..where((table) => table.id.equals(id))).go();

      // Load the remaining exercises in their current order.
      final remaining = await getExercisesForTemplate(templateId);

      // Normalize positions: 0, 1, 2, 3...
      for (var index = 0; index < remaining.length; index++) {
        final exercise = remaining[index];

        // Avoid unnecessary database updates.
        if (exercise.position == index) continue;

        await (_database.update(_database.workoutTemplateExercises)
              ..where((table) => table.id.equals(exercise.id)))
            .write(WorkoutTemplateExercisesCompanion(position: Value(index)));
      }

      return deletedRows;
    });
  }

  // ----------------------------------------------------------
  // REORDER EXERCISES
  // ----------------------------------------------------------

  /// Saves the ordered relationship IDs for one template.
  ///
  /// Positions start at zero.
  ///
  /// All updates happen in one transaction so a partial
  /// reorder cannot be committed.
  Future<void> reorderExercises(int templateId, List<int> orderedIds) async {
    await _database.transaction(() async {
      final existing = await getExercisesForTemplate(templateId);

      final existingIds = existing.map((row) => row.id).toSet();
      final requestedIds = orderedIds.toSet();

      if (orderedIds.length != existing.length ||
          requestedIds.length != orderedIds.length ||
          requestedIds.length != existingIds.length ||
          !requestedIds.containsAll(existingIds)) {
        throw ArgumentError(
          'The ordered IDs must contain every exercise '
          'in this template exactly once.',
        );
      }

      for (var position = 0; position < orderedIds.length; position++) {
        await (_database.update(_database.workoutTemplateExercises)..where(
              (table) =>
                  table.id.equals(orderedIds[position]) &
                  table.templateId.equals(templateId),
            ))
            .write(
              WorkoutTemplateExercisesCompanion(position: Value(position)),
            );
      }
    });
  }
}
