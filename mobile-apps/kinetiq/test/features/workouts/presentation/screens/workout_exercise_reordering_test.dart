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
  late WorkoutTemplateExerciseRepository workoutExerciseRepository;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());

    templateRepository = WorkoutTemplateRepository(database);

    workoutExerciseRepository = WorkoutTemplateExerciseRepository(database);
  });

  // ----------------------------------------------------------
  // TEST DATA
  // ----------------------------------------------------------

  Future<({int templateId, int benchId, int squatId, int plankId})>
  createTestData() async {
    final templateId = await templateRepository.createTemplate(
      const WorkoutTemplatesCompanion(
        name: Value('Full Body'),
        description: Value('Three exercise workout'),
      ),
    );

    // Create three Exercise Library records.
    final benchLibraryId = await database
        .into(database.exercises)
        .insert(
          const ExercisesCompanion(
            name: Value('Bench Press'),
            category: Value('strength'),
            trackingMode: Value('weight_reps'),
            isCustom: Value(true),
          ),
        );

    final squatLibraryId = await database
        .into(database.exercises)
        .insert(
          const ExercisesCompanion(
            name: Value('Squat'),
            category: Value('strength'),
            trackingMode: Value('weight_reps'),
            isCustom: Value(true),
          ),
        );

    final plankLibraryId = await database
        .into(database.exercises)
        .insert(
          const ExercisesCompanion(
            name: Value('Plank'),
            category: Value('strength'),
            trackingMode: Value('duration'),
            isCustom: Value(true),
          ),
        );

    // Create the configured workout exercises.
    //
    // These returned IDs identify the workout-exercise
    // associations, not the Exercise Library records.
    final benchId = await workoutExerciseRepository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchLibraryId),
        position: const Value(0),
        sets: const Value(4),
        targetReps: const Value(10),
      ),
    );

    final squatId = await workoutExerciseRepository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(squatLibraryId),
        position: const Value(1),
        sets: const Value(5),
        targetReps: const Value(8),
      ),
    );

    final plankId = await workoutExerciseRepository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(plankLibraryId),
        position: const Value(2),
        sets: const Value(3),
        targetDurationSeconds: const Value(60),
      ),
    );

    return (
      templateId: templateId,
      benchId: benchId,
      squatId: squatId,
      plankId: plankId,
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

  void configureTestViewport(WidgetTester tester) {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(450, 1000);

    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  }

  Future<void> openWorkout(WidgetTester tester, int templateId) async {
    await tester.pumpWidget(createTestApp(templateId));

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  }

  Future<void> closeTestApp(WidgetTester tester) async {
    // Release all Riverpod subscriptions before closing
    // the in-memory database.
    await tester.pumpWidget(const SizedBox.shrink());

    await tester.pump(const Duration(milliseconds: 10));

    await database.close();
  }

  // ----------------------------------------------------------
  // TEST 1 — REORDER AND PERSIST TO SQLITE
  // ----------------------------------------------------------

  testWidgets('Reordering workout exercises persists positions in SQLite', (
    tester,
  ) async {
    configureTestViewport(tester);

    final saved = await createTestData();

    // ----------------------------------------------
    // VERIFY INITIAL DATABASE ORDER
    // ----------------------------------------------

    final initial = await workoutExerciseRepository.getExercisesForTemplate(
      saved.templateId,
    );

    expect(initial.map((exercise) => exercise.id).toList(), [
      saved.benchId,
      saved.squatId,
      saved.plankId,
    ]);

    expect(initial.map((exercise) => exercise.position).toList(), [0, 1, 2]);

    // ----------------------------------------------
    // OPEN THE ACTUAL WORKOUT DETAILS SCREEN
    // ----------------------------------------------

    await openWorkout(tester, saved.templateId);

    expect(find.text('Full Body'), findsOneWidget);
    expect(find.text('3 exercises'), findsOneWidget);

    expect(find.text('Bench Press'), findsOneWidget);
    expect(find.text('Squat'), findsOneWidget);
    expect(find.text('Plank'), findsOneWidget);

    expect(find.byType(ReorderableListView), findsOneWidget);

    // ----------------------------------------------
    // REORDER FIRST EXERCISE TO LAST POSITION
    // ----------------------------------------------

    // Invoke the callback on the ACTUAL screen's
    // ReorderableListView.
    //
    // onReorderItem already supplies the adjusted
    // destination index, so we use (0, 2).
    //
    // This tests the screen-to-repository connection
    // without depending on drag gesture timing.
    final reorderList = tester.widget<ReorderableListView>(
      find.byType(ReorderableListView),
    );

    reorderList.onReorderItem!(0, 2);

    // Allow the asynchronous transaction to complete
    // and the Drift stream to notify Riverpod.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // ----------------------------------------------
    // VERIFY SQLITE ORDER
    // ----------------------------------------------

    final reordered = await workoutExerciseRepository.getExercisesForTemplate(
      saved.templateId,
    );

    expect(reordered.map((exercise) => exercise.id).toList(), [
      saved.squatId,
      saved.plankId,
      saved.benchId,
    ]);

    expect(reordered.map((exercise) => exercise.position).toList(), [0, 1, 2]);

    // ----------------------------------------------
    // VERIFY EXERCISE SETTINGS WERE PRESERVED
    // ----------------------------------------------

    final bench = reordered.firstWhere(
      (exercise) => exercise.id == saved.benchId,
    );

    final squat = reordered.firstWhere(
      (exercise) => exercise.id == saved.squatId,
    );

    final plank = reordered.firstWhere(
      (exercise) => exercise.id == saved.plankId,
    );

    expect(bench.sets, 4);
    expect(bench.targetReps, 10);

    expect(squat.sets, 5);
    expect(squat.targetReps, 8);

    expect(plank.sets, 3);
    expect(plank.targetDurationSeconds, 60);

    // ----------------------------------------------
    // VERIFY THE UI RECEIVES THE NEW ORDER
    // ----------------------------------------------

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // Find the exercise names in their rendered order.
    final displayedNames = tester
        .widgetList<Text>(
          find.byWidgetPredicate(
            (widget) =>
                widget is Text &&
                const ['Bench Press', 'Squat', 'Plank'].contains(widget.data),
          ),
        )
        .map((widget) => widget.data)
        .toList();

    expect(displayedNames, ['Squat', 'Plank', 'Bench Press']);

    // All cards must still be present.
    expect(find.text('3 exercises'), findsOneWidget);
    expect(find.text('4 sets'), findsOneWidget);
    expect(find.text('5 sets'), findsOneWidget);
    expect(find.text('3 sets'), findsOneWidget);

    // ----------------------------------------------
    // CLEANUP
    // ----------------------------------------------

    await closeTestApp(tester);
  });
}
