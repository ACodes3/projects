import 'package:drift/drift.dart';

/// Stores reusable workout routines.
///
/// Each workout template can later contain multiple exercises,
/// configured sets, rest periods, and other workout settings.
class WorkoutTemplates extends Table {
  // ----------------------------------------------------------
  // PRIMARY KEY
  // ----------------------------------------------------------

  IntColumn get id => integer().autoIncrement()();

  // ----------------------------------------------------------
  // TEMPLATE DETAILS
  // ----------------------------------------------------------

  /// Required workout name, e.g. "Upper Body".
  TextColumn get name => text().withLength(min: 1, max: 120)();

  /// Optional workout description.
  TextColumn get description => text().nullable()();

  /// Optional notes or instructions for the workout.
  TextColumn get notes => text().nullable()();

  // ----------------------------------------------------------
  // TEMPLATE SETTINGS
  // ----------------------------------------------------------

  /// Whether the template is marked as a favorite.
  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  // ----------------------------------------------------------
  // TIMESTAMPS
  // ----------------------------------------------------------

  /// When the workout template was created.
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  /// When the workout template was last updated.
  ///
  /// The repository will update this timestamp when editing.
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
}
