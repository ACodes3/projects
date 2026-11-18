import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/workouts/data/repositories/workout_template_repository.dart';

void main() {
  late AppDatabase database;
  late WorkoutTemplateRepository repository;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());

    repository = WorkoutTemplateRepository(database);
  });

  tearDown(() async {
    await database.close();
  });

  // ----------------------------------------------------------
  // TEST 1 — CREATE
  // ----------------------------------------------------------

  test('Creates a workout template', () async {
    final id = await repository.createTemplate(
      const WorkoutTemplatesCompanion(
        name: Value('Upper Body'),
        description: Value('Chest, back, and shoulders'),
      ),
    );

    final saved = await repository.getTemplateById(id);

    expect(saved, isNotNull);
    expect(saved!.name, 'Upper Body');
    expect(saved.description, 'Chest, back, and shoulders');
    expect(saved.isFavorite, false);
  });

  // ----------------------------------------------------------
  // TEST 2 — READ ALL
  // ----------------------------------------------------------

  test('Returns all saved workout templates', () async {
    await repository.createTemplate(
      const WorkoutTemplatesCompanion(name: Value('Leg Day')),
    );

    await repository.createTemplate(
      const WorkoutTemplatesCompanion(name: Value('Push Day')),
    );

    final templates = await repository.getAllTemplates();

    expect(templates.length, 2);

    expect(
      templates.map((template) => template.name),
      containsAll(['Leg Day', 'Push Day']),
    );
  });

  // ----------------------------------------------------------
  // TEST 3 — UPDATE
  // ----------------------------------------------------------

  test('Updates an existing workout template', () async {
    final id = await repository.createTemplate(
      const WorkoutTemplatesCompanion(name: Value('Old Workout')),
    );

    final original = await repository.getTemplateById(id);

    expect(original, isNotNull);

    final updated = await repository.updateTemplate(
      original!.copyWith(name: 'Updated Workout', isFavorite: true),
    );

    expect(updated, true);

    final saved = await repository.getTemplateById(id);

    expect(saved, isNotNull);
    expect(saved!.id, id);
    expect(saved.name, 'Updated Workout');
    expect(saved.isFavorite, true);
  });

  // ----------------------------------------------------------
  // TEST 4 — DELETE
  // ----------------------------------------------------------

  test('Deletes an existing workout template', () async {
    final id = await repository.createTemplate(
      const WorkoutTemplatesCompanion(name: Value('Temporary Workout')),
    );

    final deletedRows = await repository.deleteTemplate(id);

    expect(deletedRows, 1);

    final saved = await repository.getTemplateById(id);

    expect(saved, isNull);
  });

  // ----------------------------------------------------------
  // TEST 5 — REACTIVE WATCH
  // ----------------------------------------------------------

  test('Watch stream emits changes when templates are added', () async {
    final emissions = repository.watchAllTemplates().asBroadcastStream();

    // Subscribe before inserting so we can observe the initial
    // empty state and the state after the insert.
    final firstEmission = emissions.first;

    final initialTemplates = await firstEmission;

    expect(initialTemplates, isEmpty);

    final nextEmission = emissions.firstWhere(
      (templates) => templates.isNotEmpty,
    );

    await repository.createTemplate(
      const WorkoutTemplatesCompanion(name: Value('Full Body')),
    );

    final updatedTemplates = await nextEmission;

    expect(updatedTemplates.length, 1);
    expect(updatedTemplates.first.name, 'Full Body');
  });
}
