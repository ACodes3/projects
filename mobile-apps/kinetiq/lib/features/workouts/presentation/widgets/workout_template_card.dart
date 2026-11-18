import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';

/// Displays a saved workout template.
///
/// This is a reusable presentation component.
/// The parent screen handles editing, deleting,
/// and toggling favorites.
class WorkoutTemplateCard extends StatelessWidget {
  const WorkoutTemplateCard({
    super.key,
    required this.template,
    required this.onEdit,
    required this.onDelete,
    required this.onToggleFavorite,
  });

  final WorkoutTemplate template;

  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onToggleFavorite;

  @override
  Widget build(BuildContext context) {
    final description = template.description?.trim();

    final hasDescription = description != null && description.isNotEmpty;

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
          // TEMPLATE INFORMATION
          // --------------------------------------------------

          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: KinetiqColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.fitness_center,
                  color: KinetiqColors.primary,
                  size: 24,
                ),
              ),

              const SizedBox(width: 14),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      template.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: KinetiqColors.textPrimary,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),

                    if (hasDescription) ...[
                      const SizedBox(height: 5),
                      Text(
                        description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: KinetiqColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // ------------------------------------------------
              // FAVORITE BUTTON
              // ------------------------------------------------
              IconButton(
                tooltip: template.isFavorite
                    ? 'Remove from favorites'
                    : 'Add to favorites',
                onPressed: onToggleFavorite,
                icon: Icon(
                  template.isFavorite ? Icons.star : Icons.star_border,
                  color: template.isFavorite
                      ? KinetiqColors.primary
                      : KinetiqColors.textMuted,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          const Divider(color: KinetiqColors.border, height: 1),

          const SizedBox(height: 12),

          // --------------------------------------------------
          // CARD ACTIONS
          // --------------------------------------------------
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Saved workout routine',
                  style: TextStyle(
                    color: KinetiqColors.textMuted,
                    fontSize: 12,
                  ),
                ),
              ),

              IconButton(
                tooltip: 'Edit workout template',
                onPressed: onEdit,
                icon: const Icon(
                  Icons.edit_outlined,
                  color: KinetiqColors.textSecondary,
                  size: 20,
                ),
              ),

              IconButton(
                tooltip: 'Delete workout template',
                onPressed: onDelete,
                icon: const Icon(
                  Icons.delete_outline,
                  color: KinetiqColors.textSecondary,
                  size: 20,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
