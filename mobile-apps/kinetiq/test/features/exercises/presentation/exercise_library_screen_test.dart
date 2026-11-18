
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

    await tester.tap(find.byTooltip('Delete Deadlift'));
    await tester.pumpAndSettle();

    expect(find.text('Delete exercise?'), findsOneWidget);

    await tester.tap(find.text('CANCEL'));
    await tester.pumpAndSettle();

    final exercises =
    await database.select(database.exercises).get();

    expect(exercises, hasLength(1));
    expect(exercises.first.id, exerciseId);
    expect(exercises.first.name, 'Deadlift');

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

    await tester.tap(find.byTooltip('Delete Pull Up'));
    await tester.pumpAndSettle();

    expect(find.text('Delete exercise?'), findsOneWidget);

    await tester.tap(find.text('DELETE'));
    await tester.pumpAndSettle();

    final exercises =
    await database.select(database.exercises).get();

    expect(exercises, isEmpty);

    expect(
      find.text('Your exercise library is empty'),
      findsOneWidget,
    );

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 10));
  });

  // ----------------------------------------------------------
  // TEST 4 — Search and category filtering
  // ----------------------------------------------------------

  testWidgets('Search and category filters work together', (
      WidgetTester tester,
      ) async {
    // Create strength and cardio exercises.
    await database.into(database.exercises).insert(
      ExercisesCompanion.insert(
        name: 'Barbell Squat',
        category: const Value('strength'),
      ),
    );

    await database.into(database.exercises).insert(
      ExercisesCompanion.insert(
        name: 'Bench Press',
        category: const Value('strength'),
      ),
    );

    await database.into(database.exercises).insert(
      ExercisesCompanion.insert(
        name: 'Running',
        category: const Value('cardio'),
      ),
    );

    // Build the Exercise Library.
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

    // All exercises should initially appear.
    expect(find.text('Barbell Squat'), findsOneWidget);
    expect(find.text('Bench Press'), findsOneWidget);
    expect(find.text('Running'), findsOneWidget);

    // Select the Cardio category.
    await tester.tap(find.text('Cardio'));
    await tester.pumpAndSettle();

    expect(find.text('Running'), findsOneWidget);
    expect(find.text('Barbell Squat'), findsNothing);
    expect(find.text('Bench Press'), findsNothing);

    // Switch to Strength.
    await tester.tap(find.text('Strength'));
    await tester.pumpAndSettle();

    expect(find.text('Barbell Squat'), findsOneWidget);
    expect(find.text('Bench Press'), findsOneWidget);
    expect(find.text('Running'), findsNothing);

    // Search within the Strength category.
    await tester.enterText(
      find.byType(TextField).first,
      'squat',
    );

    await tester.pumpAndSettle();

    expect(find.text('Barbell Squat'), findsOneWidget);
    expect(find.text('Bench Press'), findsNothing);

    // Change to Cardio while keeping the search query.
    await tester.tap(find.text('Cardio'));
    await tester.pumpAndSettle();

    // No cardio exercise matches "squat".
    expect(
      find.text('No matching exercises'),
      findsOneWidget,
    );

    // Clear the search field.
    await tester.enterText(
      find.byType(TextField).first,
      '',
    );

    await tester.pumpAndSettle();

    // Running should appear again.
    expect(find.text('Running'), findsOneWidget);

    // Return to All categories.
    await tester.tap(find.text('All'));
    await tester.pumpAndSettle();

    expect(find.text('Barbell Squat'), findsOneWidget);
    expect(find.text('Bench Press'), findsOneWidget);
    expect(find.text('Running'), findsOneWidget);

    // Verify filtering never deleted database records.
    final exercises =
    await database.select(database.exercises).get();

    expect(exercises, hasLength(3));

    // Dispose Riverpod and Drift subscriptions.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 10));
  });
}
