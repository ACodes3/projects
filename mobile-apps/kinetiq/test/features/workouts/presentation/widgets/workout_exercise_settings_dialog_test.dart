import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/domain/enums/exercise_tracking_mode.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_exercise_settings_dialog.dart';

void main() {
  // ----------------------------------------------------------
  // TEST HELPER
  // ----------------------------------------------------------

  /// Opens the exercise settings dialog in a real MaterialApp.
  ///
  /// The result is passed to onResult when the dialog closes.
  Widget createTestApp({
    ExerciseTrackingMode trackingMode = ExerciseTrackingMode.weightReps,
    WorkoutTemplateExercise? existingExercise,
    required ValueChanged<WorkoutExerciseSettingsData?> onResult,
  }) {
    return MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) {
            return Center(
              child: ElevatedButton(
                onPressed: () async {
                  final result = await showDialog<WorkoutExerciseSettingsData>(
                    context: context,
                    builder: (dialogContext) {
                      return WorkoutExerciseSettingsDialog(
                        exerciseName: 'Bench Press',
                        trackingMode: trackingMode,
                        existingExercise: existingExercise,
                      );
                    },
                  );

                  onResult(result);
                },
                child: const Text('OPEN SETTINGS'),
              ),
            );
          },
        ),
      ),
    );
  }

  // ----------------------------------------------------------
  // TEST 1 — OPEN ADD DIALOG
  // ----------------------------------------------------------

  testWidgets('Opens exercise settings in add mode', (tester) async {
    await tester.pumpWidget(createTestApp(onResult: (_) {}));

    await tester.tap(find.text('OPEN SETTINGS'));
    await tester.pumpAndSettle();

    expect(find.text('Configure Exercise'), findsOneWidget);

    expect(find.text('ADD TO WORKOUT'), findsOneWidget);

    expect(find.text('CANCEL'), findsOneWidget);
  });

  // ----------------------------------------------------------
  // TEST 2 — CANCEL DIALOG
  // ----------------------------------------------------------

  testWidgets('Cancel closes the dialog without returning settings', (
    tester,
  ) async {
    WorkoutExerciseSettingsData? savedSettings;
    var callbackCalled = false;

    await tester.pumpWidget(
      createTestApp(
        onResult: (result) {
          callbackCalled = true;
          savedSettings = result;
        },
      ),
    );

    await tester.tap(find.text('OPEN SETTINGS'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('CANCEL'));
    await tester.pumpAndSettle();

    expect(find.text('Configure Exercise'), findsNothing);

    expect(callbackCalled, isTrue);
    expect(savedSettings, isNull);
  });

  // ----------------------------------------------------------
  // TEST 3 — SAVE DEFAULT CONFIGURATION
  // ----------------------------------------------------------

  testWidgets('Saves default exercise settings', (tester) async {
    WorkoutExerciseSettingsData? savedSettings;

    await tester.pumpWidget(
      createTestApp(
        onResult: (result) {
          savedSettings = result;
        },
      ),
    );

    await tester.tap(find.text('OPEN SETTINGS'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('ADD TO WORKOUT'));
    await tester.pumpAndSettle();

    expect(savedSettings, isNotNull);

    // Default configuration.
    expect(savedSettings!.sets, 3);

    expect(savedSettings!.restBetweenSetsSeconds, 60);

    expect(savedSettings!.restAfterExerciseSeconds, 90);

    // Optional targets are not required.
    expect(savedSettings!.targetReps, isNull);
    expect(savedSettings!.targetWeight, isNull);
    expect(savedSettings!.targetDurationSeconds, isNull);
    expect(savedSettings!.targetDistanceKm, isNull);
    expect(savedSettings!.notes, isNull);
  });

  // ----------------------------------------------------------
  // TEST 4 — OPEN EDIT DIALOG
  // ----------------------------------------------------------

  testWidgets('Opens existing exercise configuration in edit mode', (
    tester,
  ) async {
    final existingExercise = WorkoutTemplateExercise(
      id: 10,
      templateId: 1,
      exerciseId: 20,
      position: 0,
      sets: 5,
      targetReps: 8,
      targetWeight: 80.0,
      restBetweenSetsSeconds: 120,
      restAfterExerciseSeconds: 180,
      notes: 'Controlled movement',
    );

    await tester.pumpWidget(
      createTestApp(existingExercise: existingExercise, onResult: (_) {}),
    );

    await tester.tap(find.text('OPEN SETTINGS'));
    await tester.pumpAndSettle();

    expect(find.text('Edit Exercise Settings'), findsOneWidget);

    expect(find.text('SAVE CHANGES'), findsOneWidget);

    expect(find.text('ADD TO WORKOUT'), findsNothing);
  });
}
