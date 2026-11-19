import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/domain/models.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_dialog.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';
import '../widgets/exercise_picker.dart';
import '../widgets/routine_exercise_editor.dart';

class RoutineEditorScreen extends ConsumerStatefulWidget {
  const RoutineEditorScreen({super.key, required this.routineId});
  final String routineId;
  @override
  ConsumerState<RoutineEditorScreen> createState() =>
      _RoutineEditorScreenState();
}

class _RoutineEditorScreenState extends ConsumerState<RoutineEditorScreen> {
  List<RoutineExercise>? items;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await ref
        .read(repositoryProvider)
        .routineExercises(widget.routineId);
    if (mounted) setState(() => items = list);
  }

  Future<void> _add() async {
    final selected = await showExercisePicker(
      context,
      exercises: ref.read(appControllerProvider).exercises,
    );
    if (selected == null || !mounted) return;
    await performAction(
      context,
      () => ref
          .read(appControllerProvider)
          .mutate((r) => r.addToRoutine(widget.routineId, selected)),
    );
    await _load();
  }

  Future<void> _edit(RoutineExercise item) async {
    final values = await showRoutineExerciseEditor(context, item);
    if (values == null || !mounted) return;
    await performAction(
      context,
      () => ref
          .read(appControllerProvider)
          .mutate(
            (r) => r.updateRoutineExercise(
              item,
              sets: values.sets,
              reps: values.reps,
              weightKg: values.weight,
              restSeconds: values.restSeconds,
              notes: values.notes,
            ),
          ),
    );
    await _load();
  }

  Future<void> _rename(Routine item) async {
    final values = await showNameDialog(
      context,
      heading: 'Edit routine',
      initialTitle: item.title,
      initialNotes: item.notes,
    );
    if (values == null || !mounted) return;
    await performAction(
      context,
      () => ref
          .read(appControllerProvider)
          .mutate(
            (r) => r.renameRoutine(item.id, values.title, notes: values.notes),
          ),
    );
  }

  Future<void> _start() async {
    final app = ref.read(appControllerProvider);
    final id = await performAction(
      context,
      () => app.mutate((r) => r.startSession(routineId: widget.routineId)),
    );
    if (mounted && id != null) context.push('/workout/$id');
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final routine = app.routines
        .where((e) => e.id == widget.routineId)
        .firstOrNull;
    if (routine == null) {
      return const KScreen(
        title: 'Routine unavailable',
        back: true,
        children: [
          KEmptyState(
            title: 'Not found',
            message: 'This routine may have been archived.',
          ),
        ],
      );
    }
    return KScreen(
      title: routine.title,
      eyebrow: 'TRAIN / ROUTINE',
      subtitle: routine.notes.isEmpty
          ? 'Edit exercise targets, order, and rest.'
          : routine.notes,
      back: true,
      action: IconButton(
        tooltip: 'Edit name',
        icon: const Icon(Icons.edit_outlined),
        onPressed: () => _rename(routine),
      ),
      children: [
        KButton(
          label: 'START THIS WORKOUT',
          icon: Icons.play_arrow,
          onPressed: _start,
        ),
        KSection(
          title: 'Exercises',
          trailing: TextButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Add'),
            onPressed: _add,
          ),
          child: items == null
              ? const Center(child: CircularProgressIndicator())
              : items!.isEmpty
              ? KEmptyState(
                  title: 'No exercises yet',
                  message: 'Add exercises to build your reusable workout.',
                  actionLabel: 'Add exercise',
                  onAction: _add,
                )
              : ReorderableListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: items!.length,
                  onReorderItem: (oldIndex, newIndex) async {
                    await performAction(
                      context,
                      () => app.mutate(
                        (r) => r.moveRoutineExercise(
                          widget.routineId,
                          oldIndex,
                          newIndex,
                        ),
                      ),
                    );
                    await _load();
                  },
                  itemBuilder: (context, index) {
                    final item = items![index];
                    return Padding(
                      key: ValueKey(item.id),
                      padding: const EdgeInsets.only(bottom: 10),
                      child: KCard(
                        child: Row(
                          children: [
                            ReorderableDragStartListener(
                              index: index,
                              child: const Padding(
                                padding: EdgeInsets.all(8),
                                child: Icon(Icons.drag_handle),
                              ),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium,
                                  ),
                                  const SizedBox(height: 5),
                                  Text(
                                    '${item.targetSets} sets · ${item.targetReps ?? '—'} reps · ${item.restSeconds}s rest',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.tune),
                              tooltip: 'Configure exercise',
                              onPressed: () => _edit(item),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close),
                              tooltip: 'Remove exercise',
                              onPressed: () async {
                                await performAction(
                                  context,
                                  () => app.mutate(
                                    (r) => r.removeRoutineExercise(
                                      item.id,
                                      widget.routineId,
                                    ),
                                  ),
                                );
                                await _load();
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
        const SizedBox(height: 15),
        KListTile(
          title: 'Archive routine',
          subtitle: 'Keeps completed workout snapshots intact',
          icon: Icons.archive_outlined,
          onTap: () async {
            final confirmed = await confirmAction(
              context,
              title: 'Archive this routine?',
              message: 'Completed sessions remain in History.',
              confirm: 'Archive',
              destructive: true,
            );

            if (!context.mounted || !confirmed) return;

            await performAction(
              context,
              () => app.mutate((r) => r.archiveRoutine(widget.routineId)),
            );

            if (!context.mounted) return;

            context.pop();
          },
        ),
      ],
    );
  }
}
