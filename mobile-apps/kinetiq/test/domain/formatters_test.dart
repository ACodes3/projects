import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/core/utils/formatters.dart';

void main() {
  group('unit conversion is canonical and reversible', () {
    const masses = [
      0.0,
      0.01,
      0.5,
      1.0,
      2.5,
      10.0,
      20.0,
      60.0,
      70.5,
      80.0,
      100.0,
      250.0,
      500.0,
      1000.0,
    ];
    for (var i = 0; i < masses.length; i++) {
      test('kg/lb conversion fixture ${i + 1}', () {
        final kg = masses[i];
        expect(
          canonicalWeight(displayWeight(kg, true), true),
          closeTo(kg, 0.0000001),
        );
        expect(displayWeight(kg, false), kg);
        expect(canonicalWeight(kg, false), kg);
      });
    }
  });
  group('date and time formatting', () {
    final dates = <({DateTime date, String expected})>[
      (date: DateTime(2026, 1, 1), expected: '01.01.2026'),
      (date: DateTime(2026, 11, 19), expected: '19.11.2026'),
      (date: DateTime(2024, 2, 29), expected: '29.02.2024'),
      (date: DateTime(2030, 12, 31), expected: '31.12.2030'),
      (date: DateTime(2000, 6, 9), expected: '09.06.2000'),
    ];
    for (var i = 0; i < dates.length; i++) {
      test('local day label fixture ${i + 1}', () {
        expect(dayLabel(dates[i].date), dates[i].expected);
      });
    }
    final durations = <({Duration value, String expected})>[
      (value: Duration.zero, expected: '00:00'),
      (value: Duration(seconds: 1), expected: '00:01'),
      (value: Duration(seconds: 59), expected: '00:59'),
      (value: Duration(seconds: 60), expected: '01:00'),
      (value: Duration(seconds: 125), expected: '02:05'),
      (value: Duration(minutes: 59, seconds: 59), expected: '59:59'),
      (value: Duration(hours: 1), expected: '01:00:00'),
      (value: Duration(hours: 2, minutes: 3, seconds: 4), expected: '02:03:04'),
      (value: Duration(seconds: -2), expected: '00:00'),
      (value: Duration(hours: 25), expected: '25:00:00'),
    ];
    for (var i = 0; i < durations.length; i++) {
      test('elapsed label fixture ${i + 1}', () {
        expect(durationLabel(durations[i].value), durations[i].expected);
      });
    }
  });
  group('units and missing labels', () {
    test('metric unit', () {
      expect(weightUnit(false), 'kg');
    });
    test('imperial unit', () {
      expect(weightUnit(true), 'lb');
    });
    test('metric distance', () {
      expect(displayDistance(1000, false), '1.00 km');
    });
    test('imperial distance', () {
      expect(displayDistance(1609.344, true), '1.00 mi');
    });
    test('missing number', () {
      expect(numberLabel(null), '—');
    });
    test('rounded grams', () {
      expect(numberLabel(12.345, 1), '12.3');
    });
  });
}
