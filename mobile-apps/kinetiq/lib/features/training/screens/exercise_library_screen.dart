import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/models.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_choice.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_text_field.dart';
import '../widgets/exercise_tile.dart';

class ExerciseLibraryScreen extends ConsumerStatefulWidget {
  const ExerciseLibraryScreen({super.key});
  @override
  ConsumerState<ExerciseLibraryScreen> createState() =>
      _ExerciseLibraryScreenState();
}

class _ExerciseLibraryScreenState extends ConsumerState<ExerciseLibraryScreen> {
  final search = TextEditingController();
  String filter = 'All';
  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  Future<void> edit(Exercise? current) async {
    final name = TextEditingController(text: current?.name ?? '');
    var category = current?.category ?? 'strength',
        group = current?.group ?? 'Full body',
        equipment = current?.equipment ?? 'Bodyweight',
        mode = current?.mode ?? 'weight_reps';
    try {
      final save =
          await showDialog<
            ({
              String name,
              String category,
              String group,
              String equipment,
              String mode,
            })
          >(
            context: context,
            builder: (dialogContext) => StatefulBuilder(
              builder: (context, setLocal) => AlertDialog(
                title: Text(
                  current == null ? 'Create exercise' : 'Edit exercise',
                ),
                content: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      KTextField(controller: name, label: 'Exercise name'),
                      const SizedBox(height: 16),
                      const Text('Tracking mode'),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 7,
                        children: [
                          for (final v in [
                            'weight_reps',
                            'reps',
                            'duration',
                            'distance',
                          ])
                            KChoice(
                              label: v.replaceAll('_', ' + '),
                              selected: mode == v,
                              onTap: () => setLocal(() => mode = v),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text('Equipment'),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 7,
                        children: [
                          for (final v in [
                            'Bodyweight',
                            'Dumbbells',
                            'Barbell',
                            'Cable',
                            'Machine',
                            'Bands',
                            'Other',
                          ])
                            KChoice(
                              label: v,
                              selected: equipment == v,
                              onTap: () => setLocal(() => equipment = v),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text('Muscle group'),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 7,
                        children: [
                          for (final v in [
                            'Full body',
                            'Legs',
                            'Back',
                            'Chest',
                            'Shoulders',
                            'Arms',
                            'Core',
                            'Glutes',
                          ])
                            KChoice(
                              label: v,
                              selected: group == v,
                              onTap: () => setLocal(() => group = v),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 7,
                        children: [
                          for (final v in ['strength', 'cardio'])
                            KChoice(
                              label: v,
                              selected: category == v,
                              onTap: () => setLocal(() => category = v),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    child: const Text('Cancel'),
                  ),
                  KButton(
                    label: 'Save',
                    expanded: false,
                    onPressed: () => Navigator.pop(dialogContext, (
                      name: name.text,
                      category: category,
                      group: group,
                      equipment: equipment,
                      mode: mode,
                    )),
                  ),
                ],
              ),
            ),
          );
      if (save != null && mounted) {
        await performAction(
          context,
          () => ref
              .read(appControllerProvider)
              .mutate(
                (r) => r.saveExercise(
                  id: current?.id,
                  name: save.name,
                  category: save.category,
                  group: save.group,
                  equipment: save.equipment,
                  mode: save.mode,
                ),
              ),
        );
      }
    } finally {
      name.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final items = app.exercises
        .where(
          (x) =>
              (filter == 'All' ||
                  filter == 'Favorites' && x.favorite ||
                  filter == x.category) &&
              x.name.toLowerCase().contains(search.text.toLowerCase()),
        )
        .toList();
    return KScreen(
      title: 'Exercise library',
      eyebrow: 'TRAIN / CATALOG',
      back: true,
      action: IconButton(
        onPressed: () => edit(null),
        icon: const Icon(Icons.add),
        tooltip: 'Create custom exercise',
      ),
      children: [
        KTextField(
          controller: search,
          label: 'Search exercise',
          prefix: const Icon(Icons.search),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 14),
        Wrap(
          spacing: 9,
          children: [
            for (final value in ['All', 'Favorites', 'strength', 'cardio'])
              KChoice(
                label: value,
                selected: filter == value,
                onTap: () => setState(() => filter = value),
              ),
          ],
        ),
        const SizedBox(height: 17),
        if (items.isEmpty)
          const KEmptyState(
            title: 'No matching exercises',
            message: 'Try another search or create your own exercise.',
          ),
        for (final item in items) ...[
          ExerciseTile(
            exercise: item,
            onTap: () => item.custom
                ? edit(item)
                : feedback(
                    context,
                    'Built-in exercise · ${item.mode.replaceAll('_', ' + ')}',
                  ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) async {
                if (value == 'favorite') {
                  await performAction(
                    context,
                    () => app.mutate((r) => r.toggleExerciseFavorite(item)),
                  );
                  return;
                }

                if (value == 'edit') {
                  await edit(item);
                  return;
                }

                if (value == 'archive') {
                  if (!context.mounted) return;

                  final confirmed = await confirmAction(
                    context,
                    title: 'Archive exercise?',
                    message: 'Past workout snapshots will remain.',
                    destructive: true,
                  );

                  if (!context.mounted || !confirmed) return;

                  await performAction(
                    context,
                    () => app.mutate((r) => r.archiveExercise(item)),
                  );
                }
              },
              itemBuilder: (_) => [
                PopupMenuItem(
                  value: 'favorite',
                  child: Text(item.favorite ? 'Unfavorite' : 'Favorite'),
                ),
                if (item.custom)
                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
                if (item.custom)
                  const PopupMenuItem(value: 'archive', child: Text('Archive')),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}
