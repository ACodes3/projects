import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/core/domain/metrics.dart';
import 'package:kinetiq/core/domain/models.dart';

MealEntry meal(
  String id, {
  double? kcal = 100,
  double? protein = 5,
  double? carbs = 15,
  double? fat = 2,
}) => MealEntry(
  id: id,
  name: 'Sample',
  meal: 'Lunch',
  grams: 100,
  kcal: kcal,
  protein: protein,
  carbs: carbs,
  fat: fat,
  occurredAt: DateTime(2026, 11, 19),
);

void main() {
  group('source-aware grams to nutrient conversion', () {
    final cases = <({double? nutrient, double grams, double? expected})>[
      (nutrient: 100, grams: 100, expected: 100),
      (nutrient: 100, grams: 250, expected: 250),
      (nutrient: 250, grams: 20, expected: 50),
      (nutrient: 40, grams: 50, expected: 20),
      (nutrient: 10, grams: 125, expected: 12.5),
      (nutrient: 0, grams: 1000, expected: 0),
      (nutrient: null, grams: 100, expected: null),
      (nutrient: null, grams: 0, expected: null),
      (nutrient: 2.5, grams: 90, expected: 2.25),
      (nutrient: 4.2, grams: 200, expected: 8.4),
      (nutrient: 1, grams: 1, expected: 0.01),
      (nutrient: 99.9, grams: 10, expected: 9.99),
      (nutrient: 300, grams: 333, expected: 999),
      (nutrient: 25, grams: 8, expected: 2),
      (nutrient: 12, grams: 75, expected: 9),
      (nutrient: 15, grams: 500, expected: 75),
    ];
    for (var i = 0; i < cases.length; i++) {
      test('grams conversion fixture ${i + 1}', () {
        final c = cases[i];
        final actual = scaledNutrient(c.nutrient, c.grams);
        if (c.expected == null) {
          expect(actual, isNull);
        } else {
          expect(actual, closeTo(c.expected!, 0.0001));
        }
      });
    }
  });
  group('nutrition completeness', () {
    final cases = <({List<double?> input, double? expected})>[
      (input: [], expected: null),
      (input: [null], expected: null),
      (input: [0], expected: 0),
      (input: [0, 0], expected: 0),
      (input: [1], expected: 1),
      (input: [1, 2], expected: 3),
      (input: [1, null], expected: null),
      (input: [null, 1], expected: null),
      (input: [1, 2, null], expected: null),
      (input: [0, null], expected: null),
      (input: [1.5, 2.25], expected: 3.75),
      (input: [10, 20, 30, 40], expected: 100),
      (input: [2, 2, 2, 2, 2], expected: 10),
      (input: [0.1, 0.2], expected: 0.3),
      (input: [100, 0, 5], expected: 105),
      (input: [4, null, 2], expected: null),
      (input: [3, 0, 2], expected: 5),
      (input: [999], expected: 999),
    ];
    for (var i = 0; i < cases.length; i++) {
      test('nullable total fixture ${i + 1}', () {
        final c = cases[i];
        final got = sumKnown(c.input);
        if (c.expected == null) {
          expect(got, isNull);
        } else {
          expect(got, closeTo(c.expected!, 0.000001));
        }
      });
    }
  });
  group('daily macro aggregation', () {
    test('empty diary remains unknown', () {
      final t = MacroTotals.fromMeals([]);
      expect(t.kcal, isNull);
      expect(t.protein, isNull);
      expect(t.carbs, isNull);
      expect(t.fat, isNull);
    });
    test('one completely logged meal', () {
      final t = MacroTotals.fromMeals([meal('a')]);
      expect(t.kcal, 100);
      expect(t.protein, 5);
      expect(t.carbs, 15);
      expect(t.fat, 2);
    });
    test('two verified meals sum', () {
      final t = MacroTotals.fromMeals([
        meal('a'),
        meal('b', kcal: 50, protein: 2, carbs: 5, fat: 1),
      ]);
      expect(t.kcal, 150);
      expect(t.protein, 7);
      expect(t.carbs, 20);
      expect(t.fat, 3);
    });
    test('unknown calories are unknown, other macros still sum', () {
      final t = MacroTotals.fromMeals([meal('a'), meal('b', kcal: null)]);
      expect(t.kcal, isNull);
      expect(t.protein, 10);
      expect(t.carbs, 30);
      expect(t.fat, 4);
    });
    test('unknown fat does not erase known calories', () {
      final t = MacroTotals.fromMeals([meal('a'), meal('b', fat: null)]);
      expect(t.kcal, 200);
      expect(t.fat, isNull);
    });
    test('zero is a recorded numeric value, not missing', () {
      final t = MacroTotals.fromMeals([
        meal('a', kcal: 0, protein: 0, carbs: 0, fat: 0),
      ]);
      expect(t.kcal, 0);
      expect(t.protein, 0);
      expect(t.carbs, 0);
      expect(t.fat, 0);
    });
  });
}
