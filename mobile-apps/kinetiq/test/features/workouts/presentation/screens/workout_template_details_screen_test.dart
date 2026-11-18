
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
  // TEST DATABASE
  // ----------------------------------------------------------

  late AppDatabase database;
  late WorkoutTemplateRepository templateRepository;

  setUp(() {
    database = AppDatabase.forTesting(
      NativeDatabase.memory(),
    );

    templateRepository = WorkoutTemplateRepository(database);
  });

  // ----------------------------------------------------------
  // TEST APP
  // ----------------------------------------------------------

  /// Uses real repositories backed by an in-memory SQLite
  /// database while keeping production data untouched.
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
        home: WorkoutTemplateDetailsScreen(
          templateId: templateId,
        ),
      ),
    );
  }

  // ----------------------------------------------------------
  // TEST 1 — WORKOUT INFORMATION
  // ----------------------------------------------------------

  testWidgets(
    'Displays the saved workout name and description',
        (tester) async {
      final templateId = await templateRepository.createTemplate(
        const WorkoutTemplatesCompanion(
          name: Value('Upper Body Workout'),
          description: Value('Chest and shoulders'),
        ),
      );

      await tester.pumpWidget(
        createTestApp(templateId),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(
        find.text('Upper Body Workout'),
        findsOneWidget,
      );

      expect(
        find.text('Chest and shoulders'),
        findsOneWidget,
      );

      expect(
        find.text('WORKOUT DETAILS'),
        findsOneWidget,
      );

      // Unmount before closing the database.
      await tester.pumpWidget(
        const SizedBox.shrink(),
      );

      await tester.pump(const Duration(milliseconds: 10));
      await database.close();
    },
  );

  // ----------------------------------------------------------
  // TEST 2 — EMPTY WORKOUT
  // ----------------------------------------------------------

  testWidgets(
    'Displays the correct empty state when no exercises exist',
        (tester) async {
      final templateId = await templateRepository.createTemplate(
        const WorkoutTemplatesCompanion(
          name: Value('New Workout'),
        ),
      );

      await tester.pumpWidget(
        createTestApp(templateId),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(
        find.text('0 exercises'),
        findsOneWidget,
      );

      expect(
        find.text(
          'No exercises added yet.\n'
              'Add your first exercise below.',
        ),
        findsOneWidget,
      );

      expect(
        find.text('ADD EXERCISE'),
        findsOneWidget,
      );

      // Unmount before closing the database.
      await tester.pumpWidget(
        const SizedBox.shrink(),
      );

      await tester.pump(const Duration(milliseconds: 10));
      await database.close();
    },
  );

  // ----------------------------------------------------------
  // TEST 3 — MISSING WORKOUT
  // ----------------------------------------------------------

  testWidgets(
    'Displays an informative message for a missing workout',
        (tester) async {
      await tester.pumpWidget(
        createTestApp(99999),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(
        find.text('Workout template not found.'),
        findsOneWidget,
      );

      // The Add Exercise button should not be available
      // when the workout template doesn't exist.
      expect(
        find.text('ADD EXERCISE'),
        findsNothing,
      );

      // Unmount before closing the database.
      await tester.pumpWidget(
        const SizedBox.shrink(),
      );

      await tester.pump(const Duration(milliseconds: 10));
      await database.close();
    },
  );
}
