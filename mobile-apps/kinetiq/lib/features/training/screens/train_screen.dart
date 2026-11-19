import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_dialog.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';
import '../widgets/routine_card.dart';

class TrainScreen extends ConsumerWidget {
  const TrainScreen({super.key});
  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final values = await showNameDialog(
      context,
      heading: 'New routine',
      titleLabel: 'Routine name',
    );
    if (values == null || !context.mounted) return;
    final app = ref.read(appControllerProvider);
    final id = await performAction(
      context,
      () =>
          app.mutate((r) => r.createRoutine(values.title, notes: values.notes)),
    );
    if (context.mounted && id != null) context.push('/routines/$id');
  }

  Future<void> _start(
    BuildContext context,
    WidgetRef ref,
    String? routineId,
  ) async {
    final app = ref.read(appControllerProvider);
    final id = await performAction(
      context,
      () => app.mutate((r) => r.startSession(routineId: routineId)),
    );
    if (context.mounted && id != null) context.push('/workout/$id');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    return KScreen(
      title: 'Workout studio',
      eyebrow: 'TRAIN / BUILD',
      subtitle: 'Plan intentionally. Log what you actually do.',
      action: IconButton(
        onPressed: () => context.push('/profile'),
        tooltip: 'Profile',
        icon: const Icon(Icons.person_outline),
      ),
      children: [
        if (app.active != null) ...[
          KCard(
            borderColor: KColors.lime,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'WORKOUT IN PROGRESS',
                  style: TextStyle(
                    color: KColors.lime,
                    letterSpacing: 1.5,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  app.active!.name,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                KButton(
                  label: 'RESUME WORKOUT',
                  icon: Icons.play_arrow,
                  onPressed: () => context.push('/workout/${app.active!.id}'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        KButton(
          label: 'START EMPTY WORKOUT',
          icon: Icons.add_circle_outline,
          onPressed: app.working ? null : () => _start(context, ref, null),
        ),
        KSection(
          title: 'Saved routines',
          trailing: TextButton.icon(
            onPressed: app.working ? null : () => _create(context, ref),
            icon: const Icon(Icons.add),
            label: const Text('Create'),
          ),
          subtitle: 'Guest: ${app.routines.length} / 3 saved routines',
          child: app.routines.isEmpty
              ? KEmptyState(
                  title: 'Build your first routine',
                  message: 'Add exercises and targets once, then reuse your plan anytime.',
                  onAction: () => _create(context, ref),
                  actionLabel: 'Create routine',
                  icon: Icons.view_list_outlined,
                )
              : Column(
                  children: [
                    for (final routine in app.routines) ...[
                      RoutineCard(
                        routine: routine,
                        onOpen: () => context.push('/routines/${routine.id}'),
                        onStart: () => _start(context, ref, routine.id),
                        onFavorite: () => performAction(
                          context,
                          () => app.mutate(
                            (r) => r.toggleRoutineFavorite(routine),
                          ),
                        ),
                        onDuplicate: () => performAction(
                          context,
                          () =>
                              app.mutate((r) => r.duplicateRoutine(routine.id)),
                        ),
                        onArchive: () async {
                          if (await confirmAction(
                                context,
                                title: 'Archive routine?',
                                message: 'Past workouts stay in History.',
                                destructive: true,
                                confirm: 'Archive',
                              ) &&
                              context.mounted) {
                            await performAction(
                              context,
                              () => app.mutate(
                                (r) => r.archiveRoutine(routine.id),
                              ),
                            );
                          }
                        },
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
        ),
        KSection(
          title: 'Explore training',
          child: Column(
            children: [
              KListTile(
                title: 'Exercise library',
                subtitle: 'Browse, create and favorite exercises',
                icon: Icons.menu_book_outlined,
                onTap: () => context.push('/exercises'),
              ),
              const SizedBox(height: 10),
              KListTile(
                title: 'Training programs',
                subtitle: 'Organize routines into weekly plans',
                icon: Icons.calendar_month_outlined,
                onTap: () => context.push('/programs'),
              ),
              const SizedBox(height: 10),
              KListTile(
                title: 'Cardio log',
                subtitle: 'Walking, running, cycling and more',
                icon: Icons.directions_run,
                onTap: () => context.push('/cardio'),
              ),
              const SizedBox(height: 10),
              KListTile(
                title: 'Workout history',
                subtitle: 'Review your completed sessions',
                icon: Icons.history,
                onTap: () => context.push('/history'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
