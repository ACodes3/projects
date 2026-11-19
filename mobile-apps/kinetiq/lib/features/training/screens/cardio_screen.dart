import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_choice.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';
import '../../../shared/widgets/k_text_field.dart';

class CardioScreen extends ConsumerWidget {
  const CardioScreen({super.key});
  Future<void> _add(BuildContext context, WidgetRef ref) async {
    var activity = 'Walking';
    final minutes = TextEditingController(text: '30');
    final distance = TextEditingController();
    final notes = TextEditingController();
    try {
      final result =
          await showDialog<
            ({String activity, int seconds, double? meters, String notes})
          >(
            context: context,
            builder: (dialogContext) => StatefulBuilder(
              builder: (context, setLocal) => AlertDialog(
                title: const Text('Log cardio'),
                content: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 7,
                        children: [
                          for (final value in [
                            'Walking',
                            'Running',
                            'Cycling',
                            'Rowing',
                            'Elliptical',
                            'Other',
                          ])
                            KChoice(
                              label: value,
                              selected: activity == value,
                              onTap: () => setLocal(() => activity = value),
                            ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      KNumberField(
                        controller: minutes,
                        label: 'Duration (minutes)',
                        decimal: false,
                      ),
                      const SizedBox(height: 12),
                      KNumberField(
                        controller: distance,
                        label: 'Distance in km (optional)',
                      ),
                      const SizedBox(height: 12),
                      KTextField(
                        controller: notes,
                        label: 'Notes (optional)',
                        lines: 2,
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
                      activity: activity,
                      seconds: (int.tryParse(minutes.text) ?? 0) * 60,
                      meters: double.tryParse(distance.text) == null
                          ? null
                          : double.parse(distance.text) * 1000,
                      notes: notes.text,
                    )),
                  ),
                ],
              ),
            ),
          );
      if (result != null && context.mounted) {
        await performAction(
          context,
          () => ref
              .read(appControllerProvider)
              .mutate(
                (r) => r.logCardio(
                  activity: result.activity,
                  seconds: result.seconds,
                  meters: result.meters,
                  notes: result.notes,
                ),
              ),
        );
      }
    } finally {
      minutes.dispose();
      distance.dispose();
      notes.dispose();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    return KScreen(
      title: 'Cardio log',
      eyebrow: 'TRAIN / CARDIO',
      subtitle:
          'Log manually recorded cardio; GPS and wearables are not connected.',
      back: true,
      children: [
        KButton(
          label: 'LOG ACTIVITY',
          icon: Icons.add,
          onPressed: () => _add(context, ref),
        ),
        KSection(
          title: 'Activity history',
          child: app.cardio.isEmpty
              ? const KEmptyState(
                  title: 'No cardio logged',
                  message:
                      'Log an activity to see your duration and distance here.',
                )
              : Column(
                  children: [
                    for (final item in app.cardio) ...[
                      KListTile(
                        title: item.activity,
                        subtitle:
                            '${dayLabel(item.occurredAt.toLocal())} · ${durationLabel(Duration(seconds: item.seconds))}${item.meters == null ? '' : ' · ${displayDistance(item.meters!, app.imperial)}'}',
                        icon: Icons.directions_run,
                        trailing: IconButton(
                          tooltip: 'Delete activity',
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () async {
                            if (await confirmAction(
                                  context,
                                  title: 'Delete activity?',
                                  message: 'Remove this logged activity?',
                                  destructive: true,
                                ) &&
                                context.mounted) {
                              await performAction(
                                context,
                                () =>
                                    app.mutate((r) => r.deleteCardio(item.id)),
                              );
                            }
                          },
                        ),
                        onTap: () => feedback(
                          context,
                          item.notes.isEmpty ? 'Manual cardio log' : item.notes,
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
