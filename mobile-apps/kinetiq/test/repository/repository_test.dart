import 'dart:convert';

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/core/repository/kinetiq_repository.dart';
import 'package:kinetiq/core/domain/metrics.dart';

void main() {
  late KinetiqDatabase db;
  late KinetiqRepository repo;
  setUp(() async {
    db = KinetiqDatabase.test(NativeDatabase.memory());
    repo = KinetiqRepository(db);
    await repo.seedExercisesIfEmpty();
  });
  tearDown(() async {
    await db.close();
  });

  test('new database seeds known exercise catalog', () async {
    final exercises = await repo.exercises();
    expect(exercises.length, greaterThanOrEqualTo(20));
    expect(exercises.any((x) => x.name == 'Barbell Squat'), isTrue);
  });
  test('seeding twice is idempotent', () async {
    final count = (await repo.exercises()).length;
    await repo.seedExercisesIfEmpty();
    expect((await repo.exercises()).length, count);
  });
  test('exercise search is case insensitive', () async {
    expect(
      (await repo.exercises(search: 'squat'))
          .any((x) => x.name == 'Barbell Squat'),
      isTrue,
    );
  });
  test('create custom exercise', () async {
    final id = await repo.saveExercise(
      name: 'Band pull apart',
      category: 'strength',
      group: 'Back',
      equipment: 'Bands',
      mode: 'reps',
    );
    final exercise = await repo.exerciseById(id);
    expect(exercise!.custom, isTrue);
    expect(exercise.mode, 'reps');
  });
  test('edit custom exercise', () async {
    final id = await repo.saveExercise(
      name: 'Old',
      category: 'strength',
      group: 'Arms',
      equipment: 'Bands',
      mode: 'reps',
    );
    await repo.saveExercise(
      id: id,
      name: 'New',
      category: 'strength',
      group: 'Back',
      equipment: 'Bands',
      mode: 'reps',
    );
    expect((await repo.exerciseById(id))!.name, 'New');
  });
  test('cannot edit built-in exercise', () async {
    final item = (await repo.exercises()).firstWhere((e) => !e.custom);
    await expectLater(
      repo.saveExercise(
        id: item.id,
        name: 'Altered',
        category: 'strength',
        group: 'X',
        equipment: 'X',
        mode: 'reps',
      ),
      throwsStateError,
    );
  });
  test('custom exercise can be archived', () async {
    final id = await repo.saveExercise(
      name: 'Custom',
      category: 'strength',
      group: 'Other',
      equipment: 'None',
      mode: 'reps',
    );
    await repo.archiveExercise((await repo.exerciseById(id))!);
    expect((await repo.exercises()).any((e) => e.id == id), isFalse);
  });
  test('cannot archive built-in exercise', () async {
    await expectLater(
      repo.archiveExercise((await repo.exercises()).first),
      throwsStateError,
    );
  });
  test('empty routine name rejected', () async {
    await expectLater(repo.createRoutine('   '), throwsStateError);
  });
  test('guest can create exactly three routines', () async {
    for (var i = 0; i < 3; i++) {
      await repo.createRoutine('Routine $i');
    }
    expect((await repo.routines()).length, 3);
    await expectLater(repo.createRoutine('Fourth'), throwsStateError);
  });
  test('connected account lifts guest routine limit', () async {
    for (var i = 0; i < 3; i++) {
      await repo.createRoutine('Routine $i');
    }
    await repo.setPreference('connected_account_id', 'verified-server-id');
    await repo.createRoutine('Fourth');
    expect((await repo.routines()).length, 4);
  });
  test('archived routine frees guest slot', () async {
    final first = await repo.createRoutine('A');
    await repo.createRoutine('B');
    await repo.createRoutine('C');
    await repo.archiveRoutine(first);
    await repo.createRoutine('D');
    expect((await repo.routines()).length, 3);
  });
  test('duplicate routine preserves exercise snapshot and target', () async {
    final id = await repo.createRoutine('A');
    await repo.addToRoutine(id, (await repo.exercises()).first);
    final duplicate = await repo.duplicateRoutine(id);
    expect((await repo.routineExercises(duplicate)).length, 1);
    expect((await repo.routineById(duplicate))!.title, 'A copy');
  });
  test('routine reorder preserves sequential positions', () async {
    final id = await repo.createRoutine('A');
    final exercises = await repo.exercises();
    for (final exercise in exercises.take(3)) {
      await repo.addToRoutine(id, exercise);
    }
    final before = await repo.routineExercises(id);
    await repo.moveRoutineExercise(id, 0, 2);
    final after = await repo.routineExercises(id);
    expect(after.map((e) => e.position).toList(), [0, 1, 2]);
    expect(after.last.id, before.first.id);
  });
  test('routine deletion repacks indexes', () async {
    final id = await repo.createRoutine('A');
    for (final exercise in (await repo.exercises()).take(3)) {
      await repo.addToRoutine(id, exercise);
    }
    final original = await repo.routineExercises(id);
    await repo.removeRoutineExercise(original[1].id, id);
    expect((await repo.routineExercises(id)).map((x) => x.position).toList(), [
      0,
      1,
    ]);
  });
  test('routine targets validate sets and rest', () async {
    final id = await repo.createRoutine('A');
    await repo.addToRoutine(id, (await repo.exercises()).first);
    final e = (await repo.routineExercises(id)).first;
    await expectLater(
      repo.updateRoutineExercise(e, sets: 0, restSeconds: 90),
      throwsStateError,
    );
    await expectLater(
      repo.updateRoutineExercise(e, sets: 3, restSeconds: -1),
      throwsStateError,
    );
    await repo.updateRoutineExercise(
      e,
      sets: 4,
      reps: 8,
      weightKg: 50,
      restSeconds: 120,
    );
    expect((await repo.routineExercises(id)).first.targetSets, 4);
  });
  test('start session copies template exercise identity', () async {
    final id = await repo.createRoutine('Strong A');
    await repo.addToRoutine(id, (await repo.exercises()).first);
    final sessionId = await repo.startSession(routineId: id);
    expect((await repo.sessionExercises(sessionId)).length, 1);
    expect((await repo.setsForSession(sessionId)).length, 3);
  });
  test('start twice resumes existing session', () async {
    final a = await repo.startSession();
    expect(await repo.startSession(), a);
    expect((await repo.sessions()).length, 1);
  });
  test('incomplete session cannot finish', () async {
    final id = await repo.startSession();
    await expectLater(repo.finishSession(id), throwsStateError);
  });
  test('invalid set completion refused', () async {
    final id = await repo.startSession();
    await repo.addSessionExercise(id, (await repo.exercises()).first);
    final set = (await repo.setsForSession(id)).first;
    await expectLater(
      repo.updateSet(set.id, completed: true),
      throwsStateError,
    );
    expect((await repo.setsForSession(id)).first.completed, isFalse);
  });
  test('set draft can persist without completion', () async {
    final id = await repo.startSession();
    await repo.addSessionExercise(id, (await repo.exercises()).first);
    final set = (await repo.setsForSession(id)).first;
    await repo.updateSet(set.id, weightKg: 50, reps: 5, completed: false);
    final after = (await repo.setsForSession(id)).first;
    expect(after.weightKg, 50);
    expect(after.completed, isFalse);
  });
  test('finish is idempotent and keeps logged values', () async {
    final id = await repo.startSession();
    final exercise = (await repo.exercises()).firstWhere(
      (x) => x.mode == 'weight_reps',
    );
    await repo.addSessionExercise(id, exercise);
    final set = (await repo.setsForSession(id)).first;
    await repo.updateSet(set.id, weightKg: 50, reps: 8, completed: true);
    await repo.finishSession(id);
    await repo.finishSession(id);
    expect((await repo.sessionById(id))!.status, 'completed');
    expect(completedVolume(await repo.setsForSession(id)), 400);
  });
  test('cannot edit completed session via active set APIs', () async {
    final id = await repo.startSession();
    await repo.addSessionExercise(
      id,
      (await repo.exercises()).firstWhere((e) => e.mode == 'weight_reps'),
    );
    final exercise = (await repo.sessionExercises(id)).first;
    final set = (await repo.setsForSession(id)).first;
    await repo.updateSet(set.id, weightKg: 20, reps: 10, completed: true);
    await repo.finishSession(id);
    await expectLater(
      repo.updateSet(set.id, weightKg: 30, reps: 10, completed: true),
      throwsStateError,
    );
    await expectLater(repo.addSet(exercise.id), throwsStateError);
  });
  test('completed session edits are explicit and isolated', () async {
    final id = await repo.startSession();
    await repo.addSessionExercise(
      id,
      (await repo.exercises()).firstWhere((e) => e.mode == 'weight_reps'),
    );
    final set = (await repo.setsForSession(id)).first;
    await repo.updateSet(set.id, weightKg: 50, reps: 10, completed: true);
    await repo.finishSession(id);
    await repo.editCompletedSet(
      set.id,
      weightKg: 55,
      reps: 10,
      completed: true,
    );
    expect(completedVolume(await repo.setsForSession(id)), 550);
  });
  test('template changes cannot alter historical session snapshot', () async {
    final rid = await repo.createRoutine('Original');
    await repo.addToRoutine(rid, (await repo.exercises()).first);
    final id = await repo.startSession(routineId: rid);
    final e = (await repo.sessionExercises(id)).first;
    await repo.renameRoutine(rid, 'Renamed');
    await repo.archiveRoutine(rid);
    expect((await repo.sessionById(id))!.name, 'Original');
    expect((await repo.sessionExercises(id)).first.name, e.name);
  });
  test('discarded session not counted as completed history', () async {
    final id = await repo.startSession();
    await repo.discardSession(id);
    expect((await repo.sessionById(id))!.status, 'discarded');
    expect((await repo.sessions()).isEmpty, isTrue);
  });
  test('save exercise notes to session draft', () async {
    final id = await repo.startSession();
    await repo.setSessionNotes(id, 'Strength work');
    expect((await repo.sessionById(id))!.notes, 'Strength work');
  });
  test('cardio invalid time rejected', () async {
    await expectLater(
      repo.logCardio(activity: 'Running', seconds: 0),
      throwsStateError,
    );
  });
  test('manual cardio valid distance and duration', () async {
    await repo.logCardio(activity: 'Running', seconds: 600, meters: 1200);
    final item = (await repo.cardio()).single;
    expect(item.meters, 1200);
    expect(item.seconds, 600);
  });
  test('food allows unknown nutrients', () async {
    final id = await repo.saveFood(name: 'Unknown');
    final food = (await repo.foodById(id))!;
    expect(food.kcal, isNull);
    expect(food.protein, isNull);
  });
  test('food rejects negative nutrients', () async {
    await expectLater(repo.saveFood(name: 'Bad', kcal: -1), throwsStateError);
  });
  test('meal record preserves food nutrients after food editing', () async {
    final id = await repo.saveFood(name: 'Oats', kcal: 100, protein: 10);
    await repo.addMeal(
      (await repo.foodById(id))!,
      grams: 150,
      meal: 'Breakfast',
    );
    await repo.saveFood(id: id, name: 'Oats new', kcal: 200, protein: 20);
    final entry = (await repo.meals()).single;
    expect(entry.name, 'Oats');
    expect(entry.kcal, 150);
    expect(entry.protein, 15);
  });
  test('meal amount edit rescales snapshot', () async {
    final id = await repo.saveFood(name: 'Oats', kcal: 100, protein: 10);
    await repo.addMeal(
      (await repo.foodById(id))!,
      grams: 100,
      meal: 'Breakfast',
    );
    final meal = (await repo.meals()).single;
    await repo.updateMealEntry(meal.id, grams: 250, category: 'Lunch');
    final result = (await repo.meals()).single;
    expect(result.kcal, 250);
    expect(result.meal, 'Lunch');
  });
  test('meal snapshot remains after food removal', () async {
    final id = await repo.saveFood(name: 'Food', kcal: 100);
    await repo.addMeal((await repo.foodById(id))!, grams: 100, meal: 'Dinner');
    await repo.deleteFood(id);
    expect((await repo.meals()).single.name, 'Food');
  });
  test('hydration amount is canonical milliliters', () async {
    await repo.addWater(250);
    expect((await repo.hydration()).single.ml, 250);
    await expectLater(repo.addWater(0), throwsStateError);
  });
  test('saved meal records all ingredient nutrient snapshots', () async {
    final id = await repo.saveFood(name: 'Oats', kcal: 100);
    final mealId = await repo.saveMealTemplate('Breakfast', [
      (food: (await repo.foodById(id))!, grams: 250),
    ]);
    expect((await repo.savedMealItems(mealId)).single.kcal, 250);
    await repo.logSavedMeal(mealId, 'Breakfast');
    expect((await repo.meals()).single.kcal, 250);
  });
  test('saved meal template survives ingredient deletion', () async {
    final id = await repo.saveFood(name: 'Oats', kcal: 100);
    final mealId = await repo.saveMealTemplate('Breakfast', [
      (food: (await repo.foodById(id))!, grams: 200),
    ]);
    await repo.deleteFood(id);
    expect((await repo.savedMealItems(mealId)).single.name, 'Oats');
  });
  test('invalid saved meal rejected', () async {
    await expectLater(repo.saveMealTemplate('', []), throwsStateError);
  });
  test('recipe ingredients snapshot nutrients', () async {
    final id = await repo.saveFood(name: 'Banana', kcal: 100);
    final recipe = await repo.createRecipe('Snack', servings: 2);
    await repo.addIngredient(recipe, (await repo.foodById(id))!, 200);
    expect((await repo.ingredients(recipe)).single.kcal, 200);
  });
  test('program weekday is limited to 1–7', () async {
    final id = await repo.createProgram('Split', goal: 'Strength', weeks: 4);
    await expectLater(repo.assignProgramDay(id, 0, null), throwsStateError);
    await repo.assignProgramDay(id, 1, null);
  });
  test('nutrition targets can be saved and cleared', () async {
    await repo.saveNutritionGoals(kcal: 2000, protein: 120);
    expect((await repo.nutritionGoals())!.protein, 120);
    await repo.saveNutritionGoals();
    expect((await repo.nutritionGoals())!.protein, isNull);
  });
  test('invalid nutrition targets refused', () async {
    await expectLater(repo.saveNutritionGoals(kcal: -20), throwsStateError);
  });
  test('export includes all core and v2 tables', () async {
    final data = jsonDecode(await repo.exportJson()) as Map;
    expect(data['format'], 'kinetiq-offline-export');
    expect(data['schemaVersion'], 2);
    expect(data['session_sets'], isA<List>());
    expect(data['saved_meals'], isA<List>());
  });
  test('re-importing same export is idempotent', () async {
    final data = await repo.exportJson();
    final preview = await repo.previewImport(data);
    expect(preview.conflicts, 0);
    expect(preview.added, 0);
    await repo.importJson(data);
    expect((await repo.exercises()).length, 20);
  });
  test('import rejects invalid JSON safely', () async {
    await expectLater(repo.importJson('{bad'), throwsStateError);
    expect((await repo.exercises()).length, 20);
  });
  test('import rejects unsupported format', () async {
    await expectLater(
      repo.importJson('{"format":"other","schemaVersion":2}'),
      throwsStateError,
    );
  });
  test('import conflicts reject without data loss', () async {
    final export = jsonDecode(await repo.exportJson()) as Map<String, dynamic>;
    (export['exercises'] as List).first['name'] = 'Tampered';
    final data = jsonEncode(export);
    expect((await repo.previewImport(data)).conflicts, greaterThan(0));
    await expectLater(repo.importJson(data), throwsStateError);
    expect((await repo.exercises()).any((x) => x.name == 'Tampered'), isFalse);
  });
  test('import fills missing existing local records', () async {
    final original = await repo.exportJson();
    await repo.clearLocalRecords();
    expect((await repo.exercises()).length, 0);
    await repo.importJson(original);
    expect((await repo.exercises()).length, 20);
  });
  test('clearing local records is explicit, leaves no sessions', () async {
    await repo.startSession();
    await repo.clearLocalRecords();
    expect(await repo.activeSession(), isNull);
    expect((await repo.routines()).length, 0);
  });
}
