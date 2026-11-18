import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Reusable text fields for creating and editing exercises.
///
/// The parent screen owns and disposes the controllers.
class ExerciseFormFields extends StatelessWidget {
  const ExerciseFormFields({
    super.key,
    required this.nameController,
    required this.muscleGroupController,
    required this.notesController,
    this.showName = true,
    this.showOptionalFields = true,
  });

  final TextEditingController nameController;
  final TextEditingController muscleGroupController;
  final TextEditingController notesController;

  /// Whether to show the required exercise name field.
  final bool showName;

  /// Whether to show the optional muscle group and notes.
  final bool showOptionalFields;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ----------------------------------------------------
        // EXERCISE NAME — REQUIRED
        // ----------------------------------------------------
        if (showName)
          TextFormField(
            controller: nameController,
            maxLength: 120,
            textCapitalization: TextCapitalization.words,
            style: const TextStyle(color: KinetiqColors.textPrimary),
            decoration: const InputDecoration(
              labelText: 'Exercise name *',
              hintText: 'e.g. Bulgarian Split Squat',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Exercise name is required.';
              }

              return null;
            },
          ),

        // ----------------------------------------------------
        // OPTIONAL FIELDS
        // ----------------------------------------------------
        if (showOptionalFields) ...[
          // MUSCLE GROUP
          TextFormField(
            controller: muscleGroupController,
            textCapitalization: TextCapitalization.words,
            style: const TextStyle(color: KinetiqColors.textPrimary),
            decoration: const InputDecoration(
              labelText: 'Muscle group (optional)',
              hintText: 'e.g. Legs',
              border: OutlineInputBorder(),
            ),
          ),

          const SizedBox(height: 20),

          // NOTES
          TextFormField(
            controller: notesController,
            maxLines: 4,
            style: const TextStyle(color: KinetiqColors.textPrimary),
            decoration: const InputDecoration(
              labelText: 'Notes (optional)',
              hintText: 'Technique, equipment, instructions...',
              border: OutlineInputBorder(),
              alignLabelWithHint: true,
            ),
          ),
        ],
      ],
    );
  }
}
