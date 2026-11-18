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
import 'package:kinetiq/features/workouts/presentation/widgets/workout_exercise_picker_dialog.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_exercise_settings_dialog.dart';

import 'package:kinetiq/features/workouts/providers/workout_template_providers.dart';
import 'package:kinetiq/features/workouts/providers/workout_template_exercise_providers.dart';

void main() {
  // ----------------------------------------------------------
  // TEST DATABASE AND REPOSITORIES
  // ----------------------------------------------------------

  late AppDatabase database;
  late WorkoutTemplateRepository templateRepository;
  late WorkoutTemplateExerciseRepository workoutExerciseRepository;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());

    templateRepository = WorkoutTemplateRepository(database);

    workoutExerciseRepository = WorkoutTemplateExerciseRepository(database);
  });

  // ----------------------------------------------------------
  // CREATE WORKOUT AND LIBRARY EXERCISE
  // ----------------------------------------------------------

  Future<({int templateId, int exerciseId})> createTestData() async {
    final templateId = await templateRepository.createTemplate(
      const WorkoutTemplatesCompanion(
        name: Value('Push Day'),
        description: Value('Chest and shoulders'),
      ),
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

    return (templateId: templateId, exerciseId: exerciseId);
  }

  // ----------------------------------------------------------
  // CREATE TEST APP
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

  /// Gives this integration test enough room to display
  /// the Workout Details screen and its modal dialogs.
  ///
  /// The default Flutter test viewport is relatively short.
  /// A tall viewport avoids unrelated layout overflows
  /// while testing the Add Exercise persistence flow.
  void configureTestViewport(WidgetTester tester) {
    tester.view.devicePixelRatio = 1.0;

    tester.view.physicalSize = const Size(450, 1000);

    // Restore Flutter's default test viewport after the test.
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  }

  Future<void> openWorkout(WidgetTester tester, int templateId) async {
    await tester.pumpWidget(createTestApp(templateId));

    // Allow Riverpod and Drift streams to load.
    await tester.pump();

    await tester.pump(const Duration(milliseconds: 300));
  }

  Future<void> closeTestApp(WidgetTester tester) async {
    // Unmount the ProviderScope before closing SQLite.
    await tester.pumpWidget(const SizedBox.shrink());

    await tester.pump(const Duration(milliseconds: 10));

    await database.close();
  }

  // ----------------------------------------------------------
  // TEST 1 — ADD EXERCISE THROUGH WORKOUT DETAILS
  // ----------------------------------------------------------

  testWidgets('Adding an exercise saves it to SQLite and updates the workout', (
    tester,
  ) async {
    // ----------------------------------------------
    // CONFIGURE TEST WINDOW
    // ----------------------------------------------

    configureTestViewport(tester);

    // ----------------------------------------------
    // PREPARE SQLITE DATA
    // ----------------------------------------------

    final saved = await createTestData();

    // ----------------------------------------------
    // OPEN EMPTY WORKOUT
    // ----------------------------------------------

    await openWorkout(tester, saved.templateId);

    expect(find.text('Push Day'), findsOneWidget);

    expect(find.text('0 exercises'), findsOneWidget);

    expect(find.text('ADD EXERCISE'), findsOneWidget);

    // ----------------------------------------------
    // OPEN EXERCISE PICKER
    // ----------------------------------------------

    await tester.tap(find.text('ADD EXERCISE'));

    await tester.pumpAndSettle();

    expect(find.byType(WorkoutExercisePickerDialog), findsOneWidget);

    expect(find.text('Bench Press'), findsOneWidget);

    // ----------------------------------------------
    // SELECT EXERCISE
    // ----------------------------------------------

    await tester.tap(find.text('Bench Press'));

    await tester.pumpAndSettle();

    expect(find.byType(WorkoutExerciseSettingsDialog), findsOneWidget);

    expect(find.text('Configure Exercise'), findsOneWidget);

    // ----------------------------------------------
    // SAVE DEFAULT CONFIGURATION
    // ----------------------------------------------

    await tester.tap(find.text('ADD TO WORKOUT'));

    await tester.pumpAndSettle();

    // Allow the asynchronous SQLite write and
    // Riverpod stream notification to complete.
    await tester.pump();

    await tester.pump(const Duration(milliseconds: 300));

    // ----------------------------------------------
    // VERIFY SQLITE DATA
    // ----------------------------------------------

    final workoutExercises = await workoutExerciseRepository
        .getExercisesForTemplate(saved.templateId);

    expect(workoutExercises, hasLength(1));

    final workoutExercise = workoutExercises.single;

    expect(workoutExercise.templateId, saved.templateId);

    expect(workoutExercise.exerciseId, saved.exerciseId);

    expect(workoutExercise.position, 0);

    // Default workout configuration.
    expect(workoutExercise.sets, 3);

    expect(workoutExercise.restBetweenSetsSeconds, 60);

    expect(workoutExercise.restAfterExerciseSeconds, 90);

    // Optional targets are not required.
    expect(workoutExercise.targetReps, isNull);

    expect(workoutExercise.targetWeight, isNull);

    expect(workoutExercise.targetDurationSeconds, isNull);

    expect(workoutExercise.targetDistanceKm, isNull);

    expect(workoutExercise.notes, isNull);

    // ----------------------------------------------
    // VERIFY EXERCISE LIBRARY PRESERVED
    // ----------------------------------------------

    final libraryExercise = await database
        .select(database.exercises)
        .getSingleOrNull();

    expect(libraryExercise, isNotNull);

    expect(libraryExercise!.id, saved.exerciseId);

    expect(libraryExercise.name, 'Bench Press');

    // ----------------------------------------------
    // VERIFY UPDATED WORKOUT UI
    // ----------------------------------------------

    await tester.pump();

    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('1 exercises'), findsOneWidget);

    expect(find.text('Bench Press'), findsOneWidget);

    expect(find.text('3 sets'), findsOneWidget);

    expect(find.text('1'), findsOneWidget);

    expect(find.byTooltip('Edit exercise settings'), findsOneWidget);

    expect(find.byTooltip('Remove from workout'), findsOneWidget);

    expect(find.byIcon(Icons.drag_handle), findsOneWidget);

    // ----------------------------------------------
    // CLEANUP
    // ----------------------------------------------

    await closeTestApp(tester);
  });
}
