import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_choice.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_screen.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});
  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  String filter = 'Completed';
  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final items = app.sessions
        .where(
          (x) =>
              filter == 'All' ||
              (filter == 'Completed' && x.status == 'completed') ||
              (filter == 'Active' && x.status == 'in_progress'),
        )
        .toList();
    return KScreen(
      title: 'Workout history',
      eyebrow: 'TRAIN / HISTORY',
      back: true,
      subtitle: 'A record of actual sessions saved on this device.',
      children: [
        Wrap(
          spacing: 9,
          children: [
            for (final option in ['Completed', 'Active', 'All'])
              KChoice(
                label: option,
                selected: filter == option,
                onTap: () => setState(() => filter = option),
              ),
          ],
        ),
        const SizedBox(height: 20),
        if (items.isEmpty)
          const KEmptyState(
            title: 'No sessions yet',
            message: 'Completed workouts will appear here. Nothing is counted until you log it.',
            icon: Icons.history,
          ),
        for (final session in items) ...[
          KListTile(
            title: session.name,
            subtitle:
                '${dayLabel(session.startedAt.toLocal())} · ${session.status} · ${durationLabel(session.duration)}',
            icon: session.status == 'completed'
                ? Icons.check_circle_outline
                : Icons.timer_outlined,
            onTap: () => context.push(
              session.status == 'completed'
                  ? '/session/${session.id}'
                  : '/workout/${session.id}',
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}
