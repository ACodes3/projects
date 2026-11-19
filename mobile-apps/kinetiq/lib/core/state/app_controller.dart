import 'package:flutter/foundation.dart';

import '../domain/models.dart';
import '../repository/kinetiq_repository.dart';

/// One application coordinator for persisted data, with no widget-specific logic.
class AppController extends ChangeNotifier {
  AppController(this.repository);
  final KinetiqRepository repository;

  bool ready = false;
  bool working = false;
  String? loadError;
  bool onboarded = false;
  bool onboardingInProgress = false;
  bool imperial = false;
  String experience = 'Beginner';
  String nutritionMode = 'Meals + macros';
  String goal = 'Build strength';
  String equipment = 'Full gym';
  int daysPerWeek = 3;
  int minutesPerWorkout = 45;
  List<Exercise> exercises = [];
  List<Routine> routines = [];
  List<WorkoutSession> sessions = [];
  List<Food> foods = [];
  List<MealEntry> meals = [];
  List<WaterEntry> water = [];
  List<CardioEntry> cardio = [];
  List<Program> programs = [];
  List<Recipe> recipes = [];
  WorkoutSession? active;

  Future<void> initialize() async {
    try {
      await repository.seedExercisesIfEmpty();
      await reload();
    } catch (e) {
      loadError = e.toString();
      ready = true;
      notifyListeners();
    }
  }

  Future<void> reload() async {
    final repo = repository;
    // Load before changing visible fields so a failing read doesn't present
    // an untruthful partial success state.
    final prefs = await Future.wait([
      repo.preference('onboarded'),
      repo.preference('units'),
      repo.preference('experience'),
      repo.preference('nutrition_mode'),
      repo.preference('goal'),
      repo.preference('equipment'),
      repo.preference('days_per_week'),
      repo.preference('workout_minutes'),
      repo.preference('onboarding_draft'),
    ]);
    final newExercises = await repo.exercises();
    final newRoutines = await repo.routines();
    final newSessions = await repo.sessions();
    final newFoods = await repo.foods();
    final newMeals = await repo.meals();
    final newWater = await repo.hydration();
    final newCardio = await repo.cardio();
    final newPrograms = await repo.programs();
    final newRecipes = await repo.recipes();
    final newActive = await repo.activeSession();
    onboarded = prefs[0] == 'true';
    onboardingInProgress = (prefs[8] ?? '').isNotEmpty;
    imperial = prefs[1] == 'imperial';
    experience = prefs[2] ?? 'Beginner';
    nutritionMode = prefs[3] ?? 'Meals + macros';
    goal = prefs[4] ?? 'Build strength';
    equipment = prefs[5] ?? 'Full gym';
    daysPerWeek = int.tryParse(prefs[6] ?? '') ?? 3;
    minutesPerWorkout = int.tryParse(prefs[7] ?? '') ?? 45;
    exercises = newExercises;
    routines = newRoutines;
    sessions = newSessions;
    foods = newFoods;
    meals = newMeals;
    water = newWater;
    cardio = newCardio;
    programs = newPrograms;
    recipes = newRecipes;
    active = newActive;
    loadError = null;
    ready = true;
    notifyListeners();
  }

  Future<T> mutate<T>(
    Future<T> Function(KinetiqRepository repository) callback,
  ) async {
    if (working) throw StateError('Please finish the current action.');
    working = true;
    notifyListeners();
    try {
      final result = await callback(repository);
      await reload();
      return result;
    } finally {
      working = false;
      notifyListeners();
    }
  }

  Future<void> saveProfile({
    required String experience,
    required String goal,
    required String equipment,
    required int days,
    required int minutes,
    required bool imperial,
    required String nutritionMode,
  }) async {
    await mutate((r) async {
      await r.db.transaction(() async {
        await r.setPreference('experience', experience);
        await r.setPreference('goal', goal);
        await r.setPreference('equipment', equipment);
        await r.setPreference('days_per_week', '$days');
        await r.setPreference('workout_minutes', '$minutes');
        await r.setPreference('units', imperial ? 'imperial' : 'metric');
        await r.setPreference('nutrition_mode', nutritionMode);
        await r.setPreference('onboarded', 'true');
        await r.setPreference('onboarding_draft', '');
      });
    });
  }
}
