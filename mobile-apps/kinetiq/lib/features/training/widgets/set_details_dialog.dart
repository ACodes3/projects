import 'package:material_ui/material_ui.dart';

import '../../../core/domain/models.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_choice.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_text_field.dart';

class SetDetailsValues {
  const SetDetailsValues({
    required this.kind,
    this.rpe,
    this.rir,
    required this.notes,
  });
  final String kind, notes;
  final double? rpe, rir;
}

/// Optional advanced set editing uses the same component in each workout.
Future<SetDetailsValues?> showSetDetailsDialog(
  BuildContext context,
  LoggedSet set,
) async {
  final rpe = TextEditingController(text: set.rpe?.toString() ?? '');
  final rir = TextEditingController(text: set.rir?.toString() ?? '');
  final notes = TextEditingController(text: set.notes);
  var kind = set.kind;
  try {
    return await showDialog<SetDetailsValues>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, update) => AlertDialog(
          title: Text('Set ${set.position + 1} details'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 5,
                  runSpacing: 5,
                  children: [
                    for (final value in [
                      'working',
                      'warmup',
                      'drop',
                      'failure',
                    ])
                      KChoice(
                        label: value,
                        selected: kind == value,
                        onTap: () => update(() => kind = value),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                KNumberField(controller: rpe, label: 'RPE (1–10, optional)'),
                const SizedBox(height: 12),
                KNumberField(controller: rir, label: 'RIR (0–10, optional)'),
                const SizedBox(height: 12),
                KTextField(
                  controller: notes,
                  label: 'Set notes (optional)',
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
              onPressed: () {
                final effort = rpe.text.isEmpty
                    ? null
                    : double.tryParse(rpe.text);
                final reserve = rir.text.isEmpty
                    ? null
                    : double.tryParse(rir.text);
                if ((effort != null && (effort < 1 || effort > 10)) ||
                    (reserve != null && (reserve < 0 || reserve > 10))) {
                  ScaffoldMessenger.of(dialogContext).showSnackBar(
                    const SnackBar(
                      content: Text('RPE must be 1–10; RIR 0–10.'),
                    ),
                  );
                  return;
                }
                Navigator.pop(
                  dialogContext,
                  SetDetailsValues(
                    kind: kind,
                    rpe: effort,
                    rir: reserve,
                    notes: notes.text,
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  } finally {
    rpe.dispose();
    rir.dispose();
    notes.dispose();
  }
}
