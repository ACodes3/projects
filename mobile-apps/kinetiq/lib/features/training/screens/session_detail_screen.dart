import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/domain/models.dart';
import '../../../core/domain/metrics.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';
import '../../../shared/widgets/k_stat.dart';
import '../widgets/completed_set_editor.dart';

class SessionDetailScreen extends ConsumerStatefulWidget {
  const SessionDetailScreen({super.key, required this.sessionId});
  final String sessionId;
  @override
  ConsumerState<SessionDetailScreen> createState() =>
      _SessionDetailScreenState();
}

class _SessionDetailScreenState extends ConsumerState<SessionDetailScreen> {
  WorkoutSession? session;
  List<SessionExercise>? exercises;
  List<LoggedSet> sets = [];
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = ref.read(repositoryProvider);
    final s = await repo.sessionById(widget.sessionId);
    final e = await repo.sessionExercises(widget.sessionId);
    final l = await repo.setsForSession(widget.sessionId);
    if (mounted) {
      setState(() {
        session = s;
        exercises = e;
        sets = l;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    if (exercises == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (session == null) {
      return const KScreen(
        title: 'Workout not found',
        back: true,
        children: [
          KEmptyState(
            title: 'Session unavailable',
            message: 'There is no saved session with that ID.',
          ),
        ],
      );
    }
    return KScreen(
      title: session!.name,
      eyebrow: 'HISTORY / SESSION',
      back: true,
      subtitle:
          '${dayLabel(session!.startedAt.toLocal())} · ${session!.status}',
      children: [
        Row(
          children: [
            Expanded(
              child: KStat(
                label: 'Duration',
                value: durationLabel(session!.duration),
                icon: Icons.timer_outlined,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: KStat(
                label: 'Completed sets',
                value: '${completedSets(sets)}',
                icon: Icons.done_all,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        KStat(
          label: 'Verified training volume',
          value: '${numberLabel(completedVolume(sets), 1)} kg × reps',
          icon: Icons.monitor_weight_outlined,
        ),
        KSection(
          title: 'Exercise snapshots',
          child: exercises!.isEmpty
              ? const KEmptyState(
                  title: 'No exercises',
                  message: 'No exercises were logged.',
                )
              : Column(
                  children: [
                    for (final exercise in exercises!) ...[
                      KCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              exercise.name,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 12),
                            for (final entry in sets.where(
                              (set) => set.sessionExerciseId == exercise.id,
                            ))
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 5,
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      entry.completed
                                          ? Icons.check_circle
                                          : Icons.radio_button_unchecked,
                                      size: 18,
                                      color: entry.completed
                                          ? KColors.lime
                                          : KColors.muted,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Set ${entry.position + 1}: ${exercise.mode == 'weight_reps'
                                            ? '${numberLabel(entry.weightKg, 1)} kg × ${numberLabel(entry.reps)}'
                                            : exercise.mode == 'reps'
                                            ? '${numberLabel(entry.reps)} reps'
                                            : exercise.mode == 'duration'
                                            ? '${numberLabel(entry.seconds)} s'
                                            : '${numberLabel(entry.meters, 1)} m'}',
                                      ),
                                    ),
                                    if (session!.status == 'completed')
                                      IconButton(
                                        tooltip: 'Correct historical set',
                                        icon: const Icon(
                                          Icons.edit_outlined,
                                          size: 20,
                                        ),
                                        onPressed: () async {
                                          final changed =
                                              await showCompletedSetEditor(
                                                context,
                                                entry,
                                                exercise.mode,
                                                app.imperial,
                                              );
                                          if (changed == null ||
                                              !context.mounted) {
                                            return;
                                          }
                                          await performAction(
                                            context,
                                            () => app.mutate(
                                              (repo) => repo.editCompletedSet(
                                                entry.id,
                                                weightKg: changed.weightKg,
                                                reps: changed.reps,
                                                seconds: changed.seconds,
                                                meters: changed.meters,
                                                completed: changed.completed,
                                              ),
                                            ),
                                            success:
                                                'Historical set corrected.',
                                          );
                                          await _load();
                                        },
                                      ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
        ),
        if (session!.notes.trim().isNotEmpty)
          KSection(
            title: 'Session notes',
            child: KCard(child: Text(session!.notes)),
          ),
        const SizedBox(height: 22),
        KButton(
          label: 'DELETE RECORD',
          style: KButtonStyle.danger,
          icon: Icons.delete_outline,
          onPressed: () async {
            if (await confirmAction(
                  context,
                  title: 'Delete completed workout?',
                  message: 'This permanently removes this local workout and its set history.',
                  destructive: true,
                  confirm: 'Delete',
                ) &&
                context.mounted) {
              await performAction(
                context,
                () => app.mutate(
                  (r) => r.deleteCompletedSession(widget.sessionId),
                ),
              );
              if (context.mounted) context.go('/history');
            }
          },
        ),
      ],
    );
  }
}
