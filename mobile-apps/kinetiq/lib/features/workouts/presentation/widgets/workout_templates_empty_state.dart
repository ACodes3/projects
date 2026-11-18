import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Empty state displayed when no workout templates exist.
///
/// The parent screen handles navigation to the create form.
class WorkoutTemplatesEmptyState extends StatelessWidget {
  const WorkoutTemplatesEmptyState({super.key, required this.onCreateWorkout});

  /// Called when the user wants to create a workout.
  final VoidCallback onCreateWorkout;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ------------------------------------------------
            // EMPTY STATE ICON
            // ------------------------------------------------

            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                color: KinetiqColors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: KinetiqColors.border),
              ),
              child: const Icon(
                Icons.fitness_center,
                color: KinetiqColors.primary,
                size: 36,
              ),
            ),

            const SizedBox(height: 24),

            // ------------------------------------------------
            // TITLE
            // ------------------------------------------------
            const Text(
              'No workouts yet',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: KinetiqColors.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),

            const SizedBox(height: 12),

            // ------------------------------------------------
            // DESCRIPTION
            // ------------------------------------------------
            const Text(
              'Build your first workout template and create a '
              'routine you can reuse anytime.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: KinetiqColors.textSecondary,
                fontSize: 14,
                height: 1.5,
              ),
            ),

            const SizedBox(height: 28),

            // ------------------------------------------------
            // CREATE WORKOUT BUTTON
            // ------------------------------------------------
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onCreateWorkout,
                icon: const Icon(Icons.add),
                label: const Text('CREATE WORKOUT'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(54),
                  backgroundColor: KinetiqColors.primary,
                  foregroundColor: KinetiqColors.background,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
