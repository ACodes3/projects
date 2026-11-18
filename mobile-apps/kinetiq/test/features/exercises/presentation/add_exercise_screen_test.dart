
import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/core/providers/database_provider.dart';
import 'package:kinetiq/features/exercises/presentation/screens/add_exercise_screen.dart';

void main() {
  late AppDatabase database;

  setUp(() {
    // Create a fresh database for each test.
    database = AppDatabase.forTesting(
      NativeDatabase.memory(),
    );
  });

  tearDown(() async {
    // Close the database after each test.
    await database.close();
  });

  // ----------------------------------------------------------
  // TEST 1 — Form validation
  // ----------------------------------------------------------

  testWidgets('Shows validation error when exercise name is empty', (
      WidgetTester tester,
      ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWith((ref) => database),
        ],
        child: const MaterialApp(
          home: AddExerciseScreen(),
        ),
      ),
    );

    // The save button is farther down the scrollable form.
    final saveButton = find.text('SAVE EXERCISE');

    await tester.scrollUntilVisible(
      saveButton,
      200,
      scrollable: find.byType(Scrollable).first,
    );

    await tester.pumpAndSettle();

    expect(saveButton, findsOneWidget);

    // Try saving without entering an exercise name.
        await tester.tap(saveButton);
        await tester.pumpAndSettle();

    // The form is now longer because of the tracking mode selector.
    // Scroll back to the name field to inspect its validation error.
        final validationMessage = find.text('Exercise name is required.');

        await tester.scrollUntilVisible(
          validationMessage,
          -200,
          scrollable: find.byType(Scrollable).first,
        );

        await tester.pumpAndSettle();

    // Verify that the required-name validation appeared.
        expect(
          validationMessage,
          findsOneWidget,
        );


    // Invalid input must not be saved.
    final exercises = await database
        .select(database.exercises)
        .get();

    expect(exercises, isEmpty);

    // Clean up the widget tree.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 10));
  });

  // ----------------------------------------------------------
  // TEST 2 — Save a valid custom exercise
  // ----------------------------------------------------------

  testWidgets('Saves a valid custom exercise to SQLite', (
      WidgetTester tester,
      ) async {
    // Provide a real navigation stack for context.pop().
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => Scaffold(
            body: Center(
              child: ElevatedButton(
                onPressed: () => context.push('/add'),
                child: const Text('Open Add Exercise'),
              ),
            ),
          ),
        ),
        GoRoute(
          path: '/add',
          builder: (context, state) =>
          const AddExerciseScreen(),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWith((ref) => database),
        ],
        child: MaterialApp.router(
          routerConfig: router,
        ),
      ),
    );

    // Open the form.
    await tester.tap(find.text('Open Add Exercise'));
    await tester.pumpAndSettle();

    // Enter a valid exercise name.
    await tester.enterText(
      find.byType(TextFormField).first,
      'Bulgarian Split Squat',
    );

    // Scroll to the save button.
    final saveButton = find.text('SAVE EXERCISE');

    await tester.scrollUntilVisible(
      saveButton,
      200,
      scrollable: find.byType(Scrollable).first,
    );

    await tester.pumpAndSettle();

    // Save the exercise.
    await tester.tap(saveButton);
    await tester.pumpAndSettle();

    // Verify successful navigation.
    expect(
      find.text('Open Add Exercise'),
      findsOneWidget,
    );

    // Verify the actual SQLite record.
    final exercises = await database
        .select(database.exercises)
        .get();

    expect(exercises, hasLength(1));

    final savedExercise = exercises.first;

    expect(savedExercise.name, 'Bulgarian Split Squat');
    expect(savedExercise.category, 'strength');
    expect(savedExercise.trackingMode, 'reps');
    expect(savedExercise.isCustom, true);

    // Dispose the widget tree.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 10));

    // Dispose the test router.
    router.dispose();
  });
    // ----------------------------------------------------------
    // TEST 3 — Edit an existing exercise
    // ----------------------------------------------------------
    testWidgets('Editing an exercise updates the existing SQLite record', (
        WidgetTester tester,
        ) async {
      // Arrange: create an exercise before opening the form.
      final exerciseId = await database.into(database.exercises).insert(
        ExercisesCompanion.insert(
          name: 'Squat',
        ),
      );

      // Create a test router with an Edit Exercise route.
      final router = GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () => context.push('/edit'),
                  child: const Text('Open Edit Exercise'),
                ),
              ),
            ),
          ),
          GoRoute(
            path: '/edit',
            builder: (context, state) => AddExerciseScreen(
              exerciseId: exerciseId,
            ),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider.overrideWith((ref) => database),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      // Open the existing exercise in Edit mode.
      await tester.tap(find.text('Open Edit Exercise'));
      await tester.pumpAndSettle();

      // Verify the existing name was loaded.
      final nameField = find.byType(TextFormField).first;

      expect(
        tester.widget<TextFormField>(nameField).controller!.text,
        'Squat',
      );

      // Update the name.
      await tester.enterText(nameField, 'Barbell Squat');

      // Locate the save button.
      final saveButton = find.text('SAVE CHANGES');

      await tester.scrollUntilVisible(
        saveButton,
        200,
        scrollable: find.byType(Scrollable).first,
      );

      await tester.pumpAndSettle();

      // Save the changes.
      await tester.tap(saveButton);
      await tester.pumpAndSettle();

      // Verify navigation returned to the previous screen.
      expect(find.text('Open Edit Exercise'), findsOneWidget);

      // Read the database.
      final exercises = await database.select(database.exercises).get();

      // Editing must not create a second exercise.
      expect(exercises, hasLength(1));

      // The original exercise ID must remain unchanged.
      expect(exercises.first.id, exerciseId);

      // The name must contain the updated value.
      expect(exercises.first.name, 'Barbell Squat');

      // Clean up.
      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 10));

      router.dispose();
    });
}
