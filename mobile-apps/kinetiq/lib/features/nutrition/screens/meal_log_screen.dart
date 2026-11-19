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
import '../../../shared/widgets/k_choice.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_screen.dart';

class MealLogScreen extends ConsumerStatefulWidget {
  const MealLogScreen({super.key, this.foodId, this.selectedDate});
  final String? foodId;
  final DateTime? selectedDate;
  @override
  ConsumerState<MealLogScreen> createState() => _MealLogScreenState();
}

class _MealLogScreenState extends ConsumerState<MealLogScreen> {
  String? selectedId;
  String meal = 'Breakfast';
  final grams = TextEditingController(text: '100');
  @override
  void initState() {
    super.initState();
    selectedId = widget.foodId;
  }

  @override
  void dispose() {
    grams.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final food = app.foods.where((e) => e.id == selectedId).firstOrNull;
    final portion = double.tryParse(grams.text) ?? 0;
    return KScreen(
      title: 'Log food',
      eyebrow: 'FUEL / DIARY',
      back: true,
      subtitle: 'Nutrients are multiplied from the saved per-100-g values.',
      children: [
        if (app.foods.isEmpty)
          KEmptyState(
            title: 'Create food first',
            message: 'Your library is empty.',
            actionLabel: 'Create food',
            onAction: () => context.push('/foods/edit'),
          )
        else
          KCard(
            child: DropdownButtonFormField<String>(
              initialValue: food?.id,
              decoration: const InputDecoration(labelText: 'Choose saved food'),
              items: [
                for (final entry in app.foods)
                  DropdownMenuItem(
                    value: entry.id,
                    child: Text(entry.name, overflow: TextOverflow.ellipsis),
                  ),
              ],
              onChanged: (value) => setState(() => selectedId = value),
            ),
          ),
        const SizedBox(height: 15),
        KNumberField(
          controller: grams,
          label: 'Portion weight',
          suffix: 'g',
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 19),
        const Text(
          'MEAL',
          style: TextStyle(
            color: KColors.lime,
            letterSpacing: 1.3,
            fontWeight: FontWeight.w800,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 9,
          children: [
            for (final value in ['Breakfast', 'Lunch', 'Dinner', 'Snacks'])
              KChoice(
                label: value,
                selected: meal == value,
                onTap: () => setState(() => meal = value),
              ),
          ],
        ),
        if (food != null) ...[
          const SizedBox(height: 24),
          KCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(food.name, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 9),
                Text(
                  '${numberLabel(scaledNutrient(food.kcal, portion))} kcal · ${numberLabel(scaledNutrient(food.protein, portion), 1)} g protein',
                  style: const TextStyle(color: KColors.muted),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Source: manually entered. Check food packaging before logging.',
                  style: TextStyle(color: KColors.muted, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          KButton(
            label: 'LOG THIS MEAL',
            icon: Icons.add_task,
            onPressed: () async {
              final saved = await performAction(context, () async {
                await app.mutate(
                  (r) => r.addMeal(
                    food,
                    grams: portion,
                    meal: meal,
                    day: widget.selectedDate,
                  ),
                );
                return true;
              });
              if (context.mounted && saved == true) {
                context.go('/nutrition');
              }
            },
          ),
        ],
      ],
    );
  }
}
