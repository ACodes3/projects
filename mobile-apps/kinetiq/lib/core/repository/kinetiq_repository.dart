import 'dart:convert';

import 'package:uuid/uuid.dart';

import '../database/app_database.dart';
import '../domain/metrics.dart';
import '../domain/models.dart';

/// Persistence only: no widgets, routing, or presentation concerns.
/// All writes are local SQLite writes. There is no cloud or AI integration.
class KinetiqRepository {
  KinetiqRepository(this.db);
  final KinetiqDatabase db;
  static const _uuid = Uuid();
  String _id() => _uuid.v4();
  String _now() => DateTime.now().toUtc().toIso8601String();

  Future<String?> preference(String key) async {
    final rows = await db.query('SELECT value FROM preferences WHERE key = ?', [
      key,
    ]);
    return rows.isEmpty ? null : rows.first['value'] as String;
  }

  Future<void> setPreference(String key, String value) => db.execute(
    'INSERT INTO preferences (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );

  Future<void> seedExercisesIfEmpty() async {
    final rows = await db.query('SELECT COUNT(*) AS total FROM exercises');
    if ((rows.first['total'] as int) != 0) return;
    const seed = <(String, String, String, String, String)>[
      ('Barbell Squat', 'strength', 'Legs', 'Barbell', 'weight_reps'),
      ('Deadlift', 'strength', 'Back', 'Barbell', 'weight_reps'),
      ('Bench Press', 'strength', 'Chest', 'Barbell', 'weight_reps'),
      ('Overhead Press', 'strength', 'Shoulders', 'Barbell', 'weight_reps'),
      ('Bent-Over Row', 'strength', 'Back', 'Barbell', 'weight_reps'),
      ('Lat Pulldown', 'strength', 'Back', 'Cable', 'weight_reps'),
      ('Seated Cable Row', 'strength', 'Back', 'Cable', 'weight_reps'),
      ('Leg Press', 'strength', 'Legs', 'Machine', 'weight_reps'),
      ('Romanian Deadlift', 'strength', 'Legs', 'Barbell', 'weight_reps'),
      ('Hip Thrust', 'strength', 'Glutes', 'Barbell', 'weight_reps'),
      ('Dumbbell Curl', 'strength', 'Arms', 'Dumbbells', 'weight_reps'),
      ('Triceps Pushdown', 'strength', 'Arms', 'Cable', 'weight_reps'),
      ('Lateral Raise', 'strength', 'Shoulders', 'Dumbbells', 'weight_reps'),
      ('Push-up', 'strength', 'Chest', 'Bodyweight', 'reps'),
      ('Pull-up', 'strength', 'Back', 'Bodyweight', 'reps'),
      ('Plank', 'strength', 'Core', 'Bodyweight', 'duration'),
      ('Side Plank', 'strength', 'Core', 'Bodyweight', 'duration'),
      ('Jump Rope', 'cardio', 'Full body', 'Other', 'duration'),
      ('Treadmill Run', 'cardio', 'Full body', 'Machine', 'distance'),
      ('Stationary Bike', 'cardio', 'Legs', 'Machine', 'duration'),
    ];
    await db.transaction(() async {
      for (final item in seed) {
        await db.execute(
          'INSERT INTO exercises (id,name,category,muscle_group,equipment,tracking_mode) VALUES (?,?,?,?,?,?)',
          [_id(), item.$1, item.$2, item.$3, item.$4, item.$5],
        );
      }
    });
  }

  Future<List<Exercise>> exercises({String search = ''}) async {
    final rows = await db.query(
      'SELECT * FROM exercises WHERE archived = 0 AND name LIKE ? ORDER BY favorite DESC, name COLLATE NOCASE',
      ['%$search%'],
    );
    return rows.map(Exercise.fromRow).toList();
  }

  Future<Exercise?> exerciseById(String id) async {
    final rows = await db.query('SELECT * FROM exercises WHERE id = ?', [id]);
    return rows.isEmpty ? null : Exercise.fromRow(rows.first);
  }

  Future<String> saveExercise({
    String? id,
    required String name,
    required String category,
    required String group,
    required String equipment,
    required String mode,
  }) async {
    if (name.trim().isEmpty) throw StateError('An exercise name is required.');
    if (id == null) {
      final createdId = _id();
      await db.execute(
        'INSERT INTO exercises (id,name,category,muscle_group,equipment,tracking_mode,custom) VALUES (?,?,?,?,?,?,1)',
        [createdId, name.trim(), category, group, equipment, mode],
      );
      return createdId;
    }
    final existing = await exerciseById(id);
    if (existing == null || !existing.custom) {
      throw StateError('Only custom exercises can be edited.');
    }
    await db.execute(
      'UPDATE exercises SET name=?,category=?,muscle_group=?,equipment=?,tracking_mode=? WHERE id=?',
      [name.trim(), category, group, equipment, mode, id],
    );
    return id;
  }

  Future<void> toggleExerciseFavorite(Exercise item) => db.execute(
    'UPDATE exercises SET favorite=? WHERE id=?',
    [item.favorite ? 0 : 1, item.id],
  );
  Future<void> archiveExercise(Exercise item) async {
    if (!item.custom) throw StateError('Built-in exercises cannot be deleted.');
    await db.execute('UPDATE exercises SET archived=1 WHERE id=?', [item.id]);
  }

  Future<List<Routine>> routines() async {
    final rows = await db.query(
      '''SELECT r.*, (SELECT COUNT(*) FROM routine_exercises re WHERE re.routine_id=r.id) AS exercise_count
      FROM routines r WHERE archived=0 ORDER BY favorite DESC,created_at DESC''',
    );
    return rows.map(Routine.fromRow).toList();
  }

  Future<Routine?> routineById(String id) async {
    final rows = await db.query(
      '''SELECT r.*, (SELECT COUNT(*) FROM routine_exercises re WHERE re.routine_id=r.id) AS exercise_count
      FROM routines r WHERE r.id=?''',
      [id],
    );
    return rows.isEmpty ? null : Routine.fromRow(rows.first);
  }

  Future<List<RoutineExercise>> routineExercises(String routineId) async {
    final rows = await db.query(
      'SELECT * FROM routine_exercises WHERE routine_id=? ORDER BY position',
      [routineId],
    );
    return rows.map(RoutineExercise.fromRow).toList();
  }

  Future<String> createRoutine(String title, {String notes = ''}) async {
    if (title.trim().isEmpty) throw StateError('A routine name is required.');
    final count = await db.query(
      'SELECT COUNT(*) AS total FROM routines WHERE archived=0',
    );
    final connected = await preference('connected_account_id');
    if ((connected == null || connected.isEmpty) &&
        (count.first['total'] as int) >= 3) {
      throw StateError(
        'Guest mode allows 3 routines. Create a free account to save more. Your workout history is safe.',
      );
    }
    final id = _id();
    await db.execute(
      'INSERT INTO routines (id,title,notes,created_at) VALUES (?,?,?,?)',
      [id, title.trim(), notes, _now()],
    );
    return id;
  }

  Future<void> renameRoutine(
    String id,
    String title, {
    String notes = '',
  }) async {
    if (title.trim().isEmpty) throw StateError('A routine name is required.');
    await db.execute('UPDATE routines SET title=?,notes=? WHERE id=?', [
      title.trim(),
      notes,
      id,
    ]);
  }

  Future<void> toggleRoutineFavorite(Routine routine) => db.execute(
    'UPDATE routines SET favorite=? WHERE id=?',
    [routine.favorite ? 0 : 1, routine.id],
  );
  Future<void> archiveRoutine(String id) =>
      db.execute('UPDATE routines SET archived=1 WHERE id=?', [id]);

  Future<String> duplicateRoutine(String id) async {
    final source = await routineById(id);
    if (source == null) throw StateError('Routine not found.');
    final newId = await createRoutine(
      '${source.title} copy',
      notes: source.notes,
    );
    final items = await routineExercises(id);
    await db.transaction(() async {
      for (final item in items) {
        await db.execute(
          '''INSERT INTO routine_exercises
          (id,routine_id,exercise_id,name_snapshot,tracking_mode,position,target_sets,target_reps,target_weight_kg,rest_seconds,notes)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)''',
          [
            _id(),
            newId,
            item.exerciseId,
            item.name,
            item.mode,
            item.position,
            item.targetSets,
            item.targetReps,
            item.targetWeightKg,
            item.restSeconds,
            item.notes,
          ],
        );
      }
    });
    return newId;
  }

  Future<void> addToRoutine(String routineId, Exercise exercise) async {
    final pos = await db.query(
      'SELECT COALESCE(MAX(position),-1)+1 AS next FROM routine_exercises WHERE routine_id=?',
      [routineId],
    );
    await db.execute(
      '''INSERT INTO routine_exercises
      (id,routine_id,exercise_id,name_snapshot,tracking_mode,position,target_sets,target_reps,rest_seconds)
      VALUES (?,?,?,?,?,?,?,?,?)''',
      [
        _id(),
        routineId,
        exercise.id,
        exercise.name,
        exercise.mode,
        pos.first['next'],
        3,
        10,
        90,
      ],
    );
  }

  Future<void> updateRoutineExercise(
    RoutineExercise item, {
    required int sets,
    int? reps,
    double? weightKg,
    required int restSeconds,
    String notes = '',
  }) async {
    if (sets < 1 || sets > 30 || restSeconds < 0 || restSeconds > 3600) {
      throw StateError('Invalid sets or rest duration.');
    }
    await db.execute(
      'UPDATE routine_exercises SET target_sets=?,target_reps=?,target_weight_kg=?,rest_seconds=?,notes=? WHERE id=?',
      [sets, reps, weightKg, restSeconds, notes, item.id],
    );
  }

  Future<void> removeRoutineExercise(String id, String routineId) async {
    await db.transaction(() async {
      await db.execute('DELETE FROM routine_exercises WHERE id=?', [id]);
      final rows = await db.query(
        'SELECT id FROM routine_exercises WHERE routine_id=? ORDER BY position',
        [routineId],
      );
      for (var i = 0; i < rows.length; i++) {
        await db.execute('UPDATE routine_exercises SET position=? WHERE id=?', [
          i,
          rows[i]['id'],
        ]);
      }
    });
  }

  Future<void> moveRoutineExercise(
    String routineId,
    int oldIndex,
    int newIndex,
  ) async {
    final rows = await routineExercises(routineId);
    if (oldIndex < 0 ||
        oldIndex >= rows.length ||
        newIndex < 0 ||
        newIndex >= rows.length) {
      return;
    }
    final item = rows.removeAt(oldIndex);
    rows.insert(newIndex, item);
    await db.transaction(() async {
      for (var i = 0; i < rows.length; i++) {
        await db.execute('UPDATE routine_exercises SET position=? WHERE id=?', [
          i,
          rows[i].id,
        ]);
      }
    });
  }

  Future<List<WorkoutSession>> sessions() async {
    final rows = await db.query(
      'SELECT * FROM sessions WHERE status != ? ORDER BY started_at DESC',
      ['discarded'],
    );
    return rows.map(WorkoutSession.fromRow).toList();
  }

  Future<WorkoutSession?> activeSession() async {
    final rows = await db.query(
      "SELECT * FROM sessions WHERE status='in_progress' ORDER BY started_at DESC LIMIT 1",
    );
    return rows.isEmpty ? null : WorkoutSession.fromRow(rows.first);
  }

  Future<WorkoutSession?> sessionById(String id) async {
    final rows = await db.query('SELECT * FROM sessions WHERE id=?', [id]);
    return rows.isEmpty ? null : WorkoutSession.fromRow(rows.first);
  }

  Future<List<SessionExercise>> sessionExercises(String sessionId) async {
    final rows = await db.query(
      'SELECT * FROM session_exercises WHERE session_id=? ORDER BY position',
      [sessionId],
    );
    return rows.map(SessionExercise.fromRow).toList();
  }

  Future<List<LoggedSet>> setsForSession(String sessionId) async {
    final rows = await db.query(
      '''SELECT ss.* FROM session_sets ss JOIN session_exercises se ON se.id=ss.session_exercise_id
       WHERE se.session_id=? ORDER BY se.position,ss.position''',
      [sessionId],
    );
    return rows.map(LoggedSet.fromRow).toList();
  }

  Future<List<LoggedSet>> setsForExercise(String exerciseId) async {
    final rows = await db.query(
      'SELECT * FROM session_sets WHERE session_exercise_id=? ORDER BY position',
      [exerciseId],
    );
    return rows.map(LoggedSet.fromRow).toList();
  }

  Future<String> startSession({String? routineId}) async {
    final existing = await activeSession();
    if (existing != null) return existing.id;
    final routine = routineId == null ? null : await routineById(routineId);
    if (routineId != null && routine == null) {
      throw StateError('Routine not found.');
    }
    final template = routine == null
        ? <RoutineExercise>[]
        : await routineExercises(routine.id);
    final sessionId = _id();
    await db.transaction(() async {
      await db.execute(
        '''INSERT INTO sessions (id,routine_id,name_snapshot,status,started_at) VALUES (?,?,?,'in_progress',?)''',
        [sessionId, routine?.id, routine?.title ?? 'Empty workout', _now()],
      );
      for (final item in template) {
        final seId = _id();
        await db.execute(
          '''INSERT INTO session_exercises
          (id,session_id,source_exercise_id,name_snapshot,tracking_mode,position,rest_seconds,notes)
          VALUES (?,?,?,?,?,?,?,?)''',
          [
            seId,
            sessionId,
            item.exerciseId,
            item.name,
            item.mode,
            item.position,
            item.restSeconds,
            item.notes,
          ],
        );
        for (var index = 0; index < item.targetSets; index++) {
          await db.execute(
            'INSERT INTO session_sets (id,session_exercise_id,position) VALUES (?,?,?)',
            [_id(), seId, index],
          );
        }
      }
    });
    return sessionId;
  }

  Future<void> addSessionExercise(String sessionId, Exercise exercise) async {
    final session = await sessionById(sessionId);
    if (session?.status != 'in_progress') {
      throw StateError('This session is not editable.');
    }
    final pos = await db.query(
      'SELECT COALESCE(MAX(position),-1)+1 AS next FROM session_exercises WHERE session_id=?',
      [sessionId],
    );
    final id = _id();
    await db.transaction(() async {
      await db.execute(
        '''INSERT INTO session_exercises
        (id,session_id,source_exercise_id,name_snapshot,tracking_mode,position)
        VALUES (?,?,?,?,?,?)''',
        [
          id,
          sessionId,
          exercise.id,
          exercise.name,
          exercise.mode,
          pos.first['next'],
        ],
      );
      await db.execute(
        'INSERT INTO session_sets (id,session_exercise_id,position) VALUES (?,?,0)',
        [_id(), id],
      );
    });
  }

  Future<void> addSet(String exerciseId) async {
    final parent = await db.query(
      "SELECT s.status FROM session_exercises se JOIN sessions s ON s.id=se.session_id WHERE se.id=?",
      [exerciseId],
    );
    if (parent.isEmpty || parent.first['status'] != 'in_progress') {
      throw StateError('Cannot edit a closed session.');
    }
    final rows = await db.query(
      'SELECT COALESCE(MAX(position),-1)+1 AS next FROM session_sets WHERE session_exercise_id=?',
      [exerciseId],
    );
    await db.execute(
      'INSERT INTO session_sets (id,session_exercise_id,position) VALUES (?,?,?)',
      [_id(), exerciseId, rows.first['next']],
    );
  }

  Future<void> updateSet(
    String id, {
    double? weightKg,
    int? reps,
    int? seconds,
    double? meters,
    required bool completed,
  }) async {
    final rows = await db.query(
      '''SELECT se.tracking_mode, s.status FROM session_sets ss JOIN session_exercises se ON se.id=ss.session_exercise_id
       JOIN sessions s ON s.id=se.session_id WHERE ss.id=?''',
      [id],
    );
    if (rows.isEmpty || rows.first['status'] != 'in_progress') {
      throw StateError('Cannot change a finished workout.');
    }
    final mode = rows.first['tracking_mode'] as String;
    if (completed) {
      final valid = isValidCompletedSet(
        mode: mode,
        weightKg: weightKg,
        reps: reps,
        seconds: seconds,
        meters: meters,
      );
      if (!valid) {
        throw StateError(
          'Enter valid actual values before completing the set.',
        );
      }
    }
    if (weightKg != null && (weightKg < 0 || weightKg > 1500)) {
      throw StateError('Invalid weight.');
    }
    if (reps != null && (reps < 0 || reps > 10000)) {
      throw StateError('Invalid repetitions.');
    }
    await db.execute(
      '''UPDATE session_sets SET weight_kg=?,reps=?,duration_seconds=?,distance_meters=?,completed=? WHERE id=?''',
      [weightKg, reps, seconds, meters, completed ? 1 : 0, id],
    );
  }

  Future<void> deleteSet(String id) async {
    await db.transaction(() async {
      final current = await db.query(
        'SELECT session_exercise_id FROM session_sets WHERE id=?',
        [id],
      );
      if (current.isEmpty) return;
      final seId = current.first['session_exercise_id'] as String;
      final session = await db.query(
        'SELECT s.status FROM session_exercises se JOIN sessions s ON s.id=se.session_id WHERE se.id=?',
        [seId],
      );
      if (session.first['status'] != 'in_progress') {
        throw StateError('Cannot edit completed workouts.');
      }
      await db.execute('DELETE FROM session_sets WHERE id=?', [id]);
      final rows = await db.query(
        'SELECT id FROM session_sets WHERE session_exercise_id=? ORDER BY position',
        [seId],
      );
      for (var i = 0; i < rows.length; i++) {
        await db.execute('UPDATE session_sets SET position=? WHERE id=?', [
          i,
          rows[i]['id'],
        ]);
      }
    });
  }

  Future<void> deleteSessionExercise(String id) async {
    final parent = await db.query(
      '''SELECT s.status FROM session_exercises se JOIN sessions s ON se.session_id=s.id WHERE se.id=?''',
      [id],
    );
    if (parent.isEmpty || parent.first['status'] != 'in_progress') {
      throw StateError('Cannot edit completed workouts.');
    }
    await db.execute('DELETE FROM session_exercises WHERE id=?', [id]);
  }

  Future<void> setSessionNotes(String id, String notes) => db.execute(
    'UPDATE sessions SET notes=? WHERE id=? AND status=?',
    [notes, id, 'in_progress'],
  );

  Future<void> finishSession(String id) async {
    await db.transaction(() async {
      final session = await sessionById(id);
      if (session?.status == 'completed') return; // idempotent finish
      if (session?.status != 'in_progress') {
        throw StateError('Session is not active.');
      }
      final rows = await db.query(
        '''SELECT COUNT(*) AS total FROM session_sets ss
        JOIN session_exercises se ON se.id=ss.session_exercise_id WHERE se.session_id=? AND ss.completed=1''',
        [id],
      );
      if ((rows.first['total'] as int) < 1) {
        throw StateError('Complete at least one valid set before finishing.');
      }
      await db.execute(
        "UPDATE sessions SET status='completed',finished_at=? WHERE id=? AND status='in_progress'",
        [_now(), id],
      );
    });
  }

  Future<void> discardSession(String id) => db.execute(
    "UPDATE sessions SET status='discarded',finished_at=? WHERE id=? AND status='in_progress'",
    [_now(), id],
  );
  Future<void> deleteCompletedSession(String id) => db.execute(
    "DELETE FROM sessions WHERE id=? AND status='completed'",
    [id],
  );

  Future<List<CardioEntry>> cardio() async {
    final rows = await db.query(
      'SELECT * FROM cardio_entries ORDER BY occurred_at DESC',
    );
    return rows.map(CardioEntry.fromRow).toList();
  }

  Future<void> logCardio({
    required String activity,
    required int seconds,
    double? meters,
    String notes = '',
  }) async {
    if (seconds <= 0 || meters != null && meters <= 0) {
      throw StateError('Enter a valid duration and distance.');
    }
    await db.execute(
      'INSERT INTO cardio_entries (id,activity,duration_seconds,distance_meters,occurred_at,notes) VALUES (?,?,?,?,?,?)',
      [_id(), activity, seconds, meters, _now(), notes],
    );
  }

  Future<void> deleteCardio(String id) =>
      db.execute('DELETE FROM cardio_entries WHERE id=?', [id]);

  Future<List<Food>> foods({String search = ''}) async {
    final rows = await db.query(
      'SELECT * FROM foods WHERE name LIKE ? ORDER BY favorite DESC,name COLLATE NOCASE',
      ['%$search%'],
    );
    return rows.map(Food.fromRow).toList();
  }

  Future<Food?> foodById(String id) async {
    final rows = await db.query('SELECT * FROM foods WHERE id=?', [id]);
    return rows.isEmpty ? null : Food.fromRow(rows.first);
  }

  Future<String> saveFood({
    String? id,
    required String name,
    String brand = '',
    double? kcal,
    double? protein,
    double? carbs,
    double? fat,
  }) async {
    if (name.trim().isEmpty) throw StateError('A food name is required.');
    for (final value in [kcal, protein, carbs, fat]) {
      if (value != null && (value < 0 || value > 10000)) {
        throw StateError('Nutrients must be nonnegative and realistic.');
      }
    }
    final foodId = id ?? _id();
    if (id == null) {
      await db.execute(
        'INSERT INTO foods (id,name,brand,kcal_100g,protein_100g,carbs_100g,fat_100g,source) VALUES (?,?,?,?,?,?,?,?)',
        [foodId, name.trim(), brand.trim(), kcal, protein, carbs, fat, 'user'],
      );
    } else {
      await db.execute(
        'UPDATE foods SET name=?,brand=?,kcal_100g=?,protein_100g=?,carbs_100g=?,fat_100g=? WHERE id=?',
        [name.trim(), brand.trim(), kcal, protein, carbs, fat, id],
      );
    }
    return foodId;
  }

  Future<void> toggleFoodFavorite(Food food) => db.execute(
    'UPDATE foods SET favorite=? WHERE id=?',
    [food.favorite ? 0 : 1, food.id],
  );
  Future<void> deleteFood(String id) =>
      db.execute('DELETE FROM foods WHERE id=?', [id]);

  Future<List<MealEntry>> meals() async {
    final rows = await db.query(
      'SELECT * FROM meal_entries ORDER BY occurred_at DESC',
    );
    return rows.map(MealEntry.fromRow).toList();
  }

  Future<void> addMeal(
    Food food, {
    required double grams,
    required String meal,
    DateTime? day,
  }) async {
    if (grams <= 0 || grams > 20000) {
      throw StateError('Enter a valid serving weight.');
    }
    final now = DateTime.now();
    final time = day == null
        ? now
        : DateTime(day.year, day.month, day.day, now.hour, now.minute);
    await db.execute(
      '''INSERT INTO meal_entries (id,food_id,name_snapshot,meal_type,grams,kcal,protein,carbs,fat,occurred_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)''',
      [
        _id(),
        food.id,
        food.name,
        meal,
        grams,
        scaledNutrient(food.kcal, grams),
        scaledNutrient(food.protein, grams),
        scaledNutrient(food.carbs, grams),
        scaledNutrient(food.fat, grams),
        time.toUtc().toIso8601String(),
      ],
    );
  }

  Future<void> deleteMeal(String id) =>
      db.execute('DELETE FROM meal_entries WHERE id=?', [id]);

  Future<List<WaterEntry>> hydration() async {
    final rows = await db.query(
      'SELECT * FROM hydration_entries ORDER BY occurred_at DESC',
    );
    return rows.map(WaterEntry.fromRow).toList();
  }

  Future<void> addWater(int milliliters, {DateTime? day}) async {
    if (milliliters <= 0 || milliliters > 10000) {
      throw StateError('Enter a valid volume.');
    }
    final now = DateTime.now();
    final at = day == null
        ? now
        : DateTime(day.year, day.month, day.day, now.hour, now.minute);
    await db.execute(
      'INSERT INTO hydration_entries (id,volume_ml,occurred_at) VALUES (?,?,?)',
      [_id(), milliliters, at.toUtc().toIso8601String()],
    );
  }

  Future<void> deleteWater(String id) =>
      db.execute('DELETE FROM hydration_entries WHERE id=?', [id]);

  Future<List<Program>> programs() async {
    final rows = await db.query(
      'SELECT * FROM programs ORDER BY created_at DESC',
    );
    return rows.map(Program.fromRow).toList();
  }

  Future<String> createProgram(
    String name, {
    required String goal,
    required int weeks,
  }) async {
    if (name.trim().isEmpty || weeks < 1 || weeks > 52) {
      throw StateError('Enter a name and 1–52 weeks.');
    }
    final id = _id();
    await db.execute(
      'INSERT INTO programs (id,name,goal,weeks,created_at) VALUES (?,?,?,?,?)',
      [id, name.trim(), goal, weeks, _now()],
    );
    return id;
  }

  Future<List<Map<String, dynamic>>> programDays(String programId) => db.query(
    '''SELECT pd.*, r.title AS routine_title
    FROM program_days pd LEFT JOIN routines r ON r.id=pd.routine_id WHERE pd.program_id=? ORDER BY pd.day_number''',
    [programId],
  );
  Future<void> assignProgramDay(
    String programId,
    int day,
    String? routineId,
  ) async {
    if (day < 1 || day > 7) throw StateError('Choose a weekday from 1 to 7.');
    await db.execute(
      'DELETE FROM program_days WHERE program_id=? AND day_number=?',
      [programId, day],
    );
    if (routineId != null) {
      await db.execute(
        'INSERT INTO program_days (id,program_id,day_number,routine_id) VALUES (?,?,?,?)',
        [_id(), programId, day, routineId],
      );
    }
  }

  Future<void> deleteProgram(String id) =>
      db.execute('DELETE FROM programs WHERE id=?', [id]);

  Future<List<Recipe>> recipes() async {
    final rows = await db.query(
      'SELECT * FROM recipes ORDER BY name COLLATE NOCASE',
    );
    return rows.map(Recipe.fromRow).toList();
  }

  Future<String> createRecipe(
    String name, {
    required int servings,
    String instructions = '',
  }) async {
    if (name.trim().isEmpty || servings <= 0) {
      throw StateError('Recipe name and servings are required.');
    }
    final id = _id();
    await db.execute(
      'INSERT INTO recipes (id,name,instructions,servings) VALUES (?,?,?,?)',
      [id, name.trim(), instructions, servings],
    );
    return id;
  }

  Future<List<RecipeIngredient>> ingredients(String recipeId) async {
    final rows = await db.query(
      'SELECT * FROM recipe_ingredients WHERE recipe_id=?',
      [recipeId],
    );
    return rows.map(RecipeIngredient.fromRow).toList();
  }

  Future<void> addIngredient(String recipeId, Food food, double grams) async {
    if (grams <= 0 || grams > 10000) throw StateError('Enter valid grams.');
    await db.execute(
      '''INSERT INTO recipe_ingredients
      (id,recipe_id,food_id,name_snapshot,grams,kcal,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?)''',
      [
        _id(),
        recipeId,
        food.id,
        food.name,
        grams,
        scaledNutrient(food.kcal, grams),
        scaledNutrient(food.protein, grams),
        scaledNutrient(food.carbs, grams),
        scaledNutrient(food.fat, grams),
      ],
    );
  }

  Future<void> deleteIngredient(String id) =>
      db.execute('DELETE FROM recipe_ingredients WHERE id=?', [id]);
  Future<void> deleteRecipe(String id) =>
      db.execute('DELETE FROM recipes WHERE id=?', [id]);

  static const exportTables = <String>[
    'preferences',
    'exercises',
    'routines',
    'routine_exercises',
    'sessions',
    'session_exercises',
    'session_sets',
    'cardio_entries',
    'foods',
    'meal_entries',
    'hydration_entries',
    'programs',
    'program_days',
    'recipes',
    'recipe_ingredients',
    'saved_meals',
    'saved_meal_items',
    'nutrition_goals',
    'local_notifications',
  ];

  Future<String> exportJson() async {
    const tables = exportTables;
    final contents = <String, dynamic>{
      'format': 'kinetiq-offline-export',
      'schemaVersion': 2,
      'exportedAt': _now(),
    };
    await db.transaction(() async {
      for (final table in tables) {
        contents[table] = await db.query('SELECT * FROM $table');
      }
    });
    return const JsonEncoder.withIndent('  ').convert(contents);
  }

  // User-owned JSON import: stable IDs are never silently overwritten.
  Future<ImportPreview> previewImport(String raw) async {
    final tables = _validateImport(raw);
    var added = 0, duplicates = 0, conflicts = 0;
    for (final table in exportTables) {
      for (final record in tables[table]!) {
        final key = table == 'preferences' ? 'key' : 'id';
        if (table == 'preferences' && record[key] == 'connected_account_id') {
          continue;
        }
        final existing = await db.query('SELECT * FROM $table WHERE $key=?', [
          record[key],
        ]);
        if (existing.isEmpty) {
          added++;
        } else if (_matchingRows(existing.first, record)) {
          duplicates++;
        } else {
          conflicts++;
        }
      }
    }
    return ImportPreview(added, duplicates, conflicts);
  }

  Future<ImportPreview> importJson(String raw) async {
    final tables = _validateImport(raw);
    final preview = await previewImport(raw);
    if (preview.conflicts > 0) {
      throw StateError(
        '${preview.conflicts} conflicting records found. No data imported; export both copies before resolving.',
      );
    }
    await db.transaction(() async {
      for (final table in exportTables) {
        final validColumns = (await db.query('PRAGMA table_info($table)'))
            .map((row) => row['name'] as String)
            .toSet();
        for (final record in tables[table]!) {
          if (table == 'preferences' &&
              record['key'] == 'connected_account_id') {
            continue;
          }
          if (record.keys.any((key) => !validColumns.contains(key))) {
            throw StateError(
              'Unsupported column in $table. No records were imported.',
            );
          }
          final keys = record.keys.toList();
          if (keys.isEmpty) continue;
          final marks = List.filled(keys.length, '?').join(',');
          await db.execute(
            'INSERT OR IGNORE INTO $table (${keys.join(',')}) VALUES ($marks)',
            keys.map((key) => record[key] as Object?).toList(),
          );
        }
      }
    });
    return preview;
  }

  bool _matchingRows(
    Map<String, dynamic> existing,
    Map<String, dynamic> imported,
  ) {
    // New nullable columns in schema v2 may be missing from v1 records.
    for (final entry in imported.entries) {
      final left = existing[entry.key];
      final right = entry.value;
      if (left == null && right == null) continue;
      if (left is num && right is num && left == right) continue;
      if (left != right) return false;
    }
    return true;
  }

  Map<String, List<Map<String, dynamic>>> _validateImport(String raw) {
    if (raw.length > 8000000) {
      throw StateError('Import larger than 8 MB is not supported.');
    }
    late Map<String, dynamic> data;
    try {
      data = (jsonDecode(raw) as Map).cast<String, dynamic>();
    } catch (_) {
      throw StateError('Import is not a valid JSON object.');
    }
    if (data['format'] != 'kinetiq-offline-export' ||
        (data['schemaVersion'] != 1 && data['schemaVersion'] != 2)) {
      throw StateError('Unsupported KINETIQ export version.');
    }
    final result = <String, List<Map<String, dynamic>>>{};
    for (final table in exportTables) {
      final entries = data[table];
      if (entries == null &&
          data['schemaVersion'] == 1 &&
          const [
            'saved_meals',
            'saved_meal_items',
            'nutrition_goals',
            'local_notifications',
          ].contains(table)) {
        result[table] = [];
        continue;
      }
      if (entries is! List || entries.length > 100000) {
        throw StateError('Missing or invalid table $table in backup.');
      }
      result[table] = entries.map((entry) {
        if (entry is! Map) throw StateError('Invalid record in $table.');
        final row = entry.cast<String, dynamic>();
        final key = table == 'preferences' ? 'key' : 'id';
        if (row[key] is! String || (row[key] as String).isEmpty) {
          throw StateError('Invalid identity in $table.');
        }
        if (row.values.any((value) => value is List || value is Map)) {
          throw StateError('Nested values are not supported in $table.');
        }
        return row;
      }).toList();
    }
    return result;
  }

  Future<void> clearLocalRecords() async {
    await db.transaction(() async {
      for (final table in exportTables.reversed) {
        if (table == 'preferences') continue;
        await db.execute('DELETE FROM $table');
      }
      await db.execute('DELETE FROM preferences WHERE key != ?', ['onboarded']);
    });
  }

  Future<List<SavedMeal>> savedMeals() async {
    final rows = await db.query(
      'SELECT * FROM saved_meals ORDER BY name COLLATE NOCASE',
    );
    return rows.map(SavedMeal.fromRow).toList();
  }

  Future<List<SavedMealItem>> savedMealItems(String id) async {
    final rows = await db.query(
      'SELECT * FROM saved_meal_items WHERE saved_meal_id=? ORDER BY rowid',
      [id],
    );
    return rows.map(SavedMealItem.fromRow).toList();
  }

  Future<String> saveMealTemplate(
    String name,
    List<({Food food, double grams})> portions,
  ) async {
    if (name.trim().isEmpty || portions.isEmpty) {
      throw StateError('Name and at least one food are required.');
    }
    if (portions.any(
      (portion) => portion.grams <= 0 || portion.grams > 20000,
    )) {
      throw StateError('Invalid portion.');
    }
    final id = _id();
    await db.transaction(() async {
      await db.execute(
        'INSERT INTO saved_meals (id,name,created_at) VALUES (?,?,?)',
        [id, name.trim(), _now()],
      );
      for (final portion in portions) {
        final food = portion.food;
        final grams = portion.grams;
        await db.execute(
          '''INSERT INTO saved_meal_items
          (id,saved_meal_id,food_id,name_snapshot,grams,kcal,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?)''',
          [
            _id(),
            id,
            food.id,
            food.name,
            grams,
            scaledNutrient(food.kcal, grams),
            scaledNutrient(food.protein, grams),
            scaledNutrient(food.carbs, grams),
            scaledNutrient(food.fat, grams),
          ],
        );
      }
    });
    return id;
  }

  Future<void> deleteSavedMeal(String id) =>
      db.execute('DELETE FROM saved_meals WHERE id=?', [id]);
  Future<void> logSavedMeal(String id, String meal, {DateTime? day}) async {
    final items = await db.query(
      'SELECT * FROM saved_meal_items WHERE saved_meal_id=?',
      [id],
    );
    if (items.isEmpty) throw StateError('Saved meal has no ingredients.');
    final now = DateTime.now();
    final at = day == null
        ? now
        : DateTime(day.year, day.month, day.day, now.hour, now.minute);
    await db.transaction(() async {
      for (final item in items) {
        await db.execute(
          '''INSERT INTO meal_entries
          (id,food_id,name_snapshot,meal_type,grams,kcal,protein,carbs,fat,occurred_at)
          VALUES (?,?,?,?,?,?,?,?,?,?)''',
          [
            _id(),
            item['food_id'],
            item['name_snapshot'],
            meal,
            item['grams'],
            item['kcal'],
            item['protein'],
            item['carbs'],
            item['fat'],
            at.toUtc().toIso8601String(),
          ],
        );
      }
    });
  }

  Future<void> copyMealsFromDay(DateTime source, DateTime destination) async {
    final entries = await meals();
    final selected = entries
        .where((entry) => isSameLocalDay(entry.occurredAt, source))
        .toList();
    await db.transaction(() async {
      for (final item in selected) {
        final local = item.occurredAt.toLocal();
        final at = DateTime(
          destination.year,
          destination.month,
          destination.day,
          local.hour,
          local.minute,
        );
        await db.execute(
          '''INSERT INTO meal_entries
          (id,name_snapshot,meal_type,grams,kcal,protein,carbs,fat,occurred_at)
          VALUES (?,?,?,?,?,?,?,?,?)''',
          [
            _id(),
            item.name,
            item.meal,
            item.grams,
            item.kcal,
            item.protein,
            item.carbs,
            item.fat,
            at.toUtc().toIso8601String(),
          ],
        );
      }
    });
  }

  Future<void> updateMealEntry(
    String id, {
    required String category,
    required double grams,
  }) async {
    if (grams <= 0 || grams > 20000) {
      throw StateError('Enter a valid serving weight.');
    }
    final rows = await db.query('SELECT * FROM meal_entries WHERE id=?', [id]);
    if (rows.isEmpty) throw StateError('Meal not found.');
    final original = MealEntry.fromRow(rows.first);
    if (original.grams <= 0) {
      throw StateError('Cannot update invalid meal amount.');
    }
    final factor = grams / original.grams;
    double? scale(double? value) => value == null ? null : value * factor;
    await db.execute(
      'UPDATE meal_entries SET meal_type=?,grams=?,kcal=?,protein=?,carbs=?,fat=? WHERE id=?',
      [
        category,
        grams,
        scale(original.kcal),
        scale(original.protein),
        scale(original.carbs),
        scale(original.fat),
        id,
      ],
    );
  }

  Future<NutritionGoals?> nutritionGoals() async {
    final rows = await db.query(
      'SELECT * FROM nutrition_goals ORDER BY created_at DESC LIMIT 1',
    );
    return rows.isEmpty ? null : NutritionGoals.fromRow(rows.first);
  }

  Future<void> saveNutritionGoals({
    double? kcal,
    double? protein,
    double? carbs,
    double? fat,
  }) async {
    for (final value in [kcal, protein, carbs, fat]) {
      if (value != null && (value < 0 || !value.isFinite || value > 10000)) {
        throw StateError('Invalid target value.');
      }
    }
    await db.transaction(() async {
      await db.execute('DELETE FROM nutrition_goals');
      await db.execute(
        'INSERT INTO nutrition_goals (id,kcal,protein,carbs,fat,created_at) VALUES (?,?,?,?,?,?)',
        [_id(), kcal, protein, carbs, fat, _now()],
      );
    });
  }

  Future<void> saveSetDetails(
    String setId, {
    String kind = 'working',
    double? rpe,
    double? rir,
    String notes = '',
  }) async {
    if (!const ['working', 'warmup', 'drop', 'failure'].contains(kind)) {
      throw StateError('Invalid set type.');
    }
    if (rpe != null && (rpe < 1 || rpe > 10)) {
      throw StateError('RPE must be 1–10.');
    }
    if (rir != null && (rir < 0 || rir > 10)) {
      throw StateError('RIR must be 0–10.');
    }
    final rows = await db.query(
      '''SELECT s.status FROM session_sets ss
      JOIN session_exercises se ON se.id=ss.session_exercise_id
      JOIN sessions s ON s.id=se.session_id WHERE ss.id=?''',
      [setId],
    );
    if (rows.isEmpty || rows.first['status'] != 'in_progress') {
      throw StateError('Set is not editable.');
    }
    await db.execute(
      'UPDATE session_sets SET kind=?,rpe=?,rir=?,notes=? WHERE id=?',
      [kind, rpe, rir, notes, setId],
    );
  }

  Future<void> editCompletedSet(
    String id, {
    double? weightKg,
    int? reps,
    int? seconds,
    double? meters,
    required bool completed,
  }) async {
    final rows = await db.query(
      '''SELECT se.tracking_mode,s.status FROM session_sets ss
      JOIN session_exercises se ON ss.session_exercise_id=se.id
      JOIN sessions s ON se.session_id=s.id WHERE ss.id=?''',
      [id],
    );
    if (rows.isEmpty || rows.first['status'] != 'completed') {
      throw StateError('Only completed session records can be edited here.');
    }
    if (completed &&
        !isValidCompletedSet(
          mode: rows.first['tracking_mode'] as String,
          weightKg: weightKg,
          reps: reps,
          seconds: seconds,
          meters: meters,
        )) {
      throw StateError('Record needs valid performed values.');
    }
    await db.transaction(() async {
      await db.execute(
        'UPDATE session_sets SET weight_kg=?,reps=?,duration_seconds=?,distance_meters=?,completed=? WHERE id=?',
        [weightKg, reps, seconds, meters, completed ? 1 : 0, id],
      );
    });
  }
}

class ImportPreview {
  const ImportPreview(this.added, this.duplicates, this.conflicts);
  final int added, duplicates, conflicts;
}
