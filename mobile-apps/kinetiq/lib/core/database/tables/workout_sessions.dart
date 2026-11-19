import 'package:drift/drift.dart';

import 'package:kinetiq/core/database/tables/workout_templates.dart';

/// Stores individual workout sessions.
///
/// A workout template defines what the user plans to do.
/// A workout session records an actual workout attempt.
///
/// Sessions are separate from templates so workout history
/// remains available even when templates are modified.
class WorkoutSessions extends Table {
  // ----------------------------------------------------------
  // PRIMARY KEY
  // ----------------------------------------------------------

  IntColumn get id => integer().autoIncrement()();

  // ----------------------------------------------------------
  // SOURCE WORKOUT TEMPLATE
  // ----------------------------------------------------------

  /// The template from which this session was started.
  ///
  /// Optional to support standalone workouts in the future.
  ///
  /// If a workout template is deleted, its session history
  /// is preserved by setting this reference to null.
  IntColumn get templateId => integer().nullable().references(
    WorkoutTemplates,
    #id,
    onDelete: KeyAction.setNull,
  )();

  /// Snapshot of the workout name when the session begins.
  ///
  /// This ensures history remains readable even if the
  /// original template is renamed or deleted.
  TextColumn get templateName => text()();

  // ----------------------------------------------------------
  // SESSION STATUS
  // ----------------------------------------------------------

  /// Supported status values:
  ///
  /// in_progress - The session is currently active.
  /// completed   - The user finished the session.
  /// cancelled   - The user cancelled the session.
  ///
  /// We will introduce a Dart enum when implementing
  /// the workout session domain and repository.
  TextColumn get status => text().withDefault(const Constant('in_progress'))();

  // ----------------------------------------------------------
  // SESSION TIMESTAMPS
  // ----------------------------------------------------------

  /// Time at which the workout session started.
  DateTimeColumn get startedAt => dateTime().withDefault(currentDateAndTime)();

  /// Time at which the workout session finished.
  ///
  /// Remains null while the session is in progress.
  DateTimeColumn get endedAt => dateTime().nullable()();

  // ----------------------------------------------------------
  // OPTIONAL SESSION NOTES
  // ----------------------------------------------------------

  /// Notes about the actual workout session.
  ///
  /// These are separate from workout template notes.
  TextColumn get notes => text().nullable()();
}
