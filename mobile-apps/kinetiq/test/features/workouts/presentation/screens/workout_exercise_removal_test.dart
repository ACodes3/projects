import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/data/repositories/exercise_repository.dart';
import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';
import 'package:kinetiq/features/workouts/data/repositories/workout_template_repository.dart';
import 'package:kinetiq/features/workouts/data/repositories/workout_template_exercise_repository.dart';
import 'package:kinetiq/features/workouts/presentation/screens/workout_template_details_screen.dart';
import 'package:kinetiq/features/workouts/providers/workout_template_providers.dart';
import 'package:kinetiq/features/workouts/providers/workout_template_exercise_providers.dart';

void main() {
  // ----------------------------------------------------------
  // TEST DATABASE AND REPOSITORIES
  // ----------------------------------------------------------

  late AppDatabase database;
  late WorkoutTemplateRepository templateRepository;
  late WorkoutTemplateExerciseRepository exerciseRepository;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());

    templateRepository = WorkoutTemplateRepository(database);

    exerciseRepository = WorkoutTemplateExerciseRepository(database);
  });

  // ----------------------------------------------------------
  // CREATE SAVED WORKOUT
  // ----------------------------------------------------------

  Future<({int templateId, int exerciseId, int workoutExerciseId})>
  createWorkoutWithExercise() async {
    final templateId = await templateRepository.createTemplate(
      const WorkoutTemplatesCompanion(name: Value('Push Day')),
    );

    final exerciseId = await database
        .into(database.exercises)
        .insert(
          const ExercisesCompanion(
            name: Value('Bench Press'),
            category: Value('strength'),
            trackingMode: Value('weight_reps'),
            isCustom: Value(true),
          ),
        );

    final workoutExerciseId = await exerciseRepository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(exerciseId),
        position: const Value(0),
        sets: const Value(4),
        targetReps: const Value(10),
        targetWeight: const Value(60.0),
      ),
    );

    return (
      templateId: templateId,
      exerciseId: exerciseId,
      workoutExerciseId: workoutExerciseId,
    );
  }

  // ----------------------------------------------------------
  // TEST APP
  // ----------------------------------------------------------

  Widget createTestApp(int templateId) {
    return ProviderScope(
      overrides: [
        workoutTemplateRepositoryProvider.overrideWithValue(
          WorkoutTemplateRepository(database),
        ),
        workoutTemplateExerciseRepositoryProvider.overrideWithValue(
          WorkoutTemplateExerciseRepository(database),
        ),
        exerciseRepositoryProvider.overrideWithValue(
          ExerciseRepository(database),
        ),
      ],
      child: MaterialApp(
        home: WorkoutTemplateDetailsScreen(templateId: templateId),
      ),
    );
  }

  // ----------------------------------------------------------
  // TEST HELPERS
  // ----------------------------------------------------------

  Future<void> openWorkout(WidgetTester tester, int templateId) async {
    await tester.pumpWidget(createTestApp(templateId));

    // Allow the asynchronous Drift streams to load.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  }

  Future<void> closeTestApp(WidgetTester tester) async {
    // Release Riverpod's stream subscriptions before
    // closing the in-memory SQLite database.
    await tester.pumpWidget(const SizedBox.shrink());

    await tester.pump(const Duration(milliseconds: 10));

    await database.close();
  }

  // ----------------------------------------------------------
  // TEST 1 — CANCEL EXERCISE REMOVAL
  // ----------------------------------------------------------

  testWidgets('Canceling removal keeps the exercise in the workout', (
    tester,
  ) async {
    final saved = await createWorkoutWithExercise();

    await openWorkout(tester, saved.templateId);

    expect(find.text('Bench Press'), findsOneWidget);

    // Open the removal confirmation dialog.
    await tester.tap(find.byTooltip('Remove from workout'));

    await tester.pumpAndSettle();

    expect(find.text('Remove Exercise?'), findsOneWidget);

    // Cancel instead of confirming.
    await tester.tap(find.text('CANCEL'));

    await tester.pumpAndSettle();

    // The confirmation dialog should be closed.
    expect(find.text('Remove Exercise?'), findsNothing);

    // The workout should still contain the exercise.
    final remaining = await exerciseRepository.getExercisesForTemplate(
      saved.templateId,
    );

    expect(remaining.length, 1);
    expect(remaining.single.id, saved.workoutExerciseId);

    expect(find.text('Bench Press'), findsOneWidget);

    await closeTestApp(tester);
  });

  // ----------------------------------------------------------
  // TEST 2 — CONFIRM EXERCISE REMOVAL
  // ----------------------------------------------------------

  testWidgets('Removing a workout exercise preserves its library record', (
    tester,
  ) async {
    final saved = await createWorkoutWithExercise();

    await openWorkout(tester, saved.templateId);

    expect(find.text('Bench Press'), findsOneWidget);

    // Open the confirmation dialog.
    await tester.tap(find.byTooltip('Remove from workout'));

    await tester.pumpAndSettle();

    expect(find.text('Remove Exercise?'), findsOneWidget);

    // Confirm removal.
    await tester.tap(find.text('REMOVE'));

    await tester.pump();

    // Allow the async repository write and stream
    // notification to finish.
    await tester.pump(const Duration(milliseconds: 300));

    // The workout/exercise association should be gone.
    final remaining = await exerciseRepository.getExercisesForTemplate(
      saved.templateId,
    );

    expect(remaining, isEmpty);

    // The original Exercise Library record must survive.
    final libraryExercise = await database
        .select(database.exercises)
        .getSingleOrNull();

    expect(libraryExercise, isNotNull);
    expect(libraryExercise!.id, saved.exerciseId);
    expect(libraryExercise.name, 'Bench Press');

    // The workout template itself must also survive.
    final template = await templateRepository.getTemplateById(saved.templateId);

    expect(template, isNotNull);
    expect(template!.name, 'Push Day');

    // The UI should return to the empty workout state.
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('0 exercises'), findsOneWidget);

    expect(
      find.text(
        'No exercises added yet.\n'
        'Add your first exercise below.',
      ),
      findsOneWidget,
    );

    await closeTestApp(tester);
  });
}
