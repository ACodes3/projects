import 'package:material_ui/material_ui.dart';

import '../../../core/domain/models.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_number_field.dart';

class CompletedSetValues {
  const CompletedSetValues({
    this.weightKg,
    this.reps,
    this.seconds,
    this.meters,
    required this.completed,
  });
  final double? weightKg, meters;
  final int? reps, seconds;
  final bool completed;
}

/// Explicit correction for a completed session. No template data is changed.
Future<CompletedSetValues?> showCompletedSetEditor(
  BuildContext context,
  LoggedSet entry,
  String mode,
  bool imperial,
) async {
  final weight = TextEditingController(
    text: entry.weightKg == null
        ? ''
        : numberLabel(displayWeight(entry.weightKg!, imperial), 1),
  );
  final reps = TextEditingController(text: entry.reps?.toString() ?? '');
  final seconds = TextEditingController(text: entry.seconds?.toString() ?? '');
  final meters = TextEditingController(text: entry.meters?.toString() ?? '');
  var completed = entry.completed;
  try {
    return await showDialog<CompletedSetValues>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, rebuild) => AlertDialog(
          title: Text('Correct set ${entry.position + 1}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (mode == 'weight_reps') ...[
                  KNumberField(
                    controller: weight,
                    label: imperial ? 'Weight (lb)' : 'Weight (kg)',
                  ),
                  const SizedBox(height: 12),
                ],
                if (mode == 'weight_reps' || mode == 'reps')
                  KNumberField(controller: reps, label: 'Reps', decimal: false),
                if (mode == 'duration')
                  KNumberField(
                    controller: seconds,
                    label: 'Seconds',
                    decimal: false,
                  ),
                if (mode == 'distance')
                  KNumberField(controller: meters, label: 'Meters'),
                const SizedBox(height: 12),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Set completed'),
                  value: completed,
                  onChanged: (value) =>
                      rebuild(() => completed = value ?? false),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Only this historical set changes. The routine remains unchanged.',
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
              label: 'Save correction',
              expanded: false,
              onPressed: () {
                final enteredWeight = double.tryParse(weight.text);
                Navigator.pop(
                  dialogContext,
                  CompletedSetValues(
                    weightKg: enteredWeight == null
                        ? null
                        : canonicalWeight(enteredWeight, imperial),
                    reps: int.tryParse(reps.text),
                    seconds: int.tryParse(seconds.text),
                    meters: double.tryParse(meters.text),
                    completed: completed,
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  } finally {
    weight.dispose();
    reps.dispose();
    seconds.dispose();
    meters.dispose();
  }
}
