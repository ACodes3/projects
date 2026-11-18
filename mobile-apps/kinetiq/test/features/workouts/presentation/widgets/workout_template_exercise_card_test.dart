import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_template_exercise_card.dart';

void main() {
  // ----------------------------------------------------------
  // TEST DATA
  // ----------------------------------------------------------

  WorkoutTemplateExercise createExercise({
    int sets = 4,
    int? targetReps = 10,
    double? targetWeight = 60.0,
    int restBetweenSetsSeconds = 75,
    int restAfterExerciseSeconds = 120,
    String? notes = 'Keep chest up',
  }) {
    return WorkoutTemplateExercise(
      id: 1,
      templateId: 1,
      exerciseId: 10,
      position: 0,
      sets: sets,
      targetReps: targetReps,
      targetWeight: targetWeight,
      restBetweenSetsSeconds: restBetweenSetsSeconds,
      restAfterExerciseSeconds: restAfterExerciseSeconds,
      notes: notes,
    );
  }

  // ----------------------------------------------------------
  // TEST 1 — DISPLAY SAVED EXERCISE SETTINGS
  // ----------------------------------------------------------

  testWidgets('Displays exercise name, number, targets, rest, and notes', (
    tester,
  ) async {
    final exercise = createExercise();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: WorkoutTemplateExerciseCard(
              exercise: exercise,
              exerciseName: 'Bench Press',
              displayPosition: 1,
              onEdit: () {},
              onRemove: () {},
            ),
          ),
        ),
      ),
    );

    // Exercise identity.
    expect(find.text('Bench Press'), findsOneWidget);
    expect(find.text('1'), findsOneWidget);

    // Training targets.
    expect(find.text('4 sets'), findsOneWidget);
    expect(find.text('10 reps'), findsOneWidget);
    expect(find.text('60.0 kg'), findsOneWidget);

    // Rest settings.
    expect(
      find.text(
        '75 sec between sets'
        ' · 120 sec after exercise',
      ),
      findsOneWidget,
    );

    // Optional notes.
    expect(find.text('Keep chest up'), findsOneWidget);
  });

  // ----------------------------------------------------------
  // TEST 2 — EDIT BUTTON
  // ----------------------------------------------------------

  testWidgets('Calls onEdit when edit button is tapped', (tester) async {
    var editCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkoutTemplateExerciseCard(
            exercise: createExercise(),
            exerciseName: 'Bench Press',
            displayPosition: 1,
            onEdit: () {
              editCount++;
            },
            onRemove: () {},
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('Edit exercise settings'));

    expect(editCount, 1);
  });

  // ----------------------------------------------------------
  // TEST 3 — REMOVE BUTTON
  // ----------------------------------------------------------

  testWidgets('Calls onRemove when remove button is tapped', (tester) async {
    var removeCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkoutTemplateExerciseCard(
            exercise: createExercise(),
            exerciseName: 'Bench Press',
            displayPosition: 1,
            onEdit: () {},
            onRemove: () {
              removeCount++;
            },
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('Remove from workout'));

    expect(removeCount, 1);
  });

  // ----------------------------------------------------------
  // TEST 4 — OPTIONAL NOTES
  // ----------------------------------------------------------

  testWidgets('Hides notes section when no notes exist', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkoutTemplateExerciseCard(
            exercise: createExercise(notes: null),
            exerciseName: 'Squat',
            displayPosition: 2,
            onEdit: () {},
            onRemove: () {},
          ),
        ),
      ),
    );

    expect(find.text('Squat'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);

    expect(find.text('Keep chest up'), findsNothing);
  });

  // ----------------------------------------------------------
  // TEST 5 — DRAG HANDLE VISIBILITY
  // ----------------------------------------------------------

  testWidgets('Does not display drag handle when reorderIndex is null', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkoutTemplateExerciseCard(
            exercise: createExercise(),
            exerciseName: 'Bench Press',
            displayPosition: 1,
            onEdit: () {},
            onRemove: () {},
          ),
        ),
      ),
    );

    expect(find.byIcon(Icons.drag_handle), findsNothing);
  });
}
