import 'models.dart';

/// Nullable nutrition values: missing composition is unknown, never zero.
double? scaledNutrient(double? per100g, double grams) =>
    per100g == null ? null : per100g * grams / 100;

double? sumKnown(Iterable<double?> values) {
  final all = values.toList();
  if (all.isEmpty || all.any((value) => value == null)) return null;
  return all.fold<double>(0, (sum, value) => sum + value!);
}

double completedVolume(Iterable<LoggedSet> sets) => sets
    .where(
      (s) =>
          s.completed &&
          s.weightKg != null &&
          s.reps != null &&
          s.weightKg! >= 0 &&
          s.reps! > 0,
    )
    .fold<double>(0, (sum, s) => sum + s.weightKg! * s.reps!);

int completedSets(Iterable<LoggedSet> sets) =>
    sets.where((set) => set.completed).length;

bool isSameLocalDay(DateTime a, DateTime b) {
  final x = a.toLocal(), y = b.toLocal();
  return x.year == y.year && x.month == y.month && x.day == y.day;
}

DateTime startOfLocalWeek(DateTime date) {
  final local = date.toLocal();
  final midnight = DateTime(local.year, local.month, local.day);
  return midnight.subtract(Duration(days: local.weekday - DateTime.monday));
}

int workoutsThisWeek(Iterable<WorkoutSession> sessions, DateTime now) {
  final start = startOfLocalWeek(now);
  final end = start.add(const Duration(days: 7));
  return sessions
      .where(
        (s) =>
            s.status == 'completed' &&
            !s.startedAt.toLocal().isBefore(start) &&
            s.startedAt.toLocal().isBefore(end),
      )
      .length;
}

class MacroTotals {
  const MacroTotals(this.kcal, this.protein, this.carbs, this.fat);
  final double? kcal, protein, carbs, fat;
  factory MacroTotals.fromMeals(Iterable<MealEntry> entries) {
    final meals = entries.toList();
    return MacroTotals(
      sumKnown(meals.map((e) => e.kcal)),
      sumKnown(meals.map((e) => e.protein)),
      sumKnown(meals.map((e) => e.carbs)),
      sumKnown(meals.map((e) => e.fat)),
    );
  }
}

/// Validate actual logged values by mode; never treat absent as zero.
bool isValidCompletedSet({
  required String mode,
  double? weightKg,
  int? reps,
  int? seconds,
  double? meters,
}) {
  switch (mode) {
    case 'weight_reps':
      return weightKg != null &&
          weightKg.isFinite &&
          weightKg >= 0 &&
          reps != null &&
          reps > 0;
    case 'reps':
      return reps != null && reps > 0;
    case 'duration':
      return seconds != null && seconds > 0;
    case 'distance':
      return meters != null && meters.isFinite && meters > 0;
    default:
      return false;
  }
}

/// Optional pace: seconds per kilometer; zero or unknown distance remains absent.
double? cardioPaceSecondsPerKm({required int seconds, double? meters}) {
  if (seconds <= 0 || meters == null || !meters.isFinite || meters <= 0) {
    return null;
  }
  return seconds / (meters / 1000);
}

/// Best comparable single-set load recorded in completed sessions.
double? maxCompletedWeight(Iterable<LoggedSet> sets) {
  final valid = sets
      .where(
        (set) =>
            set.completed &&
            set.reps != null &&
            set.reps! > 0 &&
            set.weightKg != null &&
            set.weightKg!.isFinite &&
            set.weightKg! >= 0,
      )
      .map((set) => set.weightKg!)
      .toList();
  if (valid.isEmpty) return null;
  return valid.reduce((a, b) => a > b ? a : b);
}
