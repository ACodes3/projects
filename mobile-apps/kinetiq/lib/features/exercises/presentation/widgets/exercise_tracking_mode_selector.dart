import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/features/exercises/domain/enums/exercise_tracking_mode.dart';

/// Reusable selector for exercise tracking modes.
///
/// This widget only handles presentation.
/// The parent form manages the selected value.
class ExerciseTrackingModeSelector extends StatelessWidget {
  const ExerciseTrackingModeSelector({
    super.key,
    required this.selectedMode,
    required this.onChanged,
  });

  /// Currently selected tracking mode.
  final ExerciseTrackingMode selectedMode;

  /// Called when the user selects another mode.
  final ValueChanged<ExerciseTrackingMode> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'TRACKING MODE *',
          style: TextStyle(
            color: KinetiqColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w700,
            letterSpacing: 1,
          ),
        ),

        const SizedBox(height: 12),

        // Display each tracking mode as a selectable option.
        ...ExerciseTrackingMode.values.map((mode) {
          final isSelected = selectedMode == mode;

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: isSelected
                  ? KinetiqColors.surfaceElevated
                  : KinetiqColors.surface,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                onTap: () => onChanged(mode),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? KinetiqColors.primary
                          : KinetiqColors.border,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _iconForMode(mode),
                        color: isSelected
                            ? KinetiqColors.primary
                            : KinetiqColors.textSecondary,
                        size: 22,
                      ),

                      const SizedBox(width: 14),

                      Expanded(
                        child: Text(
                          mode.label,
                          style: TextStyle(
                            color: isSelected
                                ? KinetiqColors.textPrimary
                                : KinetiqColors.textSecondary,
                            fontSize: 15,
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.w500,
                          ),
                        ),
                      ),

                      Icon(
                        isSelected
                            ? Icons.radio_button_checked
                            : Icons.radio_button_unchecked,
                        color: isSelected
                            ? KinetiqColors.primary
                            : KinetiqColors.textMuted,
                        size: 22,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  /// Returns an appropriate icon for each tracking mode.
  IconData _iconForMode(ExerciseTrackingMode mode) {
    switch (mode) {
      case ExerciseTrackingMode.weightReps:
        return Icons.fitness_center;

      case ExerciseTrackingMode.reps:
        return Icons.repeat;

      case ExerciseTrackingMode.duration:
        return Icons.timer_outlined;

      case ExerciseTrackingMode.distance:
        return Icons.route_outlined;
    }
  }
}
