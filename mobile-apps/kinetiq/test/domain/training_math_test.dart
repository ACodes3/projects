import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/core/domain/metrics.dart';
import 'package:kinetiq/core/domain/models.dart';

LoggedSet set(
  String id, {
  double? kg = 50,
  int? reps = 10,
  int? seconds,
  double? meters,
  bool done = true,
}) => LoggedSet(
  id: id,
  sessionExerciseId: 'exercise',
  position: 0,
  weightKg: kg,
  reps: reps,
  seconds: seconds,
  meters: meters,
  completed: done,
);
WorkoutSession session(DateTime started, String status) => WorkoutSession(
  id: started.toIso8601String(),
  name: 'Test',
  status: status,
  startedAt: started,
  finishedAt: null,
  notes: '',
);

void main() {
  group('valid completed actuals by tracking mode', () {
    final cases =
        <
          ({
            String mode,
            double? kg,
            int? reps,
            int? seconds,
            double? meters,
            bool valid,
          })
        >[
          (
            mode: 'weight_reps',
            kg: 50,
            reps: 10,
            seconds: null,
            meters: null,
            valid: true,
          ),
          (
            mode: 'weight_reps',
            kg: 0,
            reps: 10,
            seconds: null,
            meters: null,
            valid: true,
          ),
          (
            mode: 'weight_reps',
            kg: null,
            reps: 10,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'weight_reps',
            kg: 50,
            reps: null,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'weight_reps',
            kg: 50,
            reps: 0,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'weight_reps',
            kg: -1,
            reps: 10,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'weight_reps',
            kg: 50,
            reps: -1,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'reps',
            kg: null,
            reps: 10,
            seconds: null,
            meters: null,
            valid: true,
          ),
          (
            mode: 'reps',
            kg: null,
            reps: 1,
            seconds: null,
            meters: null,
            valid: true,
          ),
          (
            mode: 'reps',
            kg: null,
            reps: 0,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'reps',
            kg: null,
            reps: null,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'duration',
            kg: null,
            reps: null,
            seconds: 15,
            meters: null,
            valid: true,
          ),
          (
            mode: 'duration',
            kg: null,
            reps: null,
            seconds: 1,
            meters: null,
            valid: true,
          ),
          (
            mode: 'duration',
            kg: null,
            reps: null,
            seconds: 0,
            meters: null,
            valid: false,
          ),
          (
            mode: 'duration',
            kg: null,
            reps: null,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'distance',
            kg: null,
            reps: null,
            seconds: null,
            meters: 100,
            valid: true,
          ),
          (
            mode: 'distance',
            kg: null,
            reps: null,
            seconds: null,
            meters: 0.2,
            valid: true,
          ),
          (
            mode: 'distance',
            kg: null,
            reps: null,
            seconds: null,
            meters: 0,
            valid: false,
          ),
          (
            mode: 'distance',
            kg: null,
            reps: null,
            seconds: null,
            meters: null,
            valid: false,
          ),
          (
            mode: 'other',
            kg: 50,
            reps: 10,
            seconds: 20,
            meters: 100,
            valid: false,
          ),
        ];
    for (var i = 0; i < cases.length; i++) {
      test('set validity fixture ${i + 1}', () {
        final c = cases[i];
        expect(
          isValidCompletedSet(
            mode: c.mode,
            weightKg: c.kg,
            reps: c.reps,
            seconds: c.seconds,
            meters: c.meters,
          ),
          c.valid,
        );
      });
    }
  });
  group('volume and personal records', () {
    final cases =
        <({List<LoggedSet> sets, double volume, int count, double? best})>[
          (sets: [], volume: 0, count: 0, best: null),
          (sets: [set('a')], volume: 500, count: 1, best: 50),
          (sets: [set('a', done: false)], volume: 0, count: 0, best: null),
          (sets: [set('a', kg: null)], volume: 0, count: 1, best: null),
          (sets: [set('a', reps: null)], volume: 0, count: 1, best: null),
          (sets: [set('a', kg: 0)], volume: 0, count: 1, best: 0),
          (
            sets: [set('a', kg: 20, reps: 5), set('b', kg: 30, reps: 5)],
            volume: 250,
            count: 2,
            best: 30,
          ),
          (
            sets: [
              set('a', kg: 40, reps: 5),
              set('b', kg: 70, reps: 1, done: false),
            ],
            volume: 200,
            count: 1,
            best: 40,
          ),
          (
            sets: [set('a', kg: 30, reps: 10), set('b', kg: 20, reps: 20)],
            volume: 700,
            count: 2,
            best: 30,
          ),
          (sets: [set('a', kg: -5, reps: 10)], volume: 0, count: 1, best: null),
          (sets: [set('a', kg: 50, reps: 0)], volume: 0, count: 1, best: null),
          (
            sets: [set('a', kg: 40, reps: 10), set('b', kg: 40, reps: 10)],
            volume: 800,
            count: 2,
            best: 40,
          ),
        ];
    for (var i = 0; i < cases.length; i++) {
      test('training stats fixture ${i + 1}', () {
        final c = cases[i];
        expect(completedVolume(c.sets), closeTo(c.volume, .000001));
        expect(completedSets(c.sets), c.count);
        final best = maxCompletedWeight(c.sets);
        if (c.best == null) {
          expect(best, isNull);
        } else {
          expect(best, c.best);
        }
      });
    }
  });
  group('calendar week boundaries', () {
    final now = DateTime(2026, 11, 19, 12);
    final days = List<DateTime>.generate(
      22,
      (i) => DateTime(2026, 11, 9 + i, 12),
    );
    for (var i = 0; i < days.length; i++) {
      final dt = days[i];
      test('local week membership ${i + 1}: $dt', () {
        final expected =
            dt.isAfter(DateTime(2026, 11, 15, 23, 59)) &&
            dt.isBefore(DateTime(2026, 11, 23));
        expect(
          workoutsThisWeek([session(dt, 'completed')], now),
          expected ? 1 : 0,
        );
        expect(workoutsThisWeek([session(dt, 'in_progress')], now), 0);
        expect(workoutsThisWeek([session(dt, 'discarded')], now), 0);
      });
    }
  });
  group('cardio pace missing-safe', () {
    final cases = <({int seconds, double? meters, double? expected})>[
      (seconds: 300, meters: 1000, expected: 300),
      (seconds: 1200, meters: 2000, expected: 600),
      (seconds: 3600, meters: 10000, expected: 360),
      (seconds: 60, meters: 500, expected: 120),
      (seconds: 0, meters: 1000, expected: null),
      (seconds: -1, meters: 1000, expected: null),
      (seconds: 600, meters: null, expected: null),
      (seconds: 600, meters: 0, expected: null),
      (seconds: 600, meters: -1, expected: null),
      (seconds: 400, meters: 100, expected: 4000),
    ];
    for (var i = 0; i < cases.length; i++) {
      test('pace fixture ${i + 1}', () {
        final c = cases[i];
        final actual = cardioPaceSecondsPerKm(
          seconds: c.seconds,
          meters: c.meters,
        );
        if (c.expected == null) {
          expect(actual, isNull);
        } else {
          expect(actual, closeTo(c.expected!, 0.001));
        }
      });
    }
  });
}
