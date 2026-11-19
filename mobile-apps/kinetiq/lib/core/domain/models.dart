// Typed snapshots from SQLite. All IDs are stable UUID strings.

String _s(Map<String, dynamic> m, String k, [String fallback = '']) =>
    m[k]?.toString() ?? fallback;
int _i(Map<String, dynamic> m, String k, [int fallback = 0]) =>
    (m[k] as num?)?.toInt() ?? fallback;
double? _d(Map<String, dynamic> m, String k) => (m[k] as num?)?.toDouble();
bool _b(Map<String, dynamic> m, String k) => _i(m, k) == 1;
DateTime _date(Map<String, dynamic> m, String k) => DateTime.parse(_s(m, k));

class Exercise {
  const Exercise({
    required this.id,
    required this.name,
    required this.category,
    required this.group,
    required this.equipment,
    required this.mode,
    required this.custom,
    required this.favorite,
  });
  final String id, name, category, group, equipment, mode;
  final bool custom, favorite;
  factory Exercise.fromRow(Map<String, dynamic> m) => Exercise(
    id: _s(m, 'id'),
    name: _s(m, 'name'),
    category: _s(m, 'category'),
    group: _s(m, 'muscle_group'),
    equipment: _s(m, 'equipment'),
    mode: _s(m, 'tracking_mode'),
    custom: _b(m, 'custom'),
    favorite: _b(m, 'favorite'),
  );
}

class Routine {
  const Routine({
    required this.id,
    required this.title,
    required this.notes,
    required this.favorite,
    required this.count,
  });
  final String id, title, notes;
  final bool favorite;
  final int count;
  factory Routine.fromRow(Map<String, dynamic> m) => Routine(
    id: _s(m, 'id'),
    title: _s(m, 'title'),
    notes: _s(m, 'notes'),
    favorite: _b(m, 'favorite'),
    count: _i(m, 'exercise_count'),
  );
}

class RoutineExercise {
  const RoutineExercise({
    required this.id,
    required this.routineId,
    required this.exerciseId,
    required this.name,
    required this.mode,
    required this.position,
    required this.targetSets,
    required this.targetReps,
    required this.targetWeightKg,
    required this.restSeconds,
    required this.notes,
  });
  final String id, routineId, name, mode, notes;
  final String? exerciseId;
  final int position, targetSets, restSeconds;
  final int? targetReps;
  final double? targetWeightKg;
  factory RoutineExercise.fromRow(Map<String, dynamic> m) => RoutineExercise(
    id: _s(m, 'id'),
    routineId: _s(m, 'routine_id'),
    exerciseId: m['exercise_id'] as String?,
    name: _s(m, 'name_snapshot'),
    mode: _s(m, 'tracking_mode'),
    position: _i(m, 'position'),
    targetSets: _i(m, 'target_sets', 3),
    targetReps: (m['target_reps'] as num?)?.toInt(),
    targetWeightKg: _d(m, 'target_weight_kg'),
    restSeconds: _i(m, 'rest_seconds', 90),
    notes: _s(m, 'notes'),
  );
}

class WorkoutSession {
  const WorkoutSession({
    required this.id,
    required this.name,
    required this.status,
    required this.startedAt,
    required this.finishedAt,
    required this.notes,
  });
  final String id, name, status, notes;
  final DateTime startedAt;
  final DateTime? finishedAt;
  factory WorkoutSession.fromRow(Map<String, dynamic> m) => WorkoutSession(
    id: _s(m, 'id'),
    name: _s(m, 'name_snapshot'),
    status: _s(m, 'status'),
    startedAt: _date(m, 'started_at'),
    finishedAt: m['finished_at'] == null ? null : _date(m, 'finished_at'),
    notes: _s(m, 'notes'),
  );
  Duration get duration => (finishedAt ?? DateTime.now()).difference(startedAt);
}

class SessionExercise {
  const SessionExercise({
    required this.id,
    required this.sessionId,
    required this.name,
    required this.mode,
    required this.position,
    required this.restSeconds,
  });
  final String id, sessionId, name, mode;
  final int position, restSeconds;
  factory SessionExercise.fromRow(Map<String, dynamic> m) => SessionExercise(
    id: _s(m, 'id'),
    sessionId: _s(m, 'session_id'),
    name: _s(m, 'name_snapshot'),
    mode: _s(m, 'tracking_mode'),
    position: _i(m, 'position'),
    restSeconds: _i(m, 'rest_seconds', 90),
  );
}

class LoggedSet {
  const LoggedSet({
    required this.id,
    required this.sessionExerciseId,
    required this.position,
    required this.weightKg,
    required this.reps,
    required this.seconds,
    required this.meters,
    required this.completed,
    this.kind = 'working',
    this.rpe,
    this.rir,
    this.notes = '',
  });
  final String id, sessionExerciseId;
  final int position;
  final double? weightKg, meters;
  final int? reps, seconds;
  final bool completed;
  final String kind, notes;
  final double? rpe, rir;
  factory LoggedSet.fromRow(Map<String, dynamic> m) => LoggedSet(
    id: _s(m, 'id'),
    sessionExerciseId: _s(m, 'session_exercise_id'),
    position: _i(m, 'position'),
    weightKg: _d(m, 'weight_kg'),
    reps: (m['reps'] as num?)?.toInt(),
    seconds: (m['duration_seconds'] as num?)?.toInt(),
    meters: _d(m, 'distance_meters'),
    completed: _b(m, 'completed'),
    kind: _s(m, 'kind', 'working'),
    rpe: _d(m, 'rpe'),
    rir: _d(m, 'rir'),
    notes: _s(m, 'notes'),
  );
}

class CardioEntry {
  const CardioEntry({
    required this.id,
    required this.activity,
    required this.seconds,
    required this.meters,
    required this.occurredAt,
    required this.notes,
  });
  final String id, activity, notes;
  final int seconds;
  final double? meters;
  final DateTime occurredAt;
  factory CardioEntry.fromRow(Map<String, dynamic> m) => CardioEntry(
    id: _s(m, 'id'),
    activity: _s(m, 'activity'),
    seconds: _i(m, 'duration_seconds'),
    meters: _d(m, 'distance_meters'),
    occurredAt: _date(m, 'occurred_at'),
    notes: _s(m, 'notes'),
  );
}

class Food {
  const Food({
    required this.id,
    required this.name,
    required this.brand,
    required this.kcal,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.source,
    required this.favorite,
  });
  final String id, name, brand, source;
  final double? kcal, protein, carbs, fat;
  final bool favorite;
  factory Food.fromRow(Map<String, dynamic> m) => Food(
    id: _s(m, 'id'),
    name: _s(m, 'name'),
    brand: _s(m, 'brand'),
    kcal: _d(m, 'kcal_100g'),
    protein: _d(m, 'protein_100g'),
    carbs: _d(m, 'carbs_100g'),
    fat: _d(m, 'fat_100g'),
    source: _s(m, 'source'),
    favorite: _b(m, 'favorite'),
  );
}

class MealEntry {
  const MealEntry({
    required this.id,
    required this.name,
    required this.meal,
    required this.grams,
    required this.kcal,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.occurredAt,
  });
  final String id, name, meal;
  final double grams;
  final double? kcal, protein, carbs, fat;
  final DateTime occurredAt;
  factory MealEntry.fromRow(Map<String, dynamic> m) => MealEntry(
    id: _s(m, 'id'),
    name: _s(m, 'name_snapshot'),
    meal: _s(m, 'meal_type'),
    grams: _d(m, 'grams') ?? 0,
    kcal: _d(m, 'kcal'),
    protein: _d(m, 'protein'),
    carbs: _d(m, 'carbs'),
    fat: _d(m, 'fat'),
    occurredAt: _date(m, 'occurred_at'),
  );
}

class WaterEntry {
  const WaterEntry({
    required this.id,
    required this.ml,
    required this.occurredAt,
  });
  final String id;
  final int ml;
  final DateTime occurredAt;
  factory WaterEntry.fromRow(Map<String, dynamic> m) => WaterEntry(
    id: _s(m, 'id'),
    ml: _i(m, 'volume_ml'),
    occurredAt: _date(m, 'occurred_at'),
  );
}

class Program {
  const Program({
    required this.id,
    required this.name,
    required this.goal,
    required this.weeks,
  });
  final String id, name, goal;
  final int weeks;
  factory Program.fromRow(Map<String, dynamic> m) => Program(
    id: _s(m, 'id'),
    name: _s(m, 'name'),
    goal: _s(m, 'goal'),
    weeks: _i(m, 'weeks'),
  );
}

class Recipe {
  const Recipe({
    required this.id,
    required this.name,
    required this.instructions,
    required this.servings,
  });
  final String id, name, instructions;
  final int servings;
  factory Recipe.fromRow(Map<String, dynamic> m) => Recipe(
    id: _s(m, 'id'),
    name: _s(m, 'name'),
    instructions: _s(m, 'instructions'),
    servings: _i(m, 'servings'),
  );
}

class RecipeIngredient {
  const RecipeIngredient({
    required this.id,
    required this.recipeId,
    required this.foodName,
    required this.grams,
    required this.kcal,
    required this.protein,
    required this.carbs,
    required this.fat,
  });
  final String id, recipeId, foodName;
  final double grams;
  final double? kcal, protein, carbs, fat;
  factory RecipeIngredient.fromRow(Map<String, dynamic> m) => RecipeIngredient(
    id: _s(m, 'id'),
    recipeId: _s(m, 'recipe_id'),
    foodName: _s(m, 'name_snapshot'),
    grams: _d(m, 'grams') ?? 0,
    kcal: _d(m, 'kcal'),
    protein: _d(m, 'protein'),
    carbs: _d(m, 'carbs'),
    fat: _d(m, 'fat'),
  );
}

class SavedMeal {
  const SavedMeal({
    required this.id,
    required this.name,
    required this.createdAt,
  });
  final String id, name;
  final DateTime createdAt;
  factory SavedMeal.fromRow(Map<String, dynamic> m) => SavedMeal(
    id: _s(m, 'id'),
    name: _s(m, 'name'),
    createdAt: _date(m, 'created_at'),
  );
}

class SavedMealItem {
  const SavedMealItem({
    required this.id,
    required this.name,
    required this.grams,
    required this.kcal,
    required this.protein,
    required this.carbs,
    required this.fat,
  });
  final String id, name;
  final double grams;
  final double? kcal, protein, carbs, fat;
  factory SavedMealItem.fromRow(Map<String, dynamic> m) => SavedMealItem(
    id: _s(m, 'id'),
    name: _s(m, 'name_snapshot'),
    grams: _d(m, 'grams') ?? 0,
    kcal: _d(m, 'kcal'),
    protein: _d(m, 'protein'),
    carbs: _d(m, 'carbs'),
    fat: _d(m, 'fat'),
  );
}

class NutritionGoals {
  const NutritionGoals({this.kcal, this.protein, this.carbs, this.fat});
  final double? kcal, protein, carbs, fat;
  factory NutritionGoals.fromRow(Map<String, dynamic> m) => NutritionGoals(
    kcal: _d(m, 'kcal'),
    protein: _d(m, 'protein'),
    carbs: _d(m, 'carbs'),
    fat: _d(m, 'fat'),
  );
}
