import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kinetiq/core/database/app_database.dart';

void main() {
  late AppDatabase database;

  setUp(() {
    // Create a fresh, temporary SQLite database for each test.
    database = AppDatabase.forTesting(
      NativeDatabase.memory(),
    );
  });

  tearDown(() async {
    // Close the database after each test.
    await database.close();
  });

  test('Can insert and retrieve an exercise', () async {
    // Arrange: create an exercise.
    final exercise = ExercisesCompanion.insert(
      name: 'Bench Press',
      category: const Value('strength'),
      muscleGroup: const Value('chest'),
      trackingMode: const Value('reps'),
    );

    // Act: insert it into SQLite.
    final exerciseId = await database
        .into(database.exercises)
        .insert(exercise);

    // Retrieve the saved exercise.
    final savedExercise = await (database.select(
      database.exercises,
    )..where((table) => table.id.equals(exerciseId)))
        .getSingle();

    // Assert: verify the saved data.
    expect(savedExercise.id, exerciseId);
    expect(savedExercise.name, 'Bench Press');
    expect(savedExercise.category, 'strength');
    expect(savedExercise.muscleGroup, 'chest');
    expect(savedExercise.trackingMode, 'reps');

    // Verify the default value.
    expect(savedExercise.isCustom, false);
  });
}
