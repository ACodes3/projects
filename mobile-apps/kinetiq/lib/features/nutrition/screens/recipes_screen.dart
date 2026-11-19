import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/metrics.dart';
import '../../../core/domain/models.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_dialog.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';

class RecipesScreen extends ConsumerWidget {
  const RecipesScreen({super.key});
  Future<void> create(BuildContext context, WidgetRef ref) async {
    final values = await showNameDialog(
      context,
      heading: 'Create recipe / saved meal',
      titleLabel: 'Recipe name',
      notesLabel: 'Preparation (optional)',
    );
    if (values == null || !context.mounted) return;
    final servings = TextEditingController(text: '2');
    try {
      final number = await showDialog<int>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Servings'),
          content: KNumberField(
            controller: servings,
            label: 'Number of servings',
            decimal: false,
          ),
          actions: [
            KButton(
              label: 'Create',
              expanded: false,
              onPressed: () =>
                  Navigator.pop(dialogContext, int.tryParse(servings.text)),
            ),
          ],
        ),
      );
      if (number != null && context.mounted) {
        await performAction(
          context,
          () => ref
              .read(appControllerProvider)
              .mutate(
                (r) => r.createRecipe(
                  values.title,
                  servings: number,
                  instructions: values.notes,
                ),
              ),
        );
      }
    } finally {
      servings.dispose();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    return KScreen(
      title: 'Recipes & saved meals',
      eyebrow: 'FUEL / RECIPES',
      back: true,
      subtitle: 'Reusable ingredient collections with transparent nutrient calculations.',
      children: [
        KButton(
          label: 'CREATE RECIPE',
          icon: Icons.add,
          onPressed: () => create(context, ref),
        ),
        KSection(
          title: 'Your recipes',
          child: app.recipes.isEmpty
              ? const KEmptyState(
                  title: 'No recipes yet',
                  message: 'Create a recipe, then add foods from your library.',
                )
              : Column(
                  children: [
                    for (final recipe in app.recipes) ...[
                      KListTile(
                        title: recipe.name,
                        subtitle:
                            '${recipe.servings} serving(s) · ${recipe.instructions.isEmpty ? 'No instructions' : recipe.instructions}',
                        icon: Icons.menu_book_outlined,
                        onTap: () => showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (_) => _RecipeEditor(recipe: recipe),
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

class _RecipeEditor extends ConsumerStatefulWidget {
  const _RecipeEditor({required this.recipe});
  final Recipe recipe;
  @override
  ConsumerState<_RecipeEditor> createState() => _RecipeEditorState();
}

class _RecipeEditorState extends ConsumerState<_RecipeEditor> {
  List<RecipeIngredient>? ingredients;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await ref
        .read(repositoryProvider)
        .ingredients(widget.recipe.id);
    if (mounted) setState(() => ingredients = list);
  }

  Future<void> _add() async {
    final app = ref.read(appControllerProvider);
    if (app.foods.isEmpty) {
      feedback(context, 'Create a food in the food library first.');
      return;
    }
    final picked = await showDialog<Food>(
      context: context,
      builder: (dialogContext) => SimpleDialog(
        title: const Text('Add food ingredient'),
        children: [
          for (final food in app.foods)
            SimpleDialogOption(
              onPressed: () => Navigator.pop(dialogContext, food),
              child: Text(food.name),
            ),
        ],
      ),
    );
    if (picked == null || !mounted) return;
    final grams = TextEditingController(text: '100');
    try {
      final quantity = await showDialog<double>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(picked.name),
          content: KNumberField(controller: grams, label: 'Grams'),
          actions: [
            KButton(
              label: 'Add',
              expanded: false,
              onPressed: () =>
                  Navigator.pop(dialogContext, double.tryParse(grams.text)),
            ),
          ],
        ),
      );
      if (quantity != null && mounted) {
        await performAction(
          context,
          () => app.mutate(
            (r) => r.addIngredient(widget.recipe.id, picked, quantity),
          ),
        );
        await _load();
      }
    } finally {
      grams.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final entries = ingredients ?? [];
    final energy = sumKnown(entries.map((x) => x.kcal));
    final protein = sumKnown(entries.map((x) => x.protein));
    return SafeArea(
      child: FractionallySizedBox(
        heightFactor: .85,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.recipe.name,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                '${widget.recipe.servings} servings · nutrients per serving shown below',
                style: const TextStyle(color: KColors.muted, fontSize: 12),
              ),
              const SizedBox(height: 16),
              KCard(
                child: Text(
                  '${energy == null ? 'Unknown' : numberLabel(energy / widget.recipe.servings)} kcal / serving · ${protein == null ? 'Unknown' : numberLabel(protein / widget.recipe.servings, 1)} g protein',
                ),
              ),
              const SizedBox(height: 12),
              KButton(
                label: 'ADD INGREDIENT',
                icon: Icons.add,
                onPressed: _add,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView(
                  children: [
                    if (entries.isEmpty)
                      const KEmptyState(
                        title: 'No ingredients',
                        message: 'Add foods with known nutrient composition to build this recipe.',
                      ),
                    for (final item in entries) ...[
                      KListTile(
                        title: item.foodName,
                        subtitle:
                            '${item.grams.toStringAsFixed(0)} g · ${numberLabel(item.kcal)} kcal',
                        icon: Icons.restaurant,
                        trailing: IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () async {
                            await performAction(
                              context,
                              () => ref
                                  .read(appControllerProvider)
                                  .mutate((r) => r.deleteIngredient(item.id)),
                            );
                            await _load();
                          },
                        ),
                        onTap: () => {},
                      ),
                      const SizedBox(height: 8),
                    ],
                  ],
                ),
              ),
              KButton(
                label: 'DELETE RECIPE',
                style: KButtonStyle.danger,
                onPressed: () async {
                  if (await confirmAction(
                        context,
                        title: 'Delete recipe?',
                        message: 'This deletes the recipe, not foods or previously logged meals.',
                        destructive: true,
                      ) &&
                      context.mounted) {
                    await performAction(
                      context,
                      () => ref
                          .read(appControllerProvider)
                          .mutate((r) => r.deleteRecipe(widget.recipe.id)),
                    );
                    if (context.mounted) Navigator.pop(context);
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
