import 'package:drift/drift.dart';

/// Stores built-in and user-created exercises.
class Exercises extends Table {
  /// Unique exercise identifier.
  IntColumn get id => integer().autoIncrement()();

  /// Exercise name, e.g. Bench Press or Running.
  TextColumn get name => text().withLength(
    min: 1,
    max: 120,
  )();

  /// Exercise category: strength or cardio.
  TextColumn get category => text().withDefault(
    const Constant('strength'),
  )();

  /// Primary muscle group, e.g. chest, back, or legs.
  /// Optional because cardio exercises may not have one.
  TextColumn get muscleGroup => text().nullable()();

  /// Tracking mode, e.g. reps, duration, or distance.
  TextColumn get trackingMode => text().withDefault(
    const Constant('reps'),
  )();

  /// Whether this exercise was created by the user.
  BoolColumn get isCustom => boolean().withDefault(
    const Constant(false),
  )();

  /// Optional exercise instructions or notes.
  TextColumn get notes => text().nullable()();

  /// Timestamp when the exercise was created.
  DateTimeColumn get createdAt => dateTime().withDefault(
    currentDateAndTime,
  )();
}
