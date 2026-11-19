import 'package:material_ui/material_ui.dart';

import '../../../core/domain/models.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_card.dart';

class RoutineCard extends StatelessWidget {
  const RoutineCard({
    super.key,
    required this.routine,
    required this.onOpen,
    required this.onStart,
    this.onFavorite,
    this.onDuplicate,
    this.onArchive,
  });
  final Routine routine;
  final VoidCallback onOpen, onStart;
  final VoidCallback? onFavorite, onDuplicate, onArchive;
  @override
  Widget build(BuildContext context) => KCard(
    onTap: onOpen,
    child: Row(
      children: [
        Container(
          width: 46,
          height: 54,
          decoration: BoxDecoration(
            color: KColors.surfaceRaised,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.fitness_center, color: KColors.lime),
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                routine.title,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 5),
              Text(
                '${routine.count} exercises${routine.notes.isNotEmpty ? ' · ${routine.notes}' : ''}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: KColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(
            Icons.play_circle_fill,
            color: KColors.lime,
            size: 29,
          ),
          tooltip: 'Start workout',
          onPressed: onStart,
        ),
        PopupMenuButton<String>(
          tooltip: 'Routine actions',
          onSelected: (v) {
            switch (v) {
              case 'favorite':
                onFavorite?.call();
                break;
              case 'duplicate':
                onDuplicate?.call();
                break;
              case 'archive':
                onArchive?.call();
                break;
            }
          },
          itemBuilder: (context) => [
            PopupMenuItem(
              value: 'favorite',
              child: Text(routine.favorite ? 'Unfavorite' : 'Favorite'),
            ),
            const PopupMenuItem(value: 'duplicate', child: Text('Duplicate')),
            const PopupMenuItem(value: 'archive', child: Text('Archive')),
          ],
        ),
      ],
    ),
  );
}
