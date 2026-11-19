import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/domain/metrics.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';
import '../../../shared/widgets/k_stat.dart';
import '../widgets/trend_chart.dart';

class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});
  @override
  ConsumerState<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends ConsumerState<ProgressScreen> {
  double volume = 0;
  List<Map<String, dynamic>> records = [];
  bool loaded = false;
  int? observedCount;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _load();
  }

  Future<void> _load() async {
    final repo = ref.read(repositoryProvider);
    try {
      final sum = await repo.db.query(
        '''SELECT COALESCE(SUM(ss.weight_kg * ss.reps),0) AS total
         FROM session_sets ss JOIN session_exercises se ON se.id=ss.session_exercise_id
         JOIN sessions s ON s.id=se.session_id
         WHERE s.status='completed' AND ss.completed=1 AND ss.weight_kg>=0 AND ss.reps>0''',
      );
      final prs = await repo.db.query(
        '''SELECT se.name_snapshot AS name, MAX(ss.weight_kg) AS best_kg
        FROM session_sets ss JOIN session_exercises se ON se.id=ss.session_exercise_id
        JOIN sessions s ON s.id=se.session_id
        WHERE s.status='completed' AND ss.completed=1 AND ss.weight_kg>=0 AND ss.reps>0
        GROUP BY se.name_snapshot ORDER BY best_kg DESC LIMIT 8''',
      );
      if (mounted) {
        setState(() {
          volume = (sum.first['total'] as num?)?.toDouble() ?? 0;
          records = prs;
          loaded = true;
        });
      }
    } catch (_) {
      if (mounted) setState(() => loaded = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final completed = app.sessions
        .where((x) => x.status == 'completed')
        .toList();
    if (observedCount != completed.length) {
      observedCount = completed.length;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _load();
      });
    }
    final now = DateTime.now();
    final weeks = List.generate(
      6,
      (index) =>
          startOfLocalWeek(now).subtract(Duration(days: 7 * (5 - index))),
    );
    final weekly = weeks.map((w) {
      final end = w.add(const Duration(days: 7));
      return completed
          .where(
            (s) =>
                !s.startedAt.toLocal().isBefore(w) &&
                s.startedAt.toLocal().isBefore(end),
          )
          .length
          .toDouble();
    }).toList();
    final labels = weeks.map((d) => '${d.day}/${d.month}').toList();
    final cardioMinutes =
        app.cardio.fold<int>(0, (s, x) => s + x.seconds) ~/ 60;
    return KScreen(
      title: 'Your progress',
      eyebrow: 'EVOLVE / INSIGHTS',
      subtitle: 'Only numbers derived from completed, saved records.',
      children: [
        Row(
          children: [
            Expanded(
              child: KStat(
                label: 'Workouts this week',
                value: '${workoutsThisWeek(completed, now)}',
                icon: Icons.fitness_center,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: KStat(
                label: 'Completed total',
                value: '${completed.length}',
                icon: Icons.done_all,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: KStat(
                label: 'Weighted volume',
                value: loaded ? numberLabel(volume, 0) : '…',
                icon: Icons.monitor_weight_outlined,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: KStat(
                label: 'Cardio minutes',
                value: '$cardioMinutes',
                icon: Icons.directions_run,
              ),
            ),
          ],
        ),
        KSection(
          title: 'Consistency',
          subtitle: 'Completed workouts per calendar week (Monday–Sunday)',
          child: completed.isEmpty
              ? const KEmptyState(
                  title: 'No workout trend yet',
                  message: 'Finish a workout to start building your real progress chart.',
                  icon: Icons.show_chart,
                )
              : TrendChart(
                  values: weekly,
                  labels: labels,
                  title: 'Workouts per week',
                  unit: 'workouts',
                ),
        ),
        KSection(
          title: 'Strength records',
          subtitle: 'Highest completed load per exercise; not estimated 1RM',
          child: records.isEmpty
              ? const KEmptyState(
                  title: 'No strength records yet',
                  message: 'Complete sets with valid weights and reps to see records here.',
                )
              : Column(
                  children: [
                    for (final record in records) ...[
                      KListTile(
                        title: record['name'] as String,
                        subtitle:
                            '${numberLabel((record['best_kg'] as num).toDouble(), 1)} kg',
                        icon: Icons.emoji_events_outlined,
                        onTap: () => {},
                      ),
                      const SizedBox(height: 9),
                    ],
                  ],
                ),
        ),
        KSection(
          title: 'Review history',
          child: KButton(
            label: 'WORKOUT HISTORY',
            icon: Icons.history,
            style: KButtonStyle.secondary,
            onPressed: () => context.push('/history'),
          ),
        ),
        const SizedBox(height: 10),
        KButton(
          label: 'LOG CARDIO',
          icon: Icons.directions_run,
          style: KButtonStyle.secondary,
          onPressed: () => context.push('/cardio'),
        ),
      ],
    );
  }
}
