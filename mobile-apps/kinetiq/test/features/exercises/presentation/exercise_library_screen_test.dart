
import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/core/providers/database_provider.dart';
import 'package:kinetiq/features/exercises/presentation/screens/exercise_library_screen.dart';

void main() {
  late AppDatabase database;

  setUp(() {
    database = AppDatabase.forTesting(
      NativeDatabase.memory(),
    );
  });

  tearDown(() async {
    await database.close();
  });

  // ----------------------------------------------------------
  // TEST 1 — Display saved exercises
  // ----------------------------------------------------------

  testWidgets('Exercise Library displays saved exercises', (
      WidgetTester tester,
      ) async {
    await database.into(database.exercises).insert(
      ExercisesCompanion.insert(
        name: 'Bench Press',
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWith((ref) => database),
        ],
        child: const MaterialApp(
          home: ExerciseLibraryScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Bench Press'), findsOneWidget);

    // Clean up Drift subscriptions.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 10));
  });

  // ----------------------------------------------------------
  // TEST 2 — Cancel exercise deletion
  // ----------------------------------------------------------

  testWidgets('Cancel keeps the exercise in SQLite', (
      WidgetTester tester,
      ) async {
    final exerciseId = await database.into(database.exercises).insert(
      ExercisesCompanion.insert(
        name: 'Deadlift',
        isCustom: const Value(true),
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWith((ref) => database),
        ],
        child: const MaterialApp(
          home: ExerciseLibraryScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Open the confirmation dialog.
    await tester.tap(find.byTooltip('Delete Deadlift'));
    await tester.pumpAndSettle();

    expect(find.text('Delete exercise?'), findsOneWidget);

    // Cancel the deletion.
    await tester.tap(find.text('CANCEL'));
    await tester.pumpAndSettle();

    // Verify the exercise still exists.
    final exercises =
    await database.select(database.exercises).get();

    expect(exercises, hasLength(1));
    expect(exercises.first.id, exerciseId);
    expect(exercises.first.name, 'Deadlift');

    // Clean up Drift subscriptions.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 10));
  });

  // ----------------------------------------------------------
  // TEST 3 — Confirm exercise deletion
  // ----------------------------------------------------------

  testWidgets('Confirm delete removes the exercise from SQLite', (
      WidgetTester tester,
      ) async {
    await database.into(database.exercises).insert(
      ExercisesCompanion.insert(
        name: 'Pull Up',
        isCustom: const Value(true),
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWith((ref) => database),
        ],
        child: const MaterialApp(
          home: ExerciseLibraryScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Open the confirmation dialog.
    await tester.tap(find.byTooltip('Delete Pull Up'));
    await tester.pumpAndSettle();

    expect(find.text('Delete exercise?'), findsOneWidget);

    // Confirm deletion.
    await tester.tap(find.text('DELETE'));
    await tester.pumpAndSettle();

    // Verify SQLite no longer contains the exercise.
    final exercises =
    await database.select(database.exercises).get();

    expect(exercises, isEmpty);

    // Verify the reactive UI shows the empty state.
    expect(
      find.text('Your exercise library is empty'),
      findsOneWidget,
    );

    // Clean up Drift subscriptions.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 10));
  });
}
