import 'package:material_ui/material_ui.dart';

import '../../../core/domain/models.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_text_field.dart';

class RoutineExerciseValues {
  const RoutineExerciseValues({
    required this.sets,
    this.reps,
    this.weight,
    required this.restSeconds,
    required this.notes,
  });
  final int sets, restSeconds;
  final int? reps;
  final double? weight;
  final String notes;
}

Future<RoutineExerciseValues?> showRoutineExerciseEditor(
  BuildContext context,
  RoutineExercise item,
) async {
  final sets = TextEditingController(text: '${item.targetSets}');
  final reps = TextEditingController(text: item.targetReps?.toString() ?? '');
  final weight = TextEditingController(
    text: item.targetWeightKg?.toString() ?? '',
  );
  final rest = TextEditingController(text: '${item.restSeconds}');
  final notes = TextEditingController(text: item.notes);
  try {
    return await showDialog<RoutineExerciseValues>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(item.name),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              KNumberField(
                controller: sets,
                label: 'Target sets',
                decimal: false,
              ),
              const SizedBox(height: 10),
              KNumberField(
                controller: reps,
                label: 'Target reps (optional)',
                decimal: false,
              ),
              const SizedBox(height: 10),
              KNumberField(controller: weight, label: 'Target kg (optional)'),
              const SizedBox(height: 10),
              KNumberField(
                controller: rest,
                label: 'Rest seconds',
                decimal: false,
              ),
              const SizedBox(height: 10),
              KTextField(
                controller: notes,
                label: 'Exercise notes (optional)',
                lines: 2,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          KButton(
            label: 'Save',
            expanded: false,
            onPressed: () => Navigator.pop(
              dialogContext,
              RoutineExerciseValues(
                sets: int.tryParse(sets.text) ?? 3,
                reps: int.tryParse(reps.text),
                weight: double.tryParse(weight.text),
                restSeconds: int.tryParse(rest.text) ?? 90,
                notes: notes.text,
              ),
            ),
          ),
        ],
      ),
    );
  } finally {
    sets.dispose();
    reps.dispose();
    weight.dispose();
    rest.dispose();
    notes.dispose();
  }
}
