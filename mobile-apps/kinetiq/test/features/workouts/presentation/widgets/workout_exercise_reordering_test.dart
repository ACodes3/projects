import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_template_exercise_card.dart';

void main() {
  // ----------------------------------------------------------
  // TEST DATA
  // ----------------------------------------------------------

  WorkoutTemplateExercise createExercise({
    required int id,
    required int position,
  }) {
    return WorkoutTemplateExercise(
      id: id,
      templateId: 1,
      exerciseId: id,
      position: position,
      sets: 3,
      targetReps: 10,
      restBetweenSetsSeconds: 60,
      restAfterExerciseSeconds: 90,
    );
  }

  // ----------------------------------------------------------
  // REUSABLE TEST WORKOUT BUILDER
  // ----------------------------------------------------------

  Widget createTestApp({required void Function(List<int>) onOrderChanged}) {
    final exercises = [
      createExercise(id: 1, position: 0),
      createExercise(id: 2, position: 1),
      createExercise(id: 3, position: 2),
    ];

    final exerciseNames = {1: 'Bench Press', 2: 'Squat', 3: 'Plank'};

    return MaterialApp(
      home: Scaffold(
        body: StatefulBuilder(
          builder: (context, setState) {
            return ReorderableListView.builder(
              buildDefaultDragHandles: false,
              itemCount: exercises.length,
              onReorderItem: (oldIndex, newIndex) {
                setState(() {
                  final moved = exercises.removeAt(oldIndex);
                  exercises.insert(newIndex, moved);
                });

                onOrderChanged(
                  exercises.map((exercise) => exercise.id).toList(),
                );
              },
              itemBuilder: (context, index) {
                final exercise = exercises[index];

                return WorkoutTemplateExerciseCard(
                  key: ValueKey(exercise.id),
                  exercise: exercise,
                  exerciseName:
                      exerciseNames[exercise.exerciseId] ?? 'Unknown exercise',
                  displayPosition: index + 1,
                  reorderIndex: index,
                  onEdit: () {},
                  onRemove: () {},
                );
              },
            );
          },
        ),
      ),
    );
  }

  // ----------------------------------------------------------
  // TEST 1 — ALL EXERCISES DISPLAY
  // ----------------------------------------------------------

  testWidgets('Displays all workout exercises in their initial order', (
    tester,
  ) async {
    await tester.pumpWidget(createTestApp(onOrderChanged: (_) {}));

    expect(find.text('Bench Press'), findsOneWidget);
    expect(find.text('Squat'), findsOneWidget);
    expect(find.text('Plank'), findsOneWidget);

    expect(find.text('1'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
  });

  // ----------------------------------------------------------
  // TEST 2 — DRAG HANDLES
  // ----------------------------------------------------------

  testWidgets('Provides a drag handle for each workout exercise', (
    tester,
  ) async {
    await tester.pumpWidget(createTestApp(onOrderChanged: (_) {}));

    expect(find.byIcon(Icons.drag_handle), findsNWidgets(3));

    expect(find.byType(ReorderableDragStartListener), findsNWidgets(3));
  });

  // ----------------------------------------------------------
  // TEST 3 — REORDER CALLBACK
  // ----------------------------------------------------------

  testWidgets('Reordering updates the exercise IDs and displayed order', (
    tester,
  ) async {
    List<int>? savedOrder;

    await tester.pumpWidget(
      createTestApp(
        onOrderChanged: (ids) {
          savedOrder = ids;
        },
      ),
    );

    // Simulate the reordered indices delivered by Flutter.
    //
    // onReorderItem already supplies an adjusted newIndex.
    final list = tester.widget<ReorderableListView>(
      find.byType(ReorderableListView),
    );

    list.onReorderItem!(0, 2);

    await tester.pump();

    expect(savedOrder, [2, 3, 1]);

    // All exercises must still exist.
    expect(find.text('Bench Press'), findsOneWidget);
    expect(find.text('Squat'), findsOneWidget);
    expect(find.text('Plank'), findsOneWidget);

    // The displayed numbering stays sequential.
    expect(find.text('1'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);

    // Confirm the visible order matches the new sequence.
    final names = tester
        .widgetList<Text>(
          find.byWidgetPredicate(
            (widget) =>
                widget is Text &&
                ['Bench Press', 'Squat', 'Plank'].contains(widget.data),
          ),
        )
        .map((widget) => widget.data)
        .toList();

    expect(names, ['Squat', 'Plank', 'Bench Press']);
  });
}
