import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Search and category controls for the Exercise Library.
class ExerciseLibraryFilters extends StatelessWidget {
  const ExerciseLibraryFilters({
    super.key,
    required this.searchQuery,
    required this.selectedCategory,
    required this.onSearchChanged,
    required this.onCategoryChanged,
  });

  final String searchQuery;
  final String selectedCategory;

  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String> onCategoryChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --------------------------------------------------
          // SEARCH
          // --------------------------------------------------
          TextField(
            onChanged: onSearchChanged,
            style: const TextStyle(color: KinetiqColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Search exercises...',
              prefixIcon: const Icon(
                Icons.search,
                color: KinetiqColors.textSecondary,
              ),
              filled: true,
              fillColor: KinetiqColors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
          ),

          const SizedBox(height: 16),

          // --------------------------------------------------
          // CATEGORY FILTERS
          // --------------------------------------------------
          SizedBox(
            width: double.infinity,
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment<String>(value: 'all', label: Text('All')),
                ButtonSegment<String>(
                  value: 'strength',
                  label: Text('Strength'),
                ),
                ButtonSegment<String>(value: 'cardio', label: Text('Cardio')),
              ],
              selected: {selectedCategory},
              showSelectedIcon: false,
              onSelectionChanged: (selection) {
                onCategoryChanged(selection.first);
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
      ),
    );
  }
}
