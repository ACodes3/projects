import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/app.dart';
import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/core/providers/database_provider.dart';

void main() {
  // ------------------------------------------------------------
  // TEST 1 — WELCOME SCREEN NAVIGATION
  // ------------------------------------------------------------

  testWidgets('Welcome screen navigates to Home', (WidgetTester tester) async {
    // Launch KINETIQ.
    await tester.pumpWidget(const ProviderScope(child: KinetiqApp()));

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

    // Clean up the widget tree.
    await tester.pumpWidget(const SizedBox.shrink());

    await tester.pump(const Duration(milliseconds: 10));
  });

  // ------------------------------------------------------------
  // TEST 2 — BOTTOM NAVIGATION
  // ------------------------------------------------------------

  testWidgets('Bottom navigation switches between all four tabs', (
    WidgetTester tester,
  ) async {
    // --------------------------------------------------------
    // SET UP IN-MEMORY DATABASE
    // --------------------------------------------------------

    final database = AppDatabase.forTesting(NativeDatabase.memory());

    // Launch KINETIQ with an isolated SQLite database.
    await tester.pumpWidget(
      ProviderScope(
        overrides: [databaseProvider.overrideWith((ref) => database)],
        child: const KinetiqApp(),
      ),
    );

    // --------------------------------------------------------
    // NAVIGATE FROM WELCOME TO HOME
    // --------------------------------------------------------

    await tester.tap(find.text('GET STARTED'));

    await tester.pumpAndSettle();

    expect(find.text('Ready to move?'), findsOneWidget);

    // --------------------------------------------------------
    // WORKOUTS TAB
    // --------------------------------------------------------

    await tester.tap(find.text('Workouts'));

    // Allow navigation and Riverpod to rebuild.
    // Avoid pumpAndSettle while loading indicators animate.
    await tester.pump();

    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Workout Templates'), findsOneWidget);

    // --------------------------------------------------------
    // HISTORY TAB
    // --------------------------------------------------------

    await tester.tap(find.text('History'));

    await tester.pump();

    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Training history'), findsOneWidget);

    // --------------------------------------------------------
    // PROGRESS TAB
    // --------------------------------------------------------

    await tester.tap(find.text('Progress'));

    await tester.pump();

    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Your progress'), findsOneWidget);

    // --------------------------------------------------------
    // RETURN TO HOME
    // --------------------------------------------------------

    await tester.tap(find.text('Home'));

    await tester.pump();

    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Ready to move?'), findsOneWidget);

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    // Unmount the app so Riverpod releases its subscriptions.
    await tester.pumpWidget(const SizedBox.shrink());

    // Flush pending Drift stream cleanup callbacks.
    await tester.pump(const Duration(milliseconds: 10));

    // Close the temporary SQLite database.
    await database.close();
  });
}
