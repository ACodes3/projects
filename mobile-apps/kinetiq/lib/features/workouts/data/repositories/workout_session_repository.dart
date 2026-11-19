
import 'package:drift/drift.dart';

import 'package:kinetiq/core/database/app_database.dart';

/// Manages actual workout sessions stored in SQLite.
///
/// Workout sessions are separate from workout templates.
///
/// A template describes the planned workout.
/// A session records an actual workout attempt.
///
/// This repository is responsible for:
/// - Starting workout sessions
/// - Retrieving saved sessions
/// - Watching session changes
/// - Completing workout sessions
/// - Cancelling workout sessions
/// - Updating session notes
///
/// Exercise performance and individual set logs will
/// be managed by separate repositories in later steps.
class WorkoutSessionRepository {
  const WorkoutSessionRepository(this._database);

  final AppDatabase _database;

  // ----------------------------------------------------------
  // SESSION STATUS VALUES
  // ----------------------------------------------------------

  static const String inProgress = 'in_progress';
  static const String completed = 'completed';
  static const String cancelled = 'cancelled';

  // ----------------------------------------------------------
  // START WORKOUT FROM TEMPLATE
  // ----------------------------------------------------------

  /// Starts a new session using an existing workout template.
  ///
  /// The template name is copied into the session so
  /// future template changes cannot alter workout history.
  ///
  /// Throws a StateError if the template does not exist.
  Future<int> startSessionFromTemplate(int templateId) async {
    return _database.transaction(() async {
      final template = await (_database.select(
        _database.workoutTemplates,
      )..where(
            (table) => table.id.equals(templateId),
      )).getSingleOrNull();

      if (template == null) {
        throw StateError(
          'Workout template does not exist.',
        );
      }

      final now = DateTime.now();

      return _database
          .into(_database.workoutSessions)
          .insert(
        WorkoutSessionsCompanion.insert(
          templateId: Value(template.id),
          templateName: template.name,
          status: const Value(inProgress),
          startedAt: Value(now),
        ),
      );
    });
  }

  // ----------------------------------------------------------
  // GET SESSION BY ID
  // ----------------------------------------------------------

  /// Returns a saved workout session.
  ///
  /// Returns null when the session does not exist.
  Future<WorkoutSession?> getSessionById(
      int sessionId,
      ) {
    return (_database.select(_database.workoutSessions)
      ..where(
            (table) => table.id.equals(sessionId),
      ))
        .getSingleOrNull();
  }

  // ----------------------------------------------------------
  // GET ALL SESSIONS
  // ----------------------------------------------------------

  /// Returns every saved workout session.
  ///
  /// Newest sessions appear first.
  Future<List<WorkoutSession>> getAllSessions() {
    return (_database.select(_database.workoutSessions)
      ..orderBy([
            (table) => OrderingTerm.desc(
          table.startedAt,
        ),
            (table) => OrderingTerm.desc(
          table.id,
        ),
      ]))
        .get();
  }

  // ----------------------------------------------------------
  // WATCH ALL SESSIONS
  // ----------------------------------------------------------

  /// Watches workout sessions reactively.
  ///
  /// Drift automatically emits updates when sessions
  /// are started, completed, cancelled, or edited.
  Stream<List<WorkoutSession>> watchAllSessions() {
    return (_database.select(_database.workoutSessions)
      ..orderBy([
            (table) => OrderingTerm.desc(
          table.startedAt,
        ),
            (table) => OrderingTerm.desc(
          table.id,
        ),
      ]))
        .watch();
  }

  // ----------------------------------------------------------
  // WATCH ACTIVE SESSIONS
  // ----------------------------------------------------------

  /// Watches sessions that are currently in progress.
  Stream<List<WorkoutSession>> watchActiveSessions() {
    return (_database.select(_database.workoutSessions)
      ..where(
            (table) => table.status.equals(inProgress),
      )
      ..orderBy([
            (table) => OrderingTerm.desc(
          table.startedAt,
        ),
            (table) => OrderingTerm.desc(
          table.id,
        ),
      ]))
        .watch();
  }

  // ----------------------------------------------------------
  // COMPLETE SESSION
  // ----------------------------------------------------------

  /// Marks an active workout session as completed.
  ///
  /// Returns the number of updated rows.
  ///
  /// A completed or cancelled session cannot be
  /// completed again.
  ///
  /// The end timestamp is saved automatically.
  Future<int> completeSession(
      int sessionId,
      ) {
    return (_database.update(_database.workoutSessions)
      ..where(
            (table) =>
        table.id.equals(sessionId) &
        table.status.equals(inProgress),
      ))
        .write(
      WorkoutSessionsCompanion(
        status: const Value(completed),
        endedAt: Value(DateTime.now()),
      ),
    );
  }

  // ----------------------------------------------------------
  // CANCEL SESSION
  // ----------------------------------------------------------

  /// Marks an active workout session as cancelled.
  ///
  /// The session remains in SQLite for historical
  /// consistency rather than being deleted.
  ///
  /// Returns the number of updated rows.
  Future<int> cancelSession(
      int sessionId,
      ) {
    return (_database.update(_database.workoutSessions)
      ..where(
            (table) =>
        table.id.equals(sessionId) &
        table.status.equals(inProgress),
      ))
        .write(
      WorkoutSessionsCompanion(
        status: const Value(cancelled),
        endedAt: Value(DateTime.now()),
      ),
    );
  }

  // ----------------------------------------------------------
  // UPDATE SESSION NOTES
  // ----------------------------------------------------------

  /// Updates notes for an existing workout session.
  ///
  /// Passing null clears the notes.
  ///
  /// Returns the number of updated rows.
  Future<int> updateSessionNotes(
      int sessionId,
      String? notes,
      ) {
    final cleanedNotes = notes?.trim();

    return (_database.update(_database.workoutSessions)
      ..where(
            (table) => table.id.equals(sessionId),
      ))
        .write(
      WorkoutSessionsCompanion(
        notes: Value(
          cleanedNotes == null || cleanedNotes.isEmpty
              ? null
              : cleanedNotes,
        ),
      ),
    );
  }
}
