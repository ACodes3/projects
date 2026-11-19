import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/models.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_dialog.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';

class ProgramsScreen extends ConsumerWidget {
  const ProgramsScreen({super.key});
  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final values = await showNameDialog(
      context,
      heading: 'New training program',
      titleLabel: 'Program name',
      notesLabel: 'Goal (optional)',
    );
    if (values == null || !context.mounted) return;
    final weeks = TextEditingController(text: '4');
    try {
      final count = await showDialog<int>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Program duration'),
          content: KNumberField(
            controller: weeks,
            label: 'Number of weeks',
            decimal: false,
          ),
          actions: [
            KButton(
              label: 'Create',
              expanded: false,
              onPressed: () =>
                  Navigator.pop(dialogContext, int.tryParse(weeks.text)),
            ),
          ],
        ),
      );
      if (count != null && context.mounted) {
        await performAction(
          context,
          () => ref
              .read(appControllerProvider)
              .mutate(
                (r) => r.createProgram(
                  values.title,
                  goal: values.notes,
                  weeks: count,
                ),
              ),
        );
      }
    } finally {
      weeks.dispose();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    return KScreen(
      title: 'Training programs',
      eyebrow: 'TRAIN / PLAN',
      subtitle: 'Group routines into a repeatable weekly structure. No automatic prescriptions.',
      back: true,
      children: [
        KButton(
          label: 'NEW PROGRAM',
          icon: Icons.add,
          onPressed: () => _create(context, ref),
        ),
        KSection(
          title: 'Your programs',
          child: app.programs.isEmpty
              ? const KEmptyState(
                  title: 'No programs yet',
                  message: 'Create a program to organize your routine days.',
                )
              : Column(
                  children: [
                    for (final program in app.programs) ...[
                      KListTile(
                        title: program.name,
                        subtitle:
                            '${program.weeks} weeks · ${program.goal.isEmpty ? 'Custom goal' : program.goal}',
                        icon: Icons.calendar_month,
                        onTap: () => showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (_) => _ProgramEditor(program: program),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline),
                          tooltip: 'Delete program',
                          onPressed: () async {
                            if (await confirmAction(
                                  context,
                                  title: 'Delete program?',
                                  message: 'Existing routines and workout history stay intact.',
                                  destructive: true,
                                ) &&
                                context.mounted) {
                              await performAction(
                                context,
                                () => app.mutate(
                                  (r) => r.deleteProgram(program.id),
                                ),
                              );
                            }
                          },
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
        ),
      ],
    );
  }
}

class _ProgramEditor extends ConsumerStatefulWidget {
  const _ProgramEditor({required this.program});
  final Program program;
  @override
  ConsumerState<_ProgramEditor> createState() => _ProgramEditorState();
}

class _ProgramEditorState extends ConsumerState<_ProgramEditor> {
  List<Map<String, dynamic>> days = [];
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final result = await ref
        .read(repositoryProvider)
        .programDays(widget.program.id);
    if (mounted) setState(() => days = result);
  }

  @override
  Widget build(BuildContext context) {
    final routines = ref.watch(appControllerProvider).routines;
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.program.name,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text('Tap a day to assign a saved routine.'),
            const SizedBox(height: 16),
            for (var i = 1; i <= 7; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: KListTile(
                  title: weekdays[i - 1],
                  subtitle:
                      days
                              .where((d) => d['day_number'] == i)
                              .firstOrNull?['routine_title']
                          as String? ??
                      'Rest / unassigned',
                  icon: Icons.event,
                  onTap: () async {
                    final value = await showDialog<String>(
                      context: context,
                      builder: (dialogContext) => SimpleDialog(
                        title: Text(weekdays[i - 1]),
                        children: [
                          SimpleDialogOption(
                            onPressed: () => Navigator.pop(dialogContext, ''),
                            child: const Text('Rest / unassigned'),
                          ),
                          for (final routine in routines)
                            SimpleDialogOption(
                              onPressed: () =>
                                  Navigator.pop(dialogContext, routine.id),
                              child: Text(routine.title),
                            ),
                        ],
                      ),
                    );
                    if (value == null || !context.mounted) return;
                    await performAction(
                      context,
                      () => ref
                          .read(appControllerProvider)
                          .mutate(
                            (r) => r.assignProgramDay(
                              widget.program.id,
                              i,
                              value.isEmpty ? null : value,
                            ),
                          ),
                    );
                    await _load();
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
