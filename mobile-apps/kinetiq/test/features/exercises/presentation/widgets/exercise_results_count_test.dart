
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/features/exercises/presentation/widgets/exercise_results_count.dart';

void main() {
  // ----------------------------------------------------------
  // TEST 1 — Display filtered exercise count
  // ----------------------------------------------------------

  testWidgets('Displays the number of visible exercises', (
      WidgetTester tester,
      ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ExerciseResultsCount(
            visibleCount: 3,
            totalCount: 8,
          ),
        ),
      ),
    );

    expect(
      find.text('Showing 3 of 8 exercises'),
      findsOneWidget,
    );
  });

  // ----------------------------------------------------------
  // TEST 2 — Handle a single exercise
  // ----------------------------------------------------------

  testWidgets('Uses singular label for one exercise', (
      WidgetTester tester,
      ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ExerciseResultsCount(
            visibleCount: 1,
            totalCount: 1,
          ),
        ),
      ),
    );

    expect(
      find.text('Showing 1 of 1 exercise'),
      findsOneWidget,
    );
  });

  // ----------------------------------------------------------
  // TEST 3 — Handle zero matching exercises
  // ----------------------------------------------------------

  testWidgets('Displays zero matching exercises', (
      WidgetTester tester,
      ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ExerciseResultsCount(
            visibleCount: 0,
            totalCount: 5,
          ),
        ),
      ),
    );

    expect(
      find.text('Showing 0 of 5 exercises'),
      findsOneWidget,
    );
  });
}
