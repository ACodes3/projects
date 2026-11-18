import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/domain/enums/exercise_tracking_mode.dart';

/// Validated exercise settings returned by the dialog.
///
/// The parent screen handles saving these values to SQLite.
class WorkoutExerciseSettingsData {
  const WorkoutExerciseSettingsData({
    required this.sets,
    required this.targetReps,
    required this.targetWeight,
    required this.targetDurationSeconds,
    required this.targetDistanceKm,
    required this.restBetweenSetsSeconds,
    required this.restAfterExerciseSeconds,
    required this.notes,
  });

  final int sets;
  final int? targetReps;
  final double? targetWeight;
  final int? targetDurationSeconds;
  final double? targetDistanceKm;
  final int restBetweenSetsSeconds;
  final int restAfterExerciseSeconds;
  final String? notes;
}

/// Reusable settings form for an exercise inside a workout.
///
/// Used when adding a new exercise or editing one already
/// assigned to a workout template.
class WorkoutExerciseSettingsDialog extends StatefulWidget {
  const WorkoutExerciseSettingsDialog({
    super.key,
    required this.exerciseName,
    required this.trackingMode,
    this.existingExercise,
  });

  final String exerciseName;
  final ExerciseTrackingMode trackingMode;
  final WorkoutTemplateExercise? existingExercise;

  @override
  State<WorkoutExerciseSettingsDialog> createState() =>
      _WorkoutExerciseSettingsDialogState();
}

class _WorkoutExerciseSettingsDialogState
    extends State<WorkoutExerciseSettingsDialog> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _setsController;
  late final TextEditingController _repsController;
  late final TextEditingController _weightController;
  late final TextEditingController _durationController;
  late final TextEditingController _distanceController;
  late final TextEditingController _restSetsController;
  late final TextEditingController _restExerciseController;
  late final TextEditingController _notesController;

  bool get _isEditing => widget.existingExercise != null;

  @override
  void initState() {
    super.initState();

    final existing = widget.existingExercise;

    _setsController = TextEditingController(text: '${existing?.sets ?? 3}');

    _repsController = TextEditingController(
      text: existing?.targetReps?.toString() ?? '',
    );

    _weightController = TextEditingController(
      text: existing?.targetWeight?.toString() ?? '',
    );

    _durationController = TextEditingController(
      text: existing?.targetDurationSeconds?.toString() ?? '',
    );

    _distanceController = TextEditingController(
      text: existing?.targetDistanceKm?.toString() ?? '',
    );

    _restSetsController = TextEditingController(
      text: '${existing?.restBetweenSetsSeconds ?? 60}',
    );

    _restExerciseController = TextEditingController(
      text: '${existing?.restAfterExerciseSeconds ?? 90}',
    );

    _notesController = TextEditingController(text: existing?.notes ?? '');
  }

  @override
  void dispose() {
    _setsController.dispose();
    _repsController.dispose();
    _weightController.dispose();
    _durationController.dispose();
    _distanceController.dispose();
    _restSetsController.dispose();
    _restExerciseController.dispose();
    _notesController.dispose();

    super.dispose();
  }

  // ----------------------------------------------------------
  // VALIDATION HELPERS
  // ----------------------------------------------------------

  String? _validatePositiveInteger(String? value, {bool required = false}) {
    final text = value?.trim() ?? '';

    if (text.isEmpty) {
      return required ? 'Required field.' : null;
    }

    final number = int.tryParse(text);

    if (number == null || number <= 0) {
      return 'Enter a number greater than 0.';
    }

    return null;
  }

  String? _validateNonNegativeInteger(String? value) {
    final text = value?.trim() ?? '';

    if (text.isEmpty) return 'Required field.';

    final number = int.tryParse(text);

    if (number == null || number < 0) {
      return 'Enter 0 or greater.';
    }

    return null;
  }

  String? _validateNonNegativeDecimal(String? value) {
    final text = value?.trim() ?? '';

    if (text.isEmpty) return null;

    final number = double.tryParse(text);

    if (number == null || !number.isFinite || number < 0) {
      return 'Enter a valid number (0 or greater).';
    }

    return null;
  }

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    int? optionalInt(TextEditingController controller) {
      final text = controller.text.trim();
      return text.isEmpty ? null : int.parse(text);
    }

    double? optionalDouble(TextEditingController controller) {
      final text = controller.text.trim();
      return text.isEmpty ? null : double.parse(text);
    }

    final notes = _notesController.text.trim();

    final data = WorkoutExerciseSettingsData(
      sets: int.parse(_setsController.text.trim()),
      targetReps: optionalInt(_repsController),
      targetWeight: optionalDouble(_weightController),
      targetDurationSeconds: optionalInt(_durationController),
      targetDistanceKm: optionalDouble(_distanceController),
      restBetweenSetsSeconds: int.parse(_restSetsController.text.trim()),
      restAfterExerciseSeconds: int.parse(_restExerciseController.text.trim()),
      notes: notes.isEmpty ? null : notes,
    );

    Navigator.of(context).pop(data);
  }

  // ----------------------------------------------------------
  // REUSABLE NUMBER FIELD
  // ----------------------------------------------------------

  Widget _numberField({
    required String label,
    required TextEditingController controller,
    required String? Function(String?) validator,
    bool decimal = false,
    String? suffix,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.numberWithOptions(decimal: decimal),
      style: const TextStyle(color: KinetiqColors.textPrimary),
      decoration: InputDecoration(
        labelText: label,
        suffixText: suffix,
        border: const OutlineInputBorder(),
      ),
      validator: validator,
    );
  }

  // ----------------------------------------------------------
  // BUILD
  // ----------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final mode = widget.trackingMode;

    return AlertDialog(
      backgroundColor: KinetiqColors.surface,
      title: Text(
        _isEditing ? 'Edit Exercise Settings' : 'Configure Exercise',
        style: const TextStyle(
          color: KinetiqColors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.exerciseName,
                  style: const TextStyle(
                    color: KinetiqColors.primary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),

                const SizedBox(height: 6),

                Text(
                  mode.label,
                  style: const TextStyle(
                    color: KinetiqColors.textSecondary,
                    fontSize: 13,
                  ),
                ),

                const SizedBox(height: 24),

                // ------------------------------------------
                // SETS
                // ------------------------------------------
                _numberField(
                  label: 'Sets *',
                  controller: _setsController,
                  validator: (value) =>
                      _validatePositiveInteger(value, required: true),
                ),

                const SizedBox(height: 16),

                // ------------------------------------------
                // MODE-SPECIFIC TARGETS
                // ------------------------------------------
                if (mode == ExerciseTrackingMode.weightReps) ...[
                  _numberField(
                    label: 'Target reps (optional)',
                    controller: _repsController,
                    validator: _validatePositiveInteger,
                  ),

                  const SizedBox(height: 16),

                  _numberField(
                    label: 'Target weight (optional)',
                    controller: _weightController,
                    validator: _validateNonNegativeDecimal,
                    decimal: true,
                    suffix: 'kg',
                  ),

                  const SizedBox(height: 16),
                ],

                if (mode == ExerciseTrackingMode.reps) ...[
                  _numberField(
                    label: 'Target reps (optional)',
                    controller: _repsController,
                    validator: _validatePositiveInteger,
                  ),

                  const SizedBox(height: 16),
                ],

                if (mode == ExerciseTrackingMode.duration) ...[
                  _numberField(
                    label: 'Target duration (optional)',
                    controller: _durationController,
                    validator: _validatePositiveInteger,
                    suffix: 'sec',
                  ),

                  const SizedBox(height: 16),
                ],

                if (mode == ExerciseTrackingMode.distance) ...[
                  _numberField(
                    label: 'Target distance (optional)',
                    controller: _distanceController,
                    validator: _validateNonNegativeDecimal,
                    decimal: true,
                    suffix: 'km',
                  ),

                  const SizedBox(height: 16),
                ],

                // ------------------------------------------
                // REST SETTINGS
                // ------------------------------------------
                _numberField(
                  label: 'Rest between sets *',
                  controller: _restSetsController,
                  validator: _validateNonNegativeInteger,
                  suffix: 'sec',
                ),

                const SizedBox(height: 16),

                _numberField(
                  label: 'Rest after exercise *',
                  controller: _restExerciseController,
                  validator: _validateNonNegativeInteger,
                  suffix: 'sec',
                ),

                const SizedBox(height: 16),

                // ------------------------------------------
                // OPTIONAL NOTES
                // ------------------------------------------
                TextFormField(
                  controller: _notesController,
                  maxLines: 3,
                  style: const TextStyle(color: KinetiqColors.textPrimary),
                  decoration: const InputDecoration(
                    labelText: 'Notes (optional)',
                    hintText: 'Instructions for this exercise...',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text('CANCEL'),
        ),
        ElevatedButton(
          onPressed: _submit,
          child: Text(_isEditing ? 'SAVE CHANGES' : 'ADD TO WORKOUT'),
        ),
      ],
    );
  }
}
