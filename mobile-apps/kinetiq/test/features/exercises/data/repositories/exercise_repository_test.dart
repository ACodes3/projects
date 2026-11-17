import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/data/repositories/exercise_repository.dart';

void main() {
  late AppDatabase database;
  late ExerciseRepository repository;

  setUp(() {
    // Use a separate in-memory database for every test.
    database = AppDatabase.forTesting(
      NativeDatabase.memory(),
    );

    repository = ExerciseRepository(database);
  });

  tearDown(() async {
    await database.close();
  });

  test('Creates and retrieves an exercise', () async {
    // CREATE
    final id = await repository.createExercise(
      ExercisesCompanion.insert(
        name: 'Bench Press',
        muscleGroup: const Value('chest'),
      ),
    );

    // READ
    final exercise = await repository.getExerciseById(id);

    expect(exercise, isNotNull);
    expect(exercise!.name, 'Bench Press');
    expect(exercise.category, 'strength');
    expect(exercise.muscleGroup, 'chest');
    expect(exercise.isCustom, false);
  });

  test('Returns exercises in alphabetical order', () async {
    await repository.createExercise(
      ExercisesCompanion.insert(name: 'Squat'),
    );

    await repository.createExercise(
      ExercisesCompanion.insert(name: 'Bench Press'),
    );

    await repository.createExercise(
      ExercisesCompanion.insert(name: 'Deadlift'),
    );

    final exercises = await repository.getAllExercises();

    expect(
      exercises.map((exercise) => exercise.name).toList(),
      ['Bench Press', 'Deadlift', 'Squat'],
    );
  });

  test('Updates an existing exercise', () async {
    final id = await repository.createExercise(
      ExercisesCompanion.insert(name: 'Squat'),
    );

    final original = await repository.getExerciseById(id);

    expect(original, isNotNull);

    // Drift's copyWith preserves the other column values.
    final updated = original!.copyWith(
      name: 'Barbell Squat',
    );

    final success = await repository.updateExercise(updated);

    expect(success, true);

    final saved = await repository.getExerciseById(id);

    expect(saved?.name, 'Barbell Squat');
  });

  test('Deletes an exercise', () async {
    final id = await repository.createExercise(
      ExercisesCompanion.insert(name: 'Pull Up'),
    );

    final deletedRows = await repository.deleteExercise(id);

    expect(deletedRows, 1);

    final exercise = await repository.getExerciseById(id);

    expect(exercise, isNull);
  });

  test('Watches exercises reactively', () async {
    // Start listening before inserting any records.
    final firstUpdate = repository.watchAllExercises().firstWhere(
          (exercises) => exercises.isNotEmpty,
    );

    await repository.createExercise(
      ExercisesCompanion.insert(name: 'Running'),
    );

    final exercises = await firstUpdate;

    expect(exercises, hasLength(1));
    expect(exercises.first.name, 'Running');
  });
}
