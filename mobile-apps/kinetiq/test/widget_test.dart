
import 'package:flutter_test/flutter_test.dart';

import 'package:kinetiq/app/app.dart';

void main() {
  // ------------------------------------------------------------
  // TEST 1 — Welcome screen navigation
  // ------------------------------------------------------------

  testWidgets('Welcome screen navigates to Home', (
      WidgetTester tester,
      ) async {
    // Launch KINETIQ.
    await tester.pumpWidget(const KinetiqApp());

    // Verify the welcome screen.
    expect(find.text('KINETIQ'), findsOneWidget);
    expect(find.text('TRAIN. TRACK. EVOLVE.'), findsOneWidget);
    expect(find.text('GET STARTED'), findsOneWidget);

    // Navigate to Home.
    await tester.tap(find.text('GET STARTED'));
    await tester.pumpAndSettle();

    // Verify Home is displayed.
    expect(find.text('Ready to move?'), findsOneWidget);
    expect(find.text('GET STARTED'), findsNothing);
  });

  // ------------------------------------------------------------
  // TEST 2 — Bottom navigation
  // ------------------------------------------------------------

  testWidgets('Bottom navigation switches between all four tabs', (
      WidgetTester tester,
      ) async {
    // Launch KINETIQ.
    await tester.pumpWidget(const KinetiqApp());

    // Enter the main application.
    await tester.tap(find.text('GET STARTED'));
    await tester.pumpAndSettle();

    // Verify Home.
    expect(find.text('Ready to move?'), findsOneWidget);

    // Navigate to Workouts.
    await tester.tap(find.text('Workouts'));
    await tester.pumpAndSettle();
    expect(find.text('Your workouts'), findsOneWidget);

    // Navigate to History.
    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();
    expect(find.text('Training history'), findsOneWidget);

    // Navigate to Progress.
    await tester.tap(find.text('Progress'));
    await tester.pumpAndSettle();
    expect(find.text('Your progress'), findsOneWidget);

    // Return to Home.
    await tester.tap(find.text('Home'));
    await tester.pumpAndSettle();
    expect(find.text('Ready to move?'), findsOneWidget);
  });
}
