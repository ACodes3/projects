import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/workouts/data/repositories/workout_template_exercise_repository.dart';

void main() {
  late AppDatabase database;
  late WorkoutTemplateExerciseRepository repository;

  late int templateId;
  late int benchPressId;
  late int squatId;

  setUp(() async {
    database = AppDatabase.forTesting(NativeDatabase.memory());

    repository = WorkoutTemplateExerciseRepository(database);

    // Create a real template for our foreign-key relationship.
    templateId = await database
        .into(database.workoutTemplates)
        .insert(const WorkoutTemplatesCompanion(name: Value('Full Body')));

    // Create exercises in the Exercise Library.
    benchPressId = await database
        .into(database.exercises)
        .insert(
          const ExercisesCompanion(
            name: Value('Bench Press'),
            category: Value('strength'),
          ),
        );

    squatId = await database
        .into(database.exercises)
        .insert(
          const ExercisesCompanion(
            name: Value('Squat'),
            category: Value('strength'),
          ),
        );
  });

  tearDown(() async {
    await database.close();
  });

  // ----------------------------------------------------------
  // TEST 1 — ADD EXERCISE
  // ----------------------------------------------------------

  test('Adds an exercise to a workout template', () async {
    final id = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
        position: const Value(0),
        sets: const Value(4),
        targetReps: const Value(10),
        targetWeight: const Value(60.0),
        restBetweenSetsSeconds: const Value(90),
      ),
    );

    final saved = await repository.getTemplateExerciseById(id);

    expect(saved, isNotNull);
    expect(saved!.templateId, templateId);
    expect(saved.exerciseId, benchPressId);
    expect(saved.position, 0);
    expect(saved.sets, 4);
    expect(saved.targetReps, 10);
    expect(saved.targetWeight, 60.0);
    expect(saved.restBetweenSetsSeconds, 90);
  });

  // ----------------------------------------------------------
  // TEST 2 — GET EXERCISES IN ORDER
  // ----------------------------------------------------------

  test('Returns template exercises in position order', () async {
    await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(squatId),
        position: const Value(1),
      ),
    );

    await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
        position: const Value(0),
      ),
    );

    final exercises = await repository.getExercisesForTemplate(templateId);

    expect(exercises.length, 2);
    expect(exercises.first.exerciseId, benchPressId);
    expect(exercises.last.exerciseId, squatId);
  });

  // ----------------------------------------------------------
  // TEST 3 — UPDATE CONFIGURATION
  // ----------------------------------------------------------

  test('Updates exercise training settings', () async {
    final id = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
        sets: const Value(3),
      ),
    );

    final original = await repository.getTemplateExerciseById(id);

    expect(original, isNotNull);

    final updated = await repository.updateExercise(
      original!.copyWith(
        sets: 5,
        targetReps: const Value(8),
        restBetweenSetsSeconds: 120,
      ),
    );

    expect(updated, true);

    final saved = await repository.getTemplateExerciseById(id);

    expect(saved!.sets, 5);
    expect(saved.targetReps, 8);
    expect(saved.restBetweenSetsSeconds, 120);
  });

  // ----------------------------------------------------------
  // TEST 4 — REMOVE EXERCISE
  // ----------------------------------------------------------

  test('Removing a template exercise keeps the library exercise', () async {
    final id = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
      ),
    );

    final deletedRows = await repository.removeExercise(id);

    expect(deletedRows, 1);

    final templateExercise = await repository.getTemplateExerciseById(id);

    expect(templateExercise, isNull);

    // The underlying library exercise must still exist.
    final libraryExercise = await (database.select(
      database.exercises,
    )..where((table) => table.id.equals(benchPressId))).getSingleOrNull();

    expect(libraryExercise, isNotNull);
    expect(libraryExercise!.name, 'Bench Press');
  });

  // ----------------------------------------------------------
  // TEST 5 — REORDER EXERCISES
  // ----------------------------------------------------------

  test('Reorders exercises within a workout template', () async {
    final firstId = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
        position: const Value(0),
      ),
    );

    final secondId = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(squatId),
        position: const Value(1),
      ),
    );

    await repository.reorderExercises(templateId, [secondId, firstId]);

    final exercises = await repository.getExercisesForTemplate(templateId);

    expect(exercises.map((exercise) => exercise.id).toList(), [
      secondId,
      firstId,
    ]);

    expect(exercises[0].position, 0);
    expect(exercises[1].position, 1);
  });

  // ----------------------------------------------------------
  // TEST 6 — REJECT INVALID REORDER
  // ----------------------------------------------------------

  test('Rejects incomplete exercise reorder requests', () async {
    final firstId = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
        position: const Value(0),
      ),
    );

    final secondId = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(squatId),
        position: const Value(1),
      ),
    );

    await expectLater(
      repository.reorderExercises(templateId, [firstId]),
      throwsArgumentError,
    );

    final exercises = await repository.getExercisesForTemplate(templateId);

    // A failed reorder must not modify existing positions.
    expect(exercises[0].id, firstId);
    expect(exercises[1].id, secondId);
  });

  // ----------------------------------------------------------
  // TEST 7 — CASCADE DELETE
  // ----------------------------------------------------------

  test('Deleting a template also removes its configured exercises', () async {
    final id = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
      ),
    );

    await (database.delete(
      database.workoutTemplates,
    )..where((table) => table.id.equals(templateId))).go();

    final templateExercise = await repository.getTemplateExerciseById(id);

    expect(templateExercise, isNull);

    // The Exercise Library must remain intact.
    final libraryExercise = await (database.select(
      database.exercises,
    )..where((table) => table.id.equals(benchPressId))).getSingleOrNull();

    expect(libraryExercise, isNotNull);
  });

  // ----------------------------------------------------------
  // TEST 8 — FOREIGN KEY PROTECTION
  // ----------------------------------------------------------

  test('Rejects adding a nonexistent library exercise', () async {
    await expectLater(
      repository.addExercise(
        WorkoutTemplateExercisesCompanion(
          templateId: Value(templateId),
          exerciseId: const Value(-999),
        ),
      ),
      throwsA(isA<Exception>()),
    );
  });

  // ----------------------------------------------------------
  // TEST 9 — NORMALIZE POSITIONS AFTER DELETION
  // ----------------------------------------------------------

  test('Removing an exercise normalizes remaining positions', () async {
    // Create three configured exercises.
    // Reusing a library exercise in multiple template rows
    // is allowed because each row has its own configuration.

    final firstId = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
        position: const Value(0),
      ),
    );

    final secondId = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(squatId),
        position: const Value(1),
      ),
    );

    final thirdId = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(benchPressId),
        position: const Value(2),
        sets: const Value(5),
      ),
    );

    // Delete the middle exercise.
    final deletedRows = await repository.removeExercise(secondId);

    expect(deletedRows, 1);

    // Load the remaining exercises.
    final remaining = await repository.getExercisesForTemplate(
      templateId,
    );

    // Only the first and third exercises should remain.
    expect(remaining.length, 2);

    expect(
      remaining.map((exercise) => exercise.id).toList(),
      [firstId, thirdId],
    );

    // Stored positions must now be sequential.
    expect(
      remaining.map((exercise) => exercise.position).toList(),
      [0, 1],
    );

    // The third exercise's configuration must be preserved.
    expect(remaining[1].sets, 5);

    // Adding another exercise should continue the sequence.
    final fourthId = await repository.addExercise(
      WorkoutTemplateExercisesCompanion(
        templateId: Value(templateId),
        exerciseId: Value(squatId),
        position: const Value(2),
      ),
    );

    final updated = await repository.getExercisesForTemplate(
      templateId,
    );

    expect(updated.length, 3);

    expect(
      updated.map((exercise) => exercise.id).toList(),
      [firstId, thirdId, fourthId],
    );

    expect(
      updated.map((exercise) => exercise.position).toList(),
      [0, 1, 2],
    );
  });
}
