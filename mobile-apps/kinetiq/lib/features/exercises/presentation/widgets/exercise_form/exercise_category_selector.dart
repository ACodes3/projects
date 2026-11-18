import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Reusable category selector for exercise forms.
///
/// The parent form controls the selected category.
/// This widget only displays the available options.
class ExerciseCategorySelector extends StatelessWidget {
  const ExerciseCategorySelector({
    super.key,
    required this.selectedCategory,
    required this.onChanged,
  });

  /// Currently selected category: strength or cardio.
  final String selectedCategory;

  /// Called when the user changes the category.
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ----------------------------------------------------
        // SECTION LABEL
        // ----------------------------------------------------
        const Text(
          'CATEGORY *',
          style: TextStyle(
            color: KinetiqColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w700,
            letterSpacing: 1,
          ),
        ),

        const SizedBox(height: 12),

        // ----------------------------------------------------
        // CATEGORY OPTIONS
        // ----------------------------------------------------
        SizedBox(
          width: double.infinity,
          child: SegmentedButton<String>(
            segments: const [
              ButtonSegment<String>(
                value: 'strength',
                label: Text('Strength'),
                icon: Icon(Icons.fitness_center),
              ),
              ButtonSegment<String>(
                value: 'cardio',
                label: Text('Cardio'),
                icon: Icon(Icons.directions_run),
              ),
            ],

            selected: {selectedCategory},

            showSelectedIcon: false,

            onSelectionChanged: (selection) {
              onChanged(selection.first);
            },

            style: ButtonStyle(
              foregroundColor: WidgetStateProperty.resolveWith((states) {
                return states.contains(WidgetState.selected)
                    ? KinetiqColors.background
                    : KinetiqColors.textSecondary;
              }),

              backgroundColor: WidgetStateProperty.resolveWith((states) {
                return states.contains(WidgetState.selected)
                    ? KinetiqColors.primary
                    : KinetiqColors.surface;
              }),

              side: WidgetStateProperty.all(
                const BorderSide(color: KinetiqColors.border),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
