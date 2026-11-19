import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/core/domain/metrics.dart';
import 'package:kinetiq/core/domain/models.dart';

void main() {
  group('nutrition math', () {
    test('scaled values use grams divided by 100', () {
      expect(scaledNutrient(20, 250), closeTo(50, 0.001));
      expect(scaledNutrient(0, 200), 0);
    });
    test('missing nutrient is unknown, never zero', () {
      expect(scaledNutrient(null, 100), isNull);
      expect(sumKnown([2.0, null, 3.0]), isNull);
      expect(sumKnown([]), isNull);
      expect(sumKnown([2.0, 3.0, 4.0]), 9.0);
    });
    test('empty diary stays unknown', () {
      final totals = MacroTotals.fromMeals(const <MealEntry>[]);
      expect(totals.kcal, isNull);
      expect(totals.protein, isNull);
    });
  });
  group('training metrics', () {
    test('counts completed sets only for volume', () {
      const logged = [
        LoggedSet(
          id: '1',
          sessionExerciseId: 'a',
          position: 0,
          weightKg: 60,
          reps: 10,
          seconds: null,
          meters: null,
          completed: true,
        ),
        LoggedSet(
          id: '2',
          sessionExerciseId: 'a',
          position: 1,
          weightKg: 80,
          reps: 5,
          seconds: null,
          meters: null,
          completed: false,
        ),
        LoggedSet(
          id: '3',
          sessionExerciseId: 'a',
          position: 2,
          weightKg: null,
          reps: 8,
          seconds: null,
          meters: null,
          completed: true,
        ),
      ];
      expect(completedSets(logged), 2);
      expect(completedVolume(logged), 600.0);
    });
    test('week count excludes drafts and past weeks', () {
      final now = DateTime(2026, 11, 19, 12);
      final sessions = [
        WorkoutSession(
          id: '1',
          name: 'A',
          status: 'completed',
          startedAt: DateTime(2026, 11, 17, 9),
          finishedAt: now,
          notes: '',
        ),
        WorkoutSession(
          id: '2',
          name: 'B',
          status: 'in_progress',
          startedAt: DateTime(2026, 11, 18, 9),
          finishedAt: null,
          notes: '',
        ),
        WorkoutSession(
          id: '3',
          name: 'C',
          status: 'completed',
          startedAt: DateTime(2026, 11, 9, 9),
          finishedAt: now,
          notes: '',
        ),
      ];
      expect(workoutsThisWeek(sessions, now), 1);
    });
  });
}
