import 'package:material_ui/material_ui.dart';

import 'k_button.dart';
import 'k_text_field.dart';

/// Universal name + description dialog for routines, programs, recipes, etc.
Future<({String title, String notes})?> showNameDialog(
  BuildContext context, {
  required String heading,
  String titleLabel = 'Name',
  String notesLabel = 'Notes (optional)',
  String initialTitle = '',
  String initialNotes = '',
  bool showNotes = true,
}) async {
  final title = TextEditingController(text: initialTitle);
  final notes = TextEditingController(text: initialNotes);
  try {
    return await showDialog<({String title, String notes})>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(heading),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              KTextField(controller: title, label: titleLabel),
              if (showNotes) ...[
                const SizedBox(height: 12),
                KTextField(controller: notes, label: notesLabel, lines: 3),
              ],
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
            onPressed: () => Navigator.pop(dialogContext, (
              title: title.text.trim(),
              notes: notes.text.trim(),
            )),
          ),
        ],
      ),
    );
  } finally {
    title.dispose();
    notes.dispose();
  }
}
