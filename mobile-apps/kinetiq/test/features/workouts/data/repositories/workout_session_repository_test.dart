import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/workouts/data/repositories/workout_session_repository.dart';
import 'package:kinetiq/features/workouts/data/repositories/workout_template_repository.dart';

void main() {
  // ----------------------------------------------------------
  // TEST DATABASE AND REPOSITORIES
  // ----------------------------------------------------------

  late AppDatabase database;
  late WorkoutTemplateRepository templateRepository;
  late WorkoutSessionRepository sessionRepository;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());

    templateRepository = WorkoutTemplateRepository(database);

    sessionRepository = WorkoutSessionRepository(database);
  });

  tearDown(() async {
    await database.close();
  });

  // ----------------------------------------------------------
  // REUSABLE TEST DATA
  // ----------------------------------------------------------

  Future<int> createTemplate({String name = 'Push Day'}) {
    return templateRepository.createTemplate(
      WorkoutTemplatesCompanion(name: Value(name)),
    );
  }

  // ----------------------------------------------------------
  // TEST 1 — START WORKOUT SESSION
  // ----------------------------------------------------------

  test('Starting a workout creates an active session', () async {
    final templateId = await createTemplate();

    final sessionId = await sessionRepository.startSessionFromTemplate(
      templateId,
    );

    final session = await sessionRepository.getSessionById(sessionId);

    expect(session, isNotNull);

    expect(session!.id, sessionId);
    expect(session.templateId, templateId);
    expect(session.templateName, 'Push Day');

    expect(session.status, WorkoutSessionRepository.inProgress);

    expect(session.startedAt, isA<DateTime>());
    expect(session.endedAt, isNull);
    expect(session.notes, isNull);
  });

  // ----------------------------------------------------------
  // TEST 2 — REJECT MISSING TEMPLATE
  // ----------------------------------------------------------

  test('Cannot start a workout from a missing template', () async {
    await expectLater(
      sessionRepository.startSessionFromTemplate(99999),
      throwsA(isA<StateError>()),
    );

    final sessions = await sessionRepository.getAllSessions();

    expect(sessions, isEmpty);
  });

  // ----------------------------------------------------------
  // TEST 3 — COMPLETE WORKOUT SESSION
  // ----------------------------------------------------------

  test('Completing a workout saves its status and end time', () async {
    final templateId = await createTemplate();

    final sessionId = await sessionRepository.startSessionFromTemplate(
      templateId,
    );

    final updatedRows = await sessionRepository.completeSession(sessionId);

    expect(updatedRows, 1);

    final session = await sessionRepository.getSessionById(sessionId);

    expect(session, isNotNull);

    expect(session!.status, WorkoutSessionRepository.completed);

    expect(session.endedAt, isNotNull);

    expect(session.endedAt!.isBefore(session.startedAt), isFalse);

    // A completed workout cannot be completed again.
    final secondAttempt = await sessionRepository.completeSession(sessionId);

    expect(secondAttempt, 0);

    final savedAgain = await sessionRepository.getSessionById(sessionId);

    expect(savedAgain!.status, WorkoutSessionRepository.completed);

    expect(savedAgain.endedAt, session.endedAt);
  });

  // ----------------------------------------------------------
  // TEST 4 — CANCEL WORKOUT SESSION
  // ----------------------------------------------------------

  test('Cancelling a workout preserves its session record', () async {
    final templateId = await createTemplate();

    final sessionId = await sessionRepository.startSessionFromTemplate(
      templateId,
    );

    final updatedRows = await sessionRepository.cancelSession(sessionId);

    expect(updatedRows, 1);

    final session = await sessionRepository.getSessionById(sessionId);

    expect(session, isNotNull);

    expect(session!.status, WorkoutSessionRepository.cancelled);

    expect(session.endedAt, isNotNull);

    // A cancelled workout cannot be completed.
    final completionAttempt = await sessionRepository.completeSession(
      sessionId,
    );

    expect(completionAttempt, 0);

    // Nor can it be cancelled a second time.
    final secondCancellation = await sessionRepository.cancelSession(sessionId);

    expect(secondCancellation, 0);

    // The session is preserved instead of deleted.
    final sessions = await sessionRepository.getAllSessions();

    expect(sessions, hasLength(1));
    expect(sessions.single.id, sessionId);
  });

  // ----------------------------------------------------------
  // TEST 5 — UPDATE SESSION NOTES
  // ----------------------------------------------------------

  test('Session notes can be saved, updated, and cleared', () async {
    final templateId = await createTemplate();

    final sessionId = await sessionRepository.startSessionFromTemplate(
      templateId,
    );

    // Save notes and trim surrounding whitespace.
    final firstUpdate = await sessionRepository.updateSessionNotes(
      sessionId,
      '  Felt strong today  ',
    );

    expect(firstUpdate, 1);

    var session = await sessionRepository.getSessionById(sessionId);

    expect(session!.notes, 'Felt strong today');

    // Replace existing notes.
    final secondUpdate = await sessionRepository.updateSessionNotes(
      sessionId,
      'Increased bench press weight',
    );

    expect(secondUpdate, 1);

    session = await sessionRepository.getSessionById(sessionId);

    expect(session!.notes, 'Increased bench press weight');

    // Empty notes should be stored as null.
    final clearUpdate = await sessionRepository.updateSessionNotes(
      sessionId,
      '',
    );

    expect(clearUpdate, 1);

    session = await sessionRepository.getSessionById(sessionId);

    expect(session!.notes, isNull);

    // Null also clears the notes.
    await sessionRepository.updateSessionNotes(sessionId, null);

    session = await sessionRepository.getSessionById(sessionId);

    expect(session!.notes, isNull);
  });

  // ----------------------------------------------------------
  // TEST 6 — PRESERVE HISTORICAL WORKOUT NAME
  // ----------------------------------------------------------

  test(
    'Session keeps its original workout name after template changes',
    () async {
      final templateId = await createTemplate(name: 'Original Push Day');

      final sessionId = await sessionRepository.startSessionFromTemplate(
        templateId,
      );

      // Rename the original workout template.
      final template = await templateRepository.getTemplateById(templateId);

      expect(template, isNotNull);

      await templateRepository.updateTemplate(
        template!.copyWith(name: 'Renamed Workout'),
      );

      // The session must retain its historical name.
      var session = await sessionRepository.getSessionById(sessionId);

      expect(session, isNotNull);
      expect(session!.templateName, 'Original Push Day');

      // Delete the original template.
      await templateRepository.deleteTemplate(templateId);

      // The foreign key should become null,
      // but the session must remain accessible.
      session = await sessionRepository.getSessionById(sessionId);

      expect(session, isNotNull);
      expect(session!.templateId, isNull);
      expect(session.templateName, 'Original Push Day');

      final sessions = await sessionRepository.getAllSessions();

      expect(sessions, hasLength(1));
    },
  );

  // ----------------------------------------------------------
  // TEST 7 — ACTIVE SESSIONS AND HISTORY
  // ----------------------------------------------------------

  test('Active sessions exclude completed and cancelled workouts', () async {
    final templateId = await createTemplate();

    final firstId = await sessionRepository.startSessionFromTemplate(
      templateId,
    );

    final secondId = await sessionRepository.startSessionFromTemplate(
      templateId,
    );

    final thirdId = await sessionRepository.startSessionFromTemplate(
      templateId,
    );

    // Complete the first workout.
    await sessionRepository.completeSession(firstId);

    // Cancel the second workout.
    await sessionRepository.cancelSession(secondId);

    // The third workout remains in progress.
    final activeSessions = await sessionRepository.watchActiveSessions().first;

    expect(activeSessions, hasLength(1));

    expect(activeSessions.single.id, thirdId);

    expect(activeSessions.single.status, WorkoutSessionRepository.inProgress);

    // All three sessions must remain in history.
    final allSessions = await sessionRepository.getAllSessions();

    expect(allSessions, hasLength(3));

    expect(allSessions.map((session) => session.id).toSet(), {
      firstId,
      secondId,
      thirdId,
    });

    // The all-sessions stream should also return
    // the same saved workout history.
    final watchedSessions = await sessionRepository.watchAllSessions().first;

    expect(watchedSessions, hasLength(3));

    expect(watchedSessions.map((session) => session.id).toSet(), {
      firstId,
      secondId,
      thirdId,
    });

    // Verify that a non-existent session returns null.
    final missingSession = await sessionRepository.getSessionById(99999);

    expect(missingSession, isNull);
  });
}
