import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/models.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';
import '../../../shared/widgets/k_text_field.dart';

class SavedMealsScreen extends ConsumerStatefulWidget {
  const SavedMealsScreen({super.key});
  @override
  ConsumerState<SavedMealsScreen> createState() => _SavedMealsScreenState();
}

class _SavedMealsScreenState extends ConsumerState<SavedMealsScreen> {
  final name = TextEditingController(),
      grams = TextEditingController(text: '100');
  final portions = <({Food food, double grams})>[];
  String? foodId;
  String meal = 'Lunch';
  @override
  void dispose() {
    name.dispose();
    grams.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final chosen = app.foods.where((food) => food.id == foodId).firstOrNull;
    return KScreen(
      title: 'Saved meals',
      eyebrow: 'FUEL / REUSABLE MEALS',
      back: true,
      subtitle: 'Create reusable food combinations and log their exact recorded nutrient values.',
      children: [
        KSection(
          title: 'Build a saved meal',
          child: KCard(
            child: Column(
              children: [
                KTextField(controller: name, label: 'Meal name'),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: chosen?.id,
                  decoration: const InputDecoration(
                    labelText: 'Choose a saved food',
                  ),
                  items: app.foods
                      .map(
                        (food) => DropdownMenuItem(
                          value: food.id,
                          child: Text(food.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => foodId = value),
                ),
                const SizedBox(height: 10),
                KNumberField(controller: grams, label: 'Portion (grams)'),
                const SizedBox(height: 10),
                KButton(
                  label: 'ADD INGREDIENT',
                  style: KButtonStyle.secondary,
                  icon: Icons.add,
                  onPressed: chosen == null
                      ? null
                      : () {
                          final value = double.tryParse(grams.text);
                          if (value == null || value <= 0 || value > 20000) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Enter a valid amount in grams.'),
                              ),
                            );
                            return;
                          }
                          setState(
                            () => portions.add((food: chosen, grams: value)),
                          );
                        },
                ),
                for (final portion in portions)
                  ListTile(
                    title: Text(portion.food.name),
                    subtitle: Text('${portion.grams} grams'),
                    trailing: IconButton(
                      tooltip: 'Remove ingredient',
                      icon: const Icon(Icons.close),
                      onPressed: () => setState(() => portions.remove(portion)),
                    ),
                  ),
                const SizedBox(height: 12),
                KButton(
                  label: 'SAVE MEAL',
                  onPressed: portions.isEmpty
                      ? null
                      : () async {
                          final result = await performAction(
                            context,
                            () => app.mutate(
                              (r) => r.saveMealTemplate(name.text, portions),
                            ),
                          );
                          if (result != null && mounted) {
                            setState(() {
                              name.clear();
                              portions.clear();
                            });
                          }
                        },
                ),
              ],
            ),
          ),
        ),
        FutureBuilder<List<SavedMeal>>(
          future: ref.read(repositoryProvider).savedMeals(),
          builder: (context, snapshot) {
            final saved = snapshot.data ?? [];
            return KSection(
              title: 'Your saved meals',
              child: saved.isEmpty
                  ? const KEmptyState(
                      title: 'No saved meals yet',
                      message: 'Make a meal from your food library to log it again later.',
                    )
                  : Column(
                      children: [
                        for (final item in saved) ...[
                          KCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium,
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  children: [
                                    for (final type in [
                                      'Breakfast',
                                      'Lunch',
                                      'Dinner',
                                      'Snacks',
                                    ])
                                      ChoiceChip(
                                        label: Text(type),
                                        selected: meal == type,
                                        onSelected: (_) =>
                                            setState(() => meal = type),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                KButton(
                                  label: 'LOG TO $meal'.toUpperCase(),
                                  icon: Icons.add,
                                  onPressed: () async {
                                    await performAction(
                                      context,
                                      () => app.mutate(
                                        (r) => r.logSavedMeal(item.id, meal),
                                      ),
                                      success: 'Meal added to your diary.',
                                    );
                                  },
                                ),
                                const SizedBox(height: 8),
                                KButton(
                                  label: 'DELETE SAVED MEAL',
                                  style: KButtonStyle.ghost,
                                  onPressed: () async {
                                    if (await confirmAction(
                                          context,
                                          title: 'Delete saved meal?',
                                          message: 'Previously logged food stays in your diary.',
                                          destructive: true,
                                        ) &&
                                        context.mounted) {
                                      await performAction(
                                        context,
                                        () => app.mutate(
                                          (r) => r.deleteSavedMeal(item.id),
                                        ),
                                      );
                                    }
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                      ],
                    ),
            );
          },
        ),
      ],
    );
  }
}
