import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Shows either an empty library or empty search results.
class ExerciseLibraryEmptyState extends StatelessWidget {
  const ExerciseLibraryEmptyState({
    super.key,
    required this.hasExercises,
    required this.onAddExercise,
  });

  /// True when the database contains exercises,
  /// but the current filters return no matches.
  final bool hasExercises;

  final VoidCallback onAddExercise;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              hasExercises
                  ? Icons.search_off_outlined
                  : Icons.fitness_center_outlined,
              size: 52,
              color: hasExercises
                  ? KinetiqColors.textMuted
                  : KinetiqColors.primary,
            ),

            const SizedBox(height: 20),

            Text(
              hasExercises
                  ? 'No matching exercises'
                  : 'Your exercise library is empty',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: KinetiqColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),

            const SizedBox(height: 10),

            Text(
              hasExercises
                  ? 'Try changing your search or category filter.'
                  : 'Exercises you add will appear here.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: KinetiqColors.textSecondary,
                fontSize: 14,
              ),
            ),

            // Show the button only when the library is empty.
            if (!hasExercises) ...[
              const SizedBox(height: 28),

              SizedBox(
                width: 220,
                child: ElevatedButton.icon(
                  onPressed: onAddExercise,
                  icon: const Icon(Icons.add),
                  label: const Text('ADD EXERCISE'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(50),
                    backgroundColor: KinetiqColors.primary,
                    foregroundColor: KinetiqColors.background,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
