import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/domain/metrics.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';
import '../widgets/hydration_card.dart';
import '../widgets/macro_summary.dart';
import '../widgets/meal_card.dart';

class NutritionScreen extends ConsumerStatefulWidget {
  const NutritionScreen({super.key});
  @override
  ConsumerState<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends ConsumerState<NutritionScreen> {
  DateTime day = DateTime.now();
  Future<void> _customWater() async {
    final controller = TextEditingController(text: '250');
    try {
      final result = await showDialog<int>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Add water'),
          content: KNumberField(
            controller: controller,
            label: 'Milliliters',
            decimal: false,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            KButton(
              label: 'Log',
              expanded: false,
              onPressed: () =>
                  Navigator.pop(dialogContext, int.tryParse(controller.text)),
            ),
          ],
        ),
      );
      if (result != null && mounted) await _addWater(result);
    } finally {
      controller.dispose();
    }
  }

  Future<void> _addWater(int ml) async {
    await performAction(
      context,
      () => ref
          .read(appControllerProvider)
          .mutate((r) => r.addWater(ml, day: day)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final items = app.meals
        .where((m) => isSameLocalDay(m.occurredAt, day))
        .toList();
    final water = app.water
        .where((w) => isSameLocalDay(w.occurredAt, day))
        .fold<int>(0, (s, w) => s + w.ml);
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    final mode = app.nutritionMode;
    final showDiary = mode != 'Hydration only' && mode != 'Not now';
    return KScreen(
      title: 'Nutrition studio',
      eyebrow: 'FUEL / TRACK',
      subtitle:
          'Log meals and hydration with values you control. No AI estimates.',
      action: IconButton(
        tooltip: 'Add food',
        icon: const Icon(Icons.add_circle_outline),
        onPressed: () => context.push(
          '/foods?day=${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}',
        ),
      ),
      children: [
        KCard(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                onPressed: () =>
                    setState(() => day = day.subtract(const Duration(days: 1))),
                icon: const Icon(Icons.chevron_left),
              ),
              Column(
                children: [
                  Text(
                    dayLabel(day),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(
                    isSameLocalDay(day, DateTime.now())
                        ? 'TODAY'
                        : 'SELECTED DATE',
                    style: const TextStyle(
                      color: KColors.muted,
                      fontSize: 10,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
              IconButton(
                onPressed: () =>
                    setState(() => day = day.add(const Duration(days: 1))),
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
        ),
        if (showDiary) ...[
          const SizedBox(height: 14),
          MacroSummary(
            label: isSameLocalDay(day, DateTime.now())
                ? 'TODAY AT A GLANCE'
                : 'SELECTED DAY',
            totals: MacroTotals.fromMeals(items),
            hasMeals: items.isNotEmpty,
          ),
          KSection(
            title: 'Food diary',
            trailing: TextButton.icon(
              icon: const Icon(Icons.add),
              label: const Text('Log food'),
              onPressed: () => context.push(
                '/foods?day=${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}',
              ),
            ),
            child: Column(
              children: [
                for (final type in mealTypes) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            type.toUpperCase(),
                            style: const TextStyle(
                              color: KColors.muted,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),
                        Text(
                          '${items.where((m) => m.meal == type).length} entries',
                          style: const TextStyle(
                            color: KColors.muted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (items.where((m) => m.meal == type).isEmpty)
                    const KCard(
                      child: Text(
                        'Nothing logged yet',
                        style: TextStyle(color: KColors.muted, fontSize: 12),
                      ),
                    ),
                  for (final meal in items.where((m) => m.meal == type)) ...[
                    MealCard(
                      meal: meal,
                      onTap: () async {
                        final grams = TextEditingController(
                          text: '${meal.grams}',
                        );
                        var category = meal.meal;
                        try {
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (dialogContext) => StatefulBuilder(
                              builder: (context, update) => AlertDialog(
                                title: const Text('Edit logged food'),
                                content: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    KNumberField(
                                      controller: grams,
                                      label: 'Portion in grams',
                                    ),
                                    const SizedBox(height: 14),
                                    DropdownButtonFormField<String>(
                                      initialValue: category,
                                      items:
                                          const [
                                                'Breakfast',
                                                'Lunch',
                                                'Dinner',
                                                'Snacks',
                                              ]
                                              .map(
                                                (v) => DropdownMenuItem(
                                                  value: v,
                                                  child: Text(v),
                                                ),
                                              )
                                              .toList(),
                                      onChanged: (v) => update(
                                        () => category = v ?? category,
                                      ),
                                    ),
                                  ],
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(dialogContext, false),
                                    child: const Text('Cancel'),
                                  ),
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(dialogContext, true),
                                    child: const Text('Save'),
                                  ),
                                ],
                              ),
                            ),
                          );
                          final amount = double.tryParse(grams.text);
                          if (confirmed == true &&
                              amount != null &&
                              context.mounted) {
                            await performAction(
                              context,
                              () => app.mutate(
                                (r) => r.updateMealEntry(
                                  meal.id,
                                  category: category,
                                  grams: amount,
                                ),
                              ),
                            );
                          }
                        } finally {
                          grams.dispose();
                        }
                      },
                      onDelete: () async {
                        if (await confirmAction(
                              context,
                              title: 'Remove meal?',
                              message: 'Delete this entry from the diary?',
                              destructive: true,
                            ) &&
                            context.mounted) {
                          await performAction(
                            context,
                            () => app.mutate((r) => r.deleteMeal(meal.id)),
                          );
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                  ],
                ],
              ],
            ),
          ),
          KSection(
            title: 'Your foods',
            child: KButton(
              label: 'OPEN FOOD LIBRARY',
              icon: Icons.search,
              onPressed: () => context.push(
                '/foods?day=${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}',
              ),
              style: KButtonStyle.secondary,
            ),
          ),
          KSection(
            title: 'Reusable meals',
            child: KButton(
              label: 'SAVED MEALS',
              icon: Icons.bookmark_outline,
              onPressed: () => context.push('/saved-meals'),
              style: KButtonStyle.secondary,
            ),
          ),
          KSection(
            title: 'Recipes',
            child: KButton(
              label: 'OPEN RECIPE BUILDER',
              icon: Icons.menu_book_outlined,
              onPressed: () => context.push('/recipes'),
              style: KButtonStyle.secondary,
            ),
          ),
          KSection(
            title: 'Targets',
            child: KButton(
              label: 'EDIT OPTIONAL TARGETS',
              icon: Icons.tune,
              onPressed: () => context.push('/nutrition-goals'),
              style: KButtonStyle.secondary,
            ),
          ),
          KButton(
            label: 'COPY YESTERDAY’S FOOD',
            style: KButtonStyle.ghost,
            onPressed: () async {
              if (await confirmAction(
                    context,
                    title: 'Copy previous day?',
                    message: 'This will add a second copy of yesterday’s entries to the selected day.',
                    confirm: 'Copy',
                  ) &&
                  context.mounted) {
                await performAction(
                  context,
                  () => app.mutate(
                    (r) => r.copyMealsFromDay(
                      day.subtract(const Duration(days: 1)),
                      day,
                    ),
                  ),
                );
              }
            },
          ),
        ],
        KSection(
          title: 'Water log',
          child: HydrationCard(
            loggedMl: water,
            onAdd: (ml) => _addWater(ml),
            onCustom: _customWater,
          ),
        ),
        if (mode == 'Not now')
          const Padding(
            padding: EdgeInsets.only(top: 20),
            child: KEmptyState(
              title: 'Nutrition tracking is optional',
              message: 'Change your preference in Profile whenever you want to log meals.',
            ),
          ),
      ],
    );
  }
}
