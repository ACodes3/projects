import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';

/// Displays an exercise configured inside a workout template.
///
/// This component handles presentation only.
/// The parent screen handles editing and removal.
class WorkoutTemplateExerciseCard extends StatelessWidget {
  const WorkoutTemplateExerciseCard({
    super.key,
    required this.exercise,
    required this.exerciseName,
    required this.onEdit,
    required this.onRemove,
  });

  /// Configuration stored in workout_template_exercises.
  final WorkoutTemplateExercise exercise;

  /// Name resolved from the Exercise Library.
  final String exerciseName;

  final VoidCallback onEdit;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: KinetiqColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: KinetiqColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --------------------------------------------------
          // EXERCISE HEADER
          // --------------------------------------------------

          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: KinetiqColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${exercise.position + 1}',
                  style: const TextStyle(
                    color: KinetiqColors.primary,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: Text(
                  exerciseName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: KinetiqColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),

              IconButton(
                tooltip: 'Edit exercise settings',
                onPressed: onEdit,
                icon: const Icon(
                  Icons.edit_outlined,
                  color: KinetiqColors.textSecondary,
                  size: 20,
                ),
              ),

              IconButton(
                tooltip: 'Remove from workout',
                onPressed: onRemove,
                icon: const Icon(
                  Icons.delete_outline,
                  color: KinetiqColors.textSecondary,
                  size: 20,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // --------------------------------------------------
          // TRAINING TARGETS
          // --------------------------------------------------
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _infoChip('${exercise.sets} sets'),

              if (exercise.targetReps != null)
                _infoChip('${exercise.targetReps} reps'),

              if (exercise.targetWeight != null)
                _infoChip('${exercise.targetWeight} kg'),

              if (exercise.targetDurationSeconds != null)
                _infoChip('${exercise.targetDurationSeconds} sec'),

              if (exercise.targetDistanceKm != null)
                _infoChip('${exercise.targetDistanceKm} km'),
            ],
          ),

          const SizedBox(height: 14),

          // --------------------------------------------------
          // REST SETTINGS
          // --------------------------------------------------
          Row(
            children: [
              const Icon(
                Icons.timer_outlined,
                size: 16,
                color: KinetiqColors.textMuted,
              ),

              const SizedBox(width: 6),

              Expanded(
                child: Text(
                  '${exercise.restBetweenSetsSeconds} sec between sets'
                  ' · ${exercise.restAfterExerciseSeconds} sec after exercise',
                  style: const TextStyle(
                    color: KinetiqColors.textMuted,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),

          // --------------------------------------------------
          // OPTIONAL NOTES
          // --------------------------------------------------
          if (exercise.notes != null && exercise.notes!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),

            Text(
              exercise.notes!,
              style: const TextStyle(
                color: KinetiqColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ----------------------------------------------------------
  // REUSABLE INFO CHIP
  // ----------------------------------------------------------

  Widget _infoChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: KinetiqColors.surfaceElevated,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: KinetiqColors.textSecondary,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
