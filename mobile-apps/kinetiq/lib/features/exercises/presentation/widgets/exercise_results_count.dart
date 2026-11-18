import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Displays how many exercises match the active filters.
///
/// Presentation only — does not access Riverpod or SQLite.
class ExerciseResultsCount extends StatelessWidget {
  const ExerciseResultsCount({
    super.key,
    required this.visibleCount,
    required this.totalCount,
  });

  /// Number of exercises matching search and category filters.
  final int visibleCount;

  /// Total number of exercises stored in the library.
  final int totalCount;

  @override
  Widget build(BuildContext context) {
    final exerciseLabel = totalCount == 1 ? 'exercise' : 'exercises';

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Showing $visibleCount of $totalCount $exerciseLabel',
            style: const TextStyle(
              color: KinetiqColors.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),

          const Icon(
            Icons.format_list_bulleted,
            color: KinetiqColors.primary,
            size: 18,
          ),
        ],
      ),
    );
  }
}
