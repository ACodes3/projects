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
  // CREATE SAVED WORKOUT WITH EXERCISE
  // ----------------------------------------------------------

  Future<({int templateId, int exerciseId, int workoutExerciseId})>
  createTestData() async {
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

    final workoutExerciseId = await workoutExerciseRepository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(exerciseId),
        position: const Value(0),
        sets: const Value(3),
        targetReps: const Value(10),
        targetWeight: const Value(60.0),
        restBetweenSetsSeconds: const Value(60),
        restAfterExerciseSeconds: const Value(90),
        notes: const Value('Original instructions'),
      ),
    );

    return (
      templateId: templateId,
      exerciseId: exerciseId,
      workoutExerciseId: workoutExerciseId,
    );
  }

  // ----------------------------------------------------------
  // TEST APPLICATION
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

  Finder fieldWithLabel(String label) {
    return find.byWidgetPredicate(
      (widget) => widget is TextField && widget.decoration?.labelText == label,
    );
  }

  Future<void> enterFieldValue(
    WidgetTester tester,
    String label,
    String value,
  ) async {
    final field = fieldWithLabel(label);

    expect(field, findsOneWidget, reason: 'Could not find field: $label');

    await tester.ensureVisible(field);
    await tester.pumpAndSettle();

    await tester.enterText(field, value);
    await tester.pump();
  }

  Future<void> closeTestApp(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox.shrink());

    await tester.pump(const Duration(milliseconds: 10));

    await database.close();
  }

  // ----------------------------------------------------------
  // TEST 1 — EDIT EXISTING EXERCISE SETTINGS
  // ----------------------------------------------------------

  testWidgets('Editing a workout exercise updates SQLite and the UI', (
    tester,
  ) async {
    // ----------------------------------------------
    // PREPARE TEST WINDOW AND SQLITE DATA
    // ----------------------------------------------

    configureTestViewport(tester);

    final saved = await createTestData();

    // ----------------------------------------------
    // OPEN WORKOUT DETAILS
    // ----------------------------------------------

    await openWorkout(tester, saved.templateId);

    expect(find.text('Push Day'), findsOneWidget);

    expect(find.text('Bench Press'), findsOneWidget);

    expect(find.text('3 sets'), findsOneWidget);

    expect(find.text('10 reps'), findsOneWidget);

    expect(find.text('60.0 kg'), findsOneWidget);

    // ----------------------------------------------
    // OPEN EDIT SETTINGS DIALOG
    // ----------------------------------------------

    await tester.tap(find.byTooltip('Edit exercise settings'));

    await tester.pumpAndSettle();

    expect(find.byType(WorkoutExerciseSettingsDialog), findsOneWidget);

    expect(find.text('Edit Exercise Settings'), findsOneWidget);

    expect(find.text('SAVE CHANGES'), findsOneWidget);

    // Existing values should populate the form.
    expect(
      tester.widget<TextField>(fieldWithLabel('Sets *')).controller!.text,
      '3',
    );

    expect(
      tester
          .widget<TextField>(fieldWithLabel('Target reps (optional)'))
          .controller!
          .text,
      '10',
    );

    expect(
      tester
          .widget<TextField>(fieldWithLabel('Target weight (optional)'))
          .controller!
          .text,
      '60.0',
    );

    // ----------------------------------------------
    // UPDATE EXERCISE CONFIGURATION
    // ----------------------------------------------

    await enterFieldValue(tester, 'Sets *', '5');

    await enterFieldValue(tester, 'Target reps (optional)', '8');

    await enterFieldValue(tester, 'Target weight (optional)', '75.5');

    await enterFieldValue(tester, 'Rest between sets *', '120');

    await enterFieldValue(tester, 'Rest after exercise *', '180');

    await enterFieldValue(tester, 'Notes (optional)', 'Pause at the bottom');

    // ----------------------------------------------
    // SAVE CHANGES
    // ----------------------------------------------

    tester.testTextInput.hide();

    await tester.pump();

    final saveButton = find.text('SAVE CHANGES');

    await tester.ensureVisible(saveButton);
    await tester.pumpAndSettle();

    await tester.tap(saveButton);
    await tester.pumpAndSettle();

    await tester.pump(const Duration(milliseconds: 300));

    // ----------------------------------------------
    // VERIFY SQLITE CONFIGURATION
    // ----------------------------------------------

    final updated = await workoutExerciseRepository.getTemplateExerciseById(
      saved.workoutExerciseId,
    );

    expect(updated, isNotNull);

    // Editing must not replace the workout association.
    expect(updated!.id, saved.workoutExerciseId);
    expect(updated.templateId, saved.templateId);
    expect(updated.exerciseId, saved.exerciseId);
    expect(updated.position, 0);

    // Verify the updated training targets.
    expect(updated.sets, 5);
    expect(updated.targetReps, 8);
    expect(updated.targetWeight, 75.5);

    // Verify rest periods and notes.
    expect(updated.restBetweenSetsSeconds, 120);
    expect(updated.restAfterExerciseSeconds, 180);
    expect(updated.notes, 'Pause at the bottom');

    // ----------------------------------------------
    // VERIFY LIBRARY EXERCISE WAS NOT MODIFIED
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

    expect(find.text('Bench Press'), findsOneWidget);

    expect(find.text('5 sets'), findsOneWidget);

    expect(find.text('8 reps'), findsOneWidget);

    expect(find.text('75.5 kg'), findsOneWidget);

    expect(
      find.text(
        '120 sec between sets'
        ' · 180 sec after exercise',
      ),
      findsOneWidget,
    );

    expect(find.text('Pause at the bottom'), findsOneWidget);

    // Previous values should no longer be displayed.
    expect(find.text('3 sets'), findsNothing);

    expect(find.text('Original instructions'), findsNothing);

    // ----------------------------------------------
    // CLEANUP
    // ----------------------------------------------

    await closeTestApp(tester);
  });
}
