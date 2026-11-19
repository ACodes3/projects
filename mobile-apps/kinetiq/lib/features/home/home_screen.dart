import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/domain/metrics.dart';
import '../../core/state/providers.dart';
import '../../core/theme/kinetiq_theme.dart';
import '../../core/utils/action.dart';
import '../../core/utils/formatters.dart';
import '../../shared/widgets/k_button.dart';
import '../../shared/widgets/k_card.dart';
import '../../shared/widgets/k_empty_state.dart';
import '../../shared/widgets/k_list_tile.dart';
import '../../shared/widgets/k_progress_bar.dart';
import '../../shared/widgets/k_screen.dart';
import '../../shared/widgets/k_section.dart';
import '../../shared/widgets/k_stat.dart';
import '../nutrition/widgets/macro_summary.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});
  Future<void> _start(
    BuildContext context,
    WidgetRef ref,
    String? routine,
  ) async {
    final id = await performAction(
      context,
      () => ref
          .read(appControllerProvider)
          .mutate((r) => r.startSession(routineId: routine)),
    );
    if (context.mounted && id != null) context.push('/workout/$id');
  }

  Future<void> _starter(BuildContext context, WidgetRef ref) async {
    final app = ref.read(appControllerProvider);
    final id = await performAction(
      context,
      () => app.mutate((r) async {
        final created = await r.createRoutine(
          'Full Body A',
          notes: 'Example only · editable beginner starting point',
        );
        for (final name in [
          'Barbell Squat',
          'Bench Press',
          'Lat Pulldown',
          'Plank',
        ]) {
          final exercise = (await r.exercises())
              .where((e) => e.name == name)
              .firstOrNull;
          if (exercise != null) await r.addToRoutine(created, exercise);
        }
        return created;
      }),
    );
    if (context.mounted && id != null) context.push('/routines/$id');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    final account = ref.watch(accountControllerProvider);
    final today = DateTime.now();
    final finished = app.sessions
        .where((x) => x.status == 'completed')
        .toList();
    final thisWeek = workoutsThisWeek(finished, today);
    final todayMeals = app.meals
        .where((e) => isSameLocalDay(e.occurredAt, today))
        .toList();
    final todayWater = app.water
        .where((e) => isSameLocalDay(e.occurredAt, today))
        .fold<int>(0, (s, w) => s + w.ml);
    final showNutrition = app.nutritionMode != 'Not now';
    return KScreen(
      title: 'Make today count.',
      eyebrow: 'K / KINETIQ',
      subtitle: 'Train. Fuel. Evolve. · ${account.accountLabel}',
      action: IconButton(
        onPressed: () => context.push('/profile'),
        icon: const Icon(Icons.person_outline),
        tooltip: 'Profile',
      ),
      children: [
        if (app.active != null)
          KCard(
            borderColor: KColors.lime,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'YOUR WORKOUT IS STILL ACTIVE',
                  style: TextStyle(
                    color: KColors.lime,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 9),
                Text(
                  app.active!.name,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                KButton(
                  label: 'RESUME SESSION',
                  icon: Icons.play_arrow,
                  onPressed: () => context.push('/workout/${app.active!.id}'),
                ),
              ],
            ),
          )
        else
          KCard(
            background: KColors.surfaceRaised,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'READY WHEN YOU ARE',
                  style: TextStyle(
                    color: KColors.lime,
                    fontSize: 11,
                    letterSpacing: 1.3,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Start something strong.',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 9),
                const Text(
                  'Your next session is one tap away.',
                  style: TextStyle(color: KColors.muted),
                ),
                const SizedBox(height: 17),
                KButton(
                  label: 'START EMPTY WORKOUT',
                  icon: Icons.play_arrow,
                  onPressed: () => _start(context, ref, null),
                ),
                if (app.routines.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  KButton(
                    label: 'START ${app.routines.first.title.toUpperCase()}',
                    style: KButtonStyle.secondary,
                    onPressed: () =>
                        _start(context, ref, app.routines.first.id),
                  ),
                ],
              ],
            ),
          ),
        KSection(
          title: 'Training week',
          subtitle: 'Real completed workouts, not scheduled assumptions',
          child: KCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '$thisWeek workouts completed',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    Text(
                      'Goal ${app.daysPerWeek}',
                      style: const TextStyle(
                        color: KColors.muted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 17),
                KProgressBar(
                  value: app.daysPerWeek == 0 ? 0 : thisWeek / app.daysPerWeek,
                ),
              ],
            ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: KStat(
                label: 'Lifetime sessions',
                value: '${finished.length}',
                icon: Icons.verified_outlined,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: KStat(
                label: 'Saved routines',
                value: account.signedIn
                    ? '${app.routines.length}'
                    : '${app.routines.length} / 3',
                icon: Icons.view_list_outlined,
              ),
            ),
          ],
        ),
        if (app.routines.isEmpty)
          KSection(
            title: 'A starting point',
            child: KEmptyState(
              title: 'Try a sample full-body routine',
              message: 'Creates an editable four-exercise routine. Nothing is logged or marked completed automatically.',
              icon: Icons.tips_and_updates_outlined,
              actionLabel: 'Create sample routine',
              onAction: () => _starter(context, ref),
            ),
          ),
        if (showNutrition)
          KSection(
            title: 'Nutrition today',
            trailing: TextButton(
              onPressed: () => context.go('/nutrition'),
              child: const Text('Open diary'),
            ),
            child: Column(
              children: [
                if (app.nutritionMode != 'Hydration only')
                  MacroSummary(
                    totals: MacroTotals.fromMeals(todayMeals),
                    hasMeals: todayMeals.isNotEmpty,
                  ),
                const SizedBox(height: 10),
                KListTile(
                  title: 'Water logged',
                  subtitle: '$todayWater mL today',
                  icon: Icons.water_drop_outlined,
                  onTap: () => context.go('/nutrition'),
                ),
              ],
            ),
          ),
        KSection(
          title: 'Recent activity',
          child: finished.isEmpty
              ? const KEmptyState(
                  title: 'Your journey starts with a log',
                  message: 'Completed sessions and their real results will show up here.',
                  icon: Icons.history,
                )
              : KListTile(
                  title: finished.first.name,
                  subtitle:
                      '${dayLabel(finished.first.startedAt.toLocal())} · ${durationLabel(finished.first.duration)}',
                  icon: Icons.check_circle_outline,
                  onTap: () => context.push('/session/${finished.first.id}'),
                ),
        ),
        if (!account.signedIn) ...[
          const SizedBox(height: 14),
          KListTile(
            title: 'Protect your progress with a free account',
            subtitle: 'Keep guest data and review optional cloud backup',
            icon: Icons.cloud_outlined,
            onTap: () => context.push('/auth/signup'),
          ),
        ] else ...[
          const SizedBox(height: 14),
          KListTile(
            title: account.accountLabel,
            subtitle: 'Review backup status — saved only after server confirms',
            icon: Icons.manage_accounts_outlined,
            onTap: () => context.push('/account'),
          ),
        ],
      ],
    );
  }
}
