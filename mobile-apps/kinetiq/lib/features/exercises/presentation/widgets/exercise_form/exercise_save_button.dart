import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Reusable save button for creating and editing exercises.
///
/// The parent form manages validation and database operations.
/// This component handles only the button's appearance and state.
class ExerciseSaveButton extends StatelessWidget {
  const ExerciseSaveButton({
    super.key,
    required this.isSaving,
    required this.isEditing,
    required this.onPressed,
  });

  /// Whether a database save operation is in progress.
  final bool isSaving;

  /// Whether the form is editing an existing exercise.
  final bool isEditing;

  /// Called when the user presses Save.
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        // Prevent repeated submissions while saving.
        onPressed: isSaving ? null : onPressed,

        icon: isSaving
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: KinetiqColors.background,
                ),
              )
            : const Icon(Icons.check),

        label: Text(
          isSaving
              ? 'SAVING...'
              : isEditing
              ? 'SAVE CHANGES'
              : 'SAVE EXERCISE',
        ),

        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(54),
          backgroundColor: KinetiqColors.primary,
          foregroundColor: KinetiqColors.background,
          disabledBackgroundColor: KinetiqColors.surfaceElevated,
          disabledForegroundColor: KinetiqColors.textSecondary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    );
  }
}
