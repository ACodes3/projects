import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/domain/enums/exercise_tracking_mode.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_exercise_settings_dialog.dart';

void main() {
  // ----------------------------------------------------------
  // TEST HELPERS
  // ----------------------------------------------------------

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
                        exerciseName: 'Test Exercise',
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

  Future<void> openDialog(WidgetTester tester) async {
    await tester.tap(find.text('OPEN SETTINGS'));
    await tester.pumpAndSettle();
  }

  // ----------------------------------------------------------
  // FIND INPUT BY LABEL
  // ----------------------------------------------------------

  Finder fieldWithLabel(String label) {
    return find.byWidgetPredicate((widget) {
      return widget is TextField && widget.decoration?.labelText == label;
    });
  }

  // ----------------------------------------------------------
  // ENTER FIELD VALUE
  // ----------------------------------------------------------

  Future<void> enterFieldValue(
    WidgetTester tester,
    String label,
    String value,
  ) async {
    final field = fieldWithLabel(label);

    expect(
      field,
      findsOneWidget,
      reason: 'Expected to find input field: $label',
    );

    await tester.ensureVisible(field);
    await tester.pumpAndSettle();

    await tester.enterText(field, value);
    await tester.pump();
  }

  // ----------------------------------------------------------
  // TAP SAVE
  // ----------------------------------------------------------

  Future<void> tapSave(WidgetTester tester) async {
    final saveButton = find.text('ADD TO WORKOUT');

    expect(saveButton, findsOneWidget);

    tester.testTextInput.hide();
    await tester.pump();

    await tester.ensureVisible(saveButton);
    await tester.pumpAndSettle();

    await tester.tap(saveButton);
    await tester.pumpAndSettle();
  }

  // ----------------------------------------------------------
  // TEST 1 — OPEN ADD DIALOG
  // ----------------------------------------------------------

  testWidgets('Opens exercise settings in add mode', (tester) async {
    await tester.pumpWidget(createTestApp(onResult: (_) {}));

    await openDialog(tester);

    expect(find.text('Configure Exercise'), findsOneWidget);
    expect(find.text('Test Exercise'), findsOneWidget);
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

    await openDialog(tester);

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

    await openDialog(tester);
    await tapSave(tester);

    expect(savedSettings, isNotNull);

    expect(savedSettings!.sets, 3);
    expect(savedSettings!.restBetweenSetsSeconds, 60);
    expect(savedSettings!.restAfterExerciseSeconds, 90);

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

    await openDialog(tester);

    expect(find.text('Edit Exercise Settings'), findsOneWidget);
    expect(find.text('SAVE CHANGES'), findsOneWidget);
    expect(find.text('ADD TO WORKOUT'), findsNothing);

    final setsField = tester.widget<TextField>(fieldWithLabel('Sets *'));

    expect(setsField.controller!.text, '5');

    final repsField = tester.widget<TextField>(
      fieldWithLabel('Target reps (optional)'),
    );

    expect(repsField.controller!.text, '8');

    final weightField = tester.widget<TextField>(
      fieldWithLabel('Target weight (optional)'),
    );

    expect(weightField.controller!.text, '80.0');
  });

  // ----------------------------------------------------------
  // TEST 5 — REJECT ZERO SETS
  // ----------------------------------------------------------

  testWidgets('Rejects zero sets and keeps the dialog open', (tester) async {
    WorkoutExerciseSettingsData? savedSettings;

    await tester.pumpWidget(
      createTestApp(
        onResult: (result) {
          savedSettings = result;
        },
      ),
    );

    await openDialog(tester);

    await enterFieldValue(tester, 'Sets *', '0');
    await tapSave(tester);

    expect(find.text('Enter a number greater than 0.'), findsOneWidget);

    expect(find.text('Configure Exercise'), findsOneWidget);
    expect(savedSettings, isNull);
  });

  // ----------------------------------------------------------
  // TEST 6 — REJECT EMPTY REQUIRED SETS
  // ----------------------------------------------------------

  testWidgets('Rejects empty required sets', (tester) async {
    await tester.pumpWidget(createTestApp(onResult: (_) {}));

    await openDialog(tester);

    await enterFieldValue(tester, 'Sets *', '');
    await tapSave(tester);

    expect(find.text('Required field.'), findsOneWidget);
    expect(find.text('Configure Exercise'), findsOneWidget);
  });

  // ----------------------------------------------------------
  // TEST 7 — REJECT NEGATIVE REST
  // ----------------------------------------------------------

  testWidgets('Rejects negative rest between sets', (tester) async {
    await tester.pumpWidget(createTestApp(onResult: (_) {}));

    await openDialog(tester);

    await enterFieldValue(tester, 'Rest between sets *', '-10');

    await tapSave(tester);

    expect(find.text('Enter 0 or greater.'), findsOneWidget);
    expect(find.text('Configure Exercise'), findsOneWidget);
  });

  // ----------------------------------------------------------
  // TEST 8 — REJECT INVALID OPTIONAL REPS
  // ----------------------------------------------------------

  testWidgets('Rejects negative target reps when provided', (tester) async {
    await tester.pumpWidget(createTestApp(onResult: (_) {}));

    await openDialog(tester);

    await enterFieldValue(tester, 'Target reps (optional)', '-5');

    await tapSave(tester);

    expect(find.text('Enter a number greater than 0.'), findsOneWidget);

    expect(find.text('Configure Exercise'), findsOneWidget);
  });

  // ----------------------------------------------------------
  // TEST 9 — REJECT INVALID DECIMAL WEIGHT
  // ----------------------------------------------------------

  testWidgets('Rejects invalid target weight', (tester) async {
    await tester.pumpWidget(createTestApp(onResult: (_) {}));

    await openDialog(tester);

    await enterFieldValue(tester, 'Target weight (optional)', '-20');

    await tapSave(tester);

    expect(find.text('Enter a valid number (0 or greater).'), findsOneWidget);

    expect(find.text('Configure Exercise'), findsOneWidget);
  });

  // ----------------------------------------------------------
  // TEST 10 — ACCEPT VALID CUSTOM SETTINGS
  // ----------------------------------------------------------

  testWidgets('Accepts valid targets and zero-second rest', (tester) async {
    WorkoutExerciseSettingsData? savedSettings;

    await tester.pumpWidget(
      createTestApp(
        onResult: (result) {
          savedSettings = result;
        },
      ),
    );

    await openDialog(tester);

    await enterFieldValue(tester, 'Sets *', '4');
    await enterFieldValue(tester, 'Target reps (optional)', '12');

    await enterFieldValue(tester, 'Target weight (optional)', '42.5');

    await enterFieldValue(tester, 'Rest between sets *', '0');

    await enterFieldValue(tester, 'Rest after exercise *', '30');

    await enterFieldValue(tester, 'Notes (optional)', 'Controlled tempo');

    await tapSave(tester);

    expect(savedSettings, isNotNull);

    expect(savedSettings!.sets, 4);
    expect(savedSettings!.targetReps, 12);
    expect(savedSettings!.targetWeight, 42.5);
    expect(savedSettings!.restBetweenSetsSeconds, 0);
    expect(savedSettings!.restAfterExerciseSeconds, 30);
    expect(savedSettings!.notes, 'Controlled tempo');

    expect(find.text('Configure Exercise'), findsNothing);
  });

  // ----------------------------------------------------------
  // TEST 11 — CARDIO DURATION TRACKING
  // ----------------------------------------------------------

  testWidgets('Duration mode saves seconds without strength targets', (
    tester,
  ) async {
    WorkoutExerciseSettingsData? savedSettings;

    await tester.pumpWidget(
      createTestApp(
        trackingMode: ExerciseTrackingMode.duration,
        onResult: (result) {
          savedSettings = result;
        },
      ),
    );

    await openDialog(tester);

    // Duration exercises must expose a duration target.
    expect(fieldWithLabel('Target duration (optional)'), findsOneWidget);

    // Strength and distance targets are not shown.
    expect(fieldWithLabel('Target reps (optional)'), findsNothing);
    expect(fieldWithLabel('Target weight (optional)'), findsNothing);
    expect(fieldWithLabel('Target distance (optional)'), findsNothing);

    await enterFieldValue(tester, 'Target duration (optional)', '900');

    await tapSave(tester);

    expect(savedSettings, isNotNull);
    expect(savedSettings!.sets, 3);
    expect(savedSettings!.targetDurationSeconds, 900);

    expect(savedSettings!.targetReps, isNull);
    expect(savedSettings!.targetWeight, isNull);
    expect(savedSettings!.targetDistanceKm, isNull);
  });

  // ----------------------------------------------------------
  // TEST 12 — CARDIO DISTANCE TRACKING
  // ----------------------------------------------------------

  testWidgets('Distance mode saves kilometers without strength targets', (
    tester,
  ) async {
    WorkoutExerciseSettingsData? savedSettings;

    await tester.pumpWidget(
      createTestApp(
        trackingMode: ExerciseTrackingMode.distance,
        onResult: (result) {
          savedSettings = result;
        },
      ),
    );

    await openDialog(tester);

    // Distance exercises must expose a distance target.
    expect(fieldWithLabel('Target distance (optional)'), findsOneWidget);

    // Unrelated tracking inputs are hidden.
    expect(fieldWithLabel('Target reps (optional)'), findsNothing);
    expect(fieldWithLabel('Target weight (optional)'), findsNothing);
    expect(fieldWithLabel('Target duration (optional)'), findsNothing);

    await enterFieldValue(tester, 'Target distance (optional)', '5.5');

    await tapSave(tester);

    expect(savedSettings, isNotNull);
    expect(savedSettings!.sets, 3);
    expect(savedSettings!.targetDistanceKm, 5.5);

    expect(savedSettings!.targetReps, isNull);
    expect(savedSettings!.targetWeight, isNull);
    expect(savedSettings!.targetDurationSeconds, isNull);
  });
}
