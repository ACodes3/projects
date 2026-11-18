import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';

/// Displays one exercise and its available actions.
class ExerciseCard extends StatelessWidget {
  const ExerciseCard({
    super.key,
    required this.exercise,
    required this.onEdit,
    required this.onDelete,
  });

  final Exercise exercise;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: KinetiqColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: KinetiqColors.border),
      ),
      child: Row(
        children: [
          Icon(
            exercise.category == 'cardio'
                ? Icons.directions_run
                : Icons.fitness_center,
            color: KinetiqColors.primary,
          ),

          const SizedBox(width: 16),

          // --------------------------------------------------
          // EXERCISE DETAILS
          // --------------------------------------------------
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  exercise.name,
                  style: const TextStyle(
                    color: KinetiqColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),

                const SizedBox(height: 6),

                Text(
                  [
                    exercise.category,
                    if (exercise.muscleGroup != null &&
                        exercise.muscleGroup!.isNotEmpty)
                      exercise.muscleGroup!,
                  ].join(' • '),
                  style: const TextStyle(
                    color: KinetiqColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // --------------------------------------------------
          // EDIT ACTION
          // --------------------------------------------------
          IconButton(
            tooltip: 'Edit ${exercise.name}',
            onPressed: exercise.isCustom ? onEdit : null,
            icon: Icon(
              Icons.edit_outlined,
              color: exercise.isCustom
                  ? KinetiqColors.primary
                  : KinetiqColors.textMuted,
              size: 22,
            ),
          ),

          // --------------------------------------------------
          // DELETE ACTION
          // --------------------------------------------------
          IconButton(
            tooltip: 'Delete ${exercise.name}',
            onPressed: exercise.isCustom ? onDelete : null,
            icon: Icon(
              Icons.delete_outline,
              color: exercise.isCustom
                  ? Colors.redAccent
                  : KinetiqColors.textMuted,
              size: 22,
            ),
          ),
        ],
      ),
    );
  }
}
