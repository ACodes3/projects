import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Data returned when the user submits the workout form.
class WorkoutTemplateFormData {
  const WorkoutTemplateFormData({
    required this.name,
    required this.description,
  });

  final String name;
  final String? description;
}

/// Reusable dialog for creating or editing workout templates.
///
/// This component handles form input and validation.
/// The parent screen handles saving to SQLite.
class WorkoutTemplateFormDialog extends StatefulWidget {
  const WorkoutTemplateFormDialog({
    super.key,
    this.initialName = '',
    this.initialDescription,
    this.isEditing = false,
  });

  final String initialName;
  final String? initialDescription;
  final bool isEditing;

  @override
  State<WorkoutTemplateFormDialog> createState() =>
      _WorkoutTemplateFormDialogState();
}

class _WorkoutTemplateFormDialogState extends State<WorkoutTemplateFormDialog> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;

  @override
  void initState() {
    super.initState();

    _nameController = TextEditingController(text: widget.initialName);

    _descriptionController = TextEditingController(
      text: widget.initialDescription ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final name = _nameController.text.trim();
    final description = _descriptionController.text.trim();

    Navigator.of(context).pop(
      WorkoutTemplateFormData(
        name: name,
        description: description.isEmpty ? null : description,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: KinetiqColors.surface,
      title: Text(
        widget.isEditing ? 'Edit Workout' : 'Create Workout',
        style: const TextStyle(
          color: KinetiqColors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ----------------------------------------------
              // WORKOUT NAME
              // ----------------------------------------------

              TextFormField(
                controller: _nameController,
                maxLength: 120,
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                style: const TextStyle(color: KinetiqColors.textPrimary),
                decoration: const InputDecoration(
                  labelText: 'Workout name *',
                  hintText: 'e.g. Upper Body',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Workout name is required.';
                  }

                  return null;
                },
              ),

              const SizedBox(height: 16),

              // ----------------------------------------------
              // DESCRIPTION (OPTIONAL)
              // ----------------------------------------------
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                style: const TextStyle(color: KinetiqColors.textPrimary),
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  hintText: 'Describe your routine...',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
      ),

      // ------------------------------------------------------
      // ACTIONS
      // ------------------------------------------------------
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text('CANCEL'),
        ),
        ElevatedButton(
          onPressed: _submit,
          child: Text(widget.isEditing ? 'SAVE CHANGES' : 'CREATE'),
        ),
      ],
    );
  }
}
