import 'dart:async';

import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/domain/models.dart';
import '../../../core/state/providers.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';
import '../../../shared/widgets/k_text_field.dart';
import '../widgets/exercise_picker.dart';
import '../widgets/rest_timer_panel.dart';
import '../widgets/set_row.dart';
import '../widgets/set_details_dialog.dart';

class WorkoutSessionScreen extends ConsumerStatefulWidget {
  const WorkoutSessionScreen({super.key, required this.sessionId});
  final String sessionId;
  @override
  ConsumerState<WorkoutSessionScreen> createState() =>
      _WorkoutSessionScreenState();
}

class _WorkoutSessionScreenState extends ConsumerState<WorkoutSessionScreen> {
  WorkoutSession? session;
  List<SessionExercise>? exercises;
  List<LoggedSet> sets = [];
  final notes = TextEditingController();
  Timer? elapsedTimer, noteDebounce;
  @override
  void initState() {
    super.initState();
    _load();
    elapsedTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  Future<void> _load() async {
    final repo = ref.read(repositoryProvider);
    final loadedSession = await repo.sessionById(widget.sessionId);
    final loadedExercises = await repo.sessionExercises(widget.sessionId);
    final loadedSets = await repo.setsForSession(widget.sessionId);
    if (!mounted) return;
    setState(() {
      session = loadedSession;
      exercises = loadedExercises;
      sets = loadedSets;
    });
    if (notes.text.isEmpty) notes.text = loadedSession?.notes ?? '';
  }

  @override
  void dispose() {
    elapsedTimer?.cancel();
    noteDebounce?.cancel();
    notes.dispose();
    super.dispose();
  }

  Future<void> _addExercise() async {
    final selected = await showExercisePicker(
      context,
      exercises: ref.read(appControllerProvider).exercises,
    );
    if (selected == null || !mounted) return;
    await performAction(
      context,
      () => ref
          .read(appControllerProvider)
          .mutate((r) => r.addSessionExercise(widget.sessionId, selected)),
    );
    await _load();
  }

  Future<void> _finish() async {
    if (!await confirmAction(
      context,
      title: 'Finish workout?',
      message: 'Only completed sets will count toward your progress.',
      confirm: 'Finish',
    )) {
      return;
    }
    if (!mounted) return;
    noteDebounce?.cancel();
    final finalNotes = notes.text;
    final finished = await performAction(context, () async {
      await ref.read(appControllerProvider).mutate((r) async {
        await r.setSessionNotes(widget.sessionId, finalNotes);
        await r.finishSession(widget.sessionId);
      });
      return true;
    });
    if (mounted && finished == true) context.go('/session/${widget.sessionId}');
  }

  Future<void> _discard() async {
    if (!await confirmAction(
      context,
      title: 'Discard this workout?',
      message: 'The in-progress session will be marked discarded. This does not delete previously completed sessions.',
      confirm: 'Discard',
      destructive: true,
    )) {
      return;
    }
    if (!mounted) return;
    final discarded = await performAction(context, () async {
      await ref
          .read(appControllerProvider)
          .mutate((r) => r.discardSession(widget.sessionId));
      return true;
    });
    if (mounted && discarded == true) context.go('/train');
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    if (exercises == null || session == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (session!.status != 'in_progress') {
      return KScreen(
        title: 'Session is closed',
        back: true,
        children: [
          KButton(
            label: 'View session',
            onPressed: () => context.go('/session/${widget.sessionId}'),
          ),
        ],
      );
    }
    final done = sets.where((s) => s.completed).length;
    return KScreen(
      title: session!.name,
      eyebrow: 'ACTIVE WORKOUT',
      subtitle:
          'Elapsed ${durationLabel(session!.duration)} · Saved to this device',
      back: true,
      action: IconButton(
        tooltip: 'Discard workout',
        onPressed: _discard,
        icon: const Icon(Icons.delete_outline, color: KColors.danger),
      ),
      children: [
        KCard(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$done / ${sets.length} SETS',
                    style: const TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const Text(
                    'Completed',
                    style: TextStyle(color: KColors.muted),
                  ),
                ],
              ),
              const Icon(Icons.offline_bolt_outlined, color: KColors.lime),
            ],
          ),
        ),
        const SizedBox(height: 14),
        RestTimerPanel(
          sessionId: widget.sessionId,
          defaultSeconds: exercises!.isEmpty
              ? 90
              : exercises!.first.restSeconds,
        ),
        KSection(
          title: 'Exercises',
          trailing: TextButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Add'),
            onPressed: _addExercise,
          ),
          child: exercises!.isEmpty
              ? KEmptyState(
                  title: 'No exercises in this session',
                  message: 'Add an exercise and log your actual results.',
                  actionLabel: 'Add exercise',
                  onAction: _addExercise,
                )
              : Column(
                  children: [
                    for (final item in exercises!) ...[
                      KCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    item.name,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium,
                                  ),
                                ),
                                IconButton(
                                  tooltip: 'Remove exercise',
                                  icon: const Icon(
                                    Icons.close,
                                    color: KColors.muted,
                                  ),
                                  onPressed: () async {
                                    await performAction(
                                      context,
                                      () => app.mutate(
                                        (r) => r.deleteSessionExercise(item.id),
                                      ),
                                    );
                                    await _load();
                                  },
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            for (final entry in sets.where(
                              (s) => s.sessionExerciseId == item.id,
                            ))
                              SetRow(
                                key: ValueKey(entry.id),
                                set: entry,
                                mode: item.mode,
                                imperial: app.imperial,
                                onSave:
                                    ({
                                      weightKg,
                                      reps,
                                      seconds,
                                      meters,
                                      required completed,
                                    }) async {
                                      await performAction(
                                        context,
                                        () => app.mutate(
                                          (r) => r.updateSet(
                                            entry.id,
                                            weightKg: weightKg,
                                            reps: reps,
                                            seconds: seconds,
                                            meters: meters,
                                            completed: completed,
                                          ),
                                        ),
                                      );
                                      await _load();
                                    },
                                onDetails: () async {
                                  final values = await showSetDetailsDialog(
                                    context,
                                    entry,
                                  );
                                  if (values == null || !context.mounted) {
                                    return;
                                  }
                                  await performAction(
                                    context,
                                    () => app.mutate(
                                      (r) => r.saveSetDetails(
                                        entry.id,
                                        kind: values.kind,
                                        rpe: values.rpe,
                                        rir: values.rir,
                                        notes: values.notes,
                                      ),
                                    ),
                                  );
                                  await _load();
                                },
                                onDelete: () async {
                                  await performAction(
                                    context,
                                    () => app.mutate(
                                      (r) => r.deleteSet(entry.id),
                                    ),
                                  );
                                  await _load();
                                },
                              ),
                            const SizedBox(height: 9),
                            KButton(
                              label: 'Add set',
                              style: KButtonStyle.secondary,
                              icon: Icons.add,
                              expanded: false,
                              onPressed: () async {
                                await performAction(
                                  context,
                                  () => app.mutate((r) => r.addSet(item.id)),
                                );
                                await _load();
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ],
                ),
        ),
        KSection(
          title: 'Session notes',
          child: KTextField(
            controller: notes,
            label: 'Notes (optional)',
            lines: 3,
            onChanged: (value) {
              noteDebounce?.cancel();
              noteDebounce = Timer(const Duration(milliseconds: 600), () {
                if (!mounted) return;
                performAction(
                  context,
                  () => ref
                      .read(appControllerProvider)
                      .mutate(
                        (r) => r.setSessionNotes(widget.sessionId, value),
                      ),
                );
              });
            },
          ),
        ),
        const SizedBox(height: 20),
        KButton(
          label: 'FINISH WORKOUT',
          icon: Icons.check_circle_outline,
          onPressed: app.working ? null : _finish,
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
