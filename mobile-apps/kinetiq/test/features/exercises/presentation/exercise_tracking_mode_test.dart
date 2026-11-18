import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/domain/enums/exercise_tracking_mode.dart';
import 'package:kinetiq/features/exercises/presentation/widgets/exercise_tracking_mode_selector.dart';


void main() {
  late AppDatabase database;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());
  });

  tearDown(() async {
    await database.close();
  });

  // ----------------------------------------------------------
  // TEST 1 — Tracking mode values survive SQLite storage
  // ----------------------------------------------------------

  test('All tracking modes can be stored and retrieved', () async {
    for (final mode in ExerciseTrackingMode.values) {
      final id = await database
          .into(database.exercises)
          .insert(
            ExercisesCompanion.insert(
              name: 'Test ${mode.label}',
              trackingMode: Value(mode.databaseValue),
            ),
          );

      final saved = await (database.select(
        database.exercises,
      )..where((table) => table.id.equals(id))).getSingle();

      expect(saved.trackingMode, mode.databaseValue);

      expect(ExerciseTrackingMode.fromDatabase(saved.trackingMode), mode);
    }
  });

  // ----------------------------------------------------------
  // TEST 2 — Tracking Mode Selector updates its selection
  // ----------------------------------------------------------

  testWidgets('Tracking mode selector responds to user selection', (
    WidgetTester tester,
  ) async {
    ExerciseTrackingMode selectedMode = ExerciseTrackingMode.reps;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StatefulBuilder(
            builder: (context, setState) {
              return SingleChildScrollView(
                child: ExerciseTrackingModeSelector(
                  selectedMode: selectedMode,
                  onChanged: (mode) {
                    setState(() {
                      selectedMode = mode;
                    });
                  },
                ),
              );
            },
          ),
        ),
      ),
    );

    expect(selectedMode, ExerciseTrackingMode.reps);

    await tester.tap(find.text('Weight + Reps'));
    await tester.pumpAndSettle();

    expect(selectedMode, ExerciseTrackingMode.weightReps);

    await tester.tap(find.text('Duration'));
    await tester.pumpAndSettle();

    expect(selectedMode, ExerciseTrackingMode.duration);

    await tester.tap(find.text('Distance'));
    await tester.pumpAndSettle();

    expect(selectedMode, ExerciseTrackingMode.distance);
  });
}
