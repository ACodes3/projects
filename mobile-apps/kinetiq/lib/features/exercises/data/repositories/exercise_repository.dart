import 'package:drift/drift.dart';

import 'package:kinetiq/core/database/app_database.dart';

/// Handles exercise-related database operations.
///
/// UI widgets should communicate with this repository
/// instead of writing database queries directly.
class ExerciseRepository {
  ExerciseRepository(this._database);

  final AppDatabase _database;

  /// Returns all exercises in alphabetical order.
  Future<List<Exercise>> getAllExercises() {
    return (_database.select(_database.exercises)
      ..orderBy([
            (table) => OrderingTerm.asc(table.name),
      ]))
        .get();
  }

  /// Watches exercises and emits updates when data changes.
  Stream<List<Exercise>> watchAllExercises() {
    return (_database.select(_database.exercises)
      ..orderBy([
            (table) => OrderingTerm.asc(table.name),
      ]))
        .watch();
  }

  /// Finds a single exercise by its ID.
  ///
  /// Returns null when no matching exercise exists.
  Future<Exercise?> getExerciseById(int id) {
    return (_database.select(_database.exercises)
      ..where((table) => table.id.equals(id)))
        .getSingleOrNull();
  }

  /// Inserts a new exercise and returns its generated ID.
  Future<int> createExercise(ExercisesCompanion exercise) {
    return _database.into(_database.exercises).insert(exercise);
  }

  /// Updates an existing exercise.
  ///
  /// Returns true when an exercise was updated.
  Future<bool> updateExercise(Exercise exercise) {
    return _database.update(_database.exercises).replace(exercise);
  }

  /// Deletes an exercise by its ID.
  ///
  /// Returns the number of deleted rows.
  Future<int> deleteExercise(int id) {
    return (_database.delete(_database.exercises)
      ..where((table) => table.id.equals(id)))
        .go();
  }
}
