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
  // TEST DATABASE
  // ----------------------------------------------------------

  late AppDatabase database;
  late WorkoutTemplateRepository templateRepository;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());

    templateRepository = WorkoutTemplateRepository(database);
  });

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
  // TEST CLEANUP
  // ----------------------------------------------------------

  Future<void> closeTestApp(WidgetTester tester) async {
    // Unmount widgets before closing the Drift database.
    await tester.pumpWidget(const SizedBox.shrink());

    await tester.pump(const Duration(milliseconds: 10));

    await database.close();
  }

  // ----------------------------------------------------------
  // TEST 1 — WORKOUT INFORMATION
  // ----------------------------------------------------------

  testWidgets('Displays the saved workout name and description', (
    tester,
  ) async {
    final templateId = await templateRepository.createTemplate(
      const WorkoutTemplatesCompanion(
        name: Value('Upper Body Workout'),
        description: Value('Chest and shoulders'),
      ),
    );

    await tester.pumpWidget(createTestApp(templateId));

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Upper Body Workout'), findsOneWidget);

    expect(find.text('Chest and shoulders'), findsOneWidget);

    expect(find.text('WORKOUT DETAILS'), findsOneWidget);

    await closeTestApp(tester);
  });

  // ----------------------------------------------------------
  // TEST 2 — EMPTY WORKOUT
  // ----------------------------------------------------------

  testWidgets('Displays the correct empty state when no exercises exist', (
    tester,
  ) async {
    final templateId = await templateRepository.createTemplate(
      const WorkoutTemplatesCompanion(name: Value('New Workout')),
    );

    await tester.pumpWidget(createTestApp(templateId));

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('0 exercises'), findsOneWidget);

    expect(
      find.text(
        'No exercises added yet.\n'
        'Add your first exercise below.',
      ),
      findsOneWidget,
    );

    expect(find.text('ADD EXERCISE'), findsOneWidget);

    await closeTestApp(tester);
  });

  // ----------------------------------------------------------
  // TEST 3 — MISSING WORKOUT
  // ----------------------------------------------------------

  testWidgets('Displays an informative message for a missing workout', (
    tester,
  ) async {
    await tester.pumpWidget(createTestApp(99999));

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Workout template not found.'), findsOneWidget);

    expect(find.text('ADD EXERCISE'), findsNothing);

    await closeTestApp(tester);
  });

  // ----------------------------------------------------------
  // TEST 4 — DISPLAY SAVED EXERCISE FROM SQLITE
  // ----------------------------------------------------------

  testWidgets('Displays saved exercise settings from SQLite', (tester) async {
    // ----------------------------------------------
    // CREATE WORKOUT TEMPLATE
    // ----------------------------------------------

    final templateId = await templateRepository.createTemplate(
      const WorkoutTemplatesCompanion(
        name: Value('Push Day'),
        description: Value('Strength training'),
      ),
    );

    // ----------------------------------------------
    // CREATE LIBRARY EXERCISE
    // ----------------------------------------------

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

    // ----------------------------------------------
    // ADD EXERCISE TO WORKOUT
    // ----------------------------------------------

    await database
        .into(database.workoutTemplateExercises)
        .insert(
          WorkoutTemplateExercisesCompanion(
            templateId: Value(templateId),
            exerciseId: Value(exerciseId),
            position: const Value(0),
            sets: const Value(4),
            targetReps: const Value(10),
            targetWeight: const Value(60.0),
            restBetweenSetsSeconds: const Value(75),
            restAfterExerciseSeconds: const Value(120),
            notes: const Value('Controlled movement'),
          ),
        );

    // ----------------------------------------------
    // OPEN WORKOUT DETAILS
    // ----------------------------------------------

    await tester.pumpWidget(createTestApp(templateId));

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // ----------------------------------------------
    // VERIFY WORKOUT INFORMATION
    // ----------------------------------------------

    expect(find.text('Push Day'), findsOneWidget);

    expect(find.text('Strength training'), findsOneWidget);

    // ----------------------------------------------
    // VERIFY EXERCISE COUNT AND NAME
    // ----------------------------------------------

    expect(find.text('1 exercises'), findsOneWidget);

    expect(find.text('Bench Press'), findsOneWidget);

    // ----------------------------------------------
    // VERIFY DISPLAY POSITION
    // ----------------------------------------------

    expect(find.text('1'), findsOneWidget);

    // ----------------------------------------------
    // VERIFY TRAINING TARGETS
    // ----------------------------------------------

    expect(find.text('4 sets'), findsOneWidget);

    expect(find.text('10 reps'), findsOneWidget);

    expect(find.text('60.0 kg'), findsOneWidget);

    // ----------------------------------------------
    // VERIFY REST SETTINGS
    // ----------------------------------------------

    expect(
      find.text(
        '75 sec between sets'
        ' · 120 sec after exercise',
      ),
      findsOneWidget,
    );

    // ----------------------------------------------
    // VERIFY OPTIONAL NOTES
    // ----------------------------------------------

    expect(find.text('Controlled movement'), findsOneWidget);

    // ----------------------------------------------
    // VERIFY ACTION BUTTONS
    // ----------------------------------------------

    expect(find.byTooltip('Edit exercise settings'), findsOneWidget);

    expect(find.byTooltip('Remove from workout'), findsOneWidget);

    // Our reorderable list should also show a handle.
    expect(find.byIcon(Icons.drag_handle), findsOneWidget);

    await closeTestApp(tester);
  });
}
