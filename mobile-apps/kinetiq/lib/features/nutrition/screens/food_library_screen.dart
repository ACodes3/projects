import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_empty_state.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_text_field.dart';

class FoodLibraryScreen extends ConsumerStatefulWidget {
  const FoodLibraryScreen({super.key, this.selectedDate});
  final DateTime? selectedDate;
  @override
  ConsumerState<FoodLibraryScreen> createState() => _FoodLibraryScreenState();
}

class _FoodLibraryScreenState extends ConsumerState<FoodLibraryScreen> {
  final search = TextEditingController();
  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final foods = app.foods
        .where((f) => f.name.toLowerCase().contains(search.text.toLowerCase()))
        .toList();
    return KScreen(
      title: 'Your food library',
      eyebrow: 'FUEL / FOOD',
      subtitle: 'Nutrition values are user-entered per 100 g; no licensed catalog is connected.',
      back: true,
      children: [
        KButton(
          label: 'CREATE CUSTOM FOOD',
          icon: Icons.add,
          onPressed: () => context.push('/foods/edit'),
        ),
        const SizedBox(height: 14),
        KTextField(
          controller: search,
          label: 'Search your foods',
          prefix: const Icon(Icons.search),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 18),
        if (foods.isEmpty)
          const KEmptyState(
            title: 'No food entries',
            message: 'Create a food with nutrient values from a source you trust. Unknown values can be left blank.',
          ),
        for (final food in foods) ...[
          KListTile(
            title: food.name,
            subtitle:
                '${food.brand.isEmpty ? 'Custom food' : food.brand} · ${numberLabel(food.kcal)} kcal / 100 g · user-entered',
            icon: Icons.restaurant,
            onTap: () => context.push(
              '/meal-log?food=${food.id}${widget.selectedDate == null ? '' : '&day=${widget.selectedDate!.toIso8601String().substring(0, 10)}'}',
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) async {
                switch (value) {
                  case 'edit':
                    context.push('/foods/edit?id=${food.id}');
                    break;
                  case 'favorite':
                    await performAction(
                      context,
                      () => app.mutate((r) => r.toggleFoodFavorite(food)),
                    );
                    break;
                  case 'delete':
                    if (await confirmAction(
                          context,
                          title: 'Delete food?',
                          message: 'Existing meal snapshots keep their recorded values.',
                          destructive: true,
                        ) &&
                        context.mounted) {
                      await performAction(
                        context,
                        () => app.mutate((r) => r.deleteFood(food.id)),
                      );
                    }
                    break;
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'edit', child: Text('Edit')),
                PopupMenuItem(
                  value: 'favorite',
                  child: Text(food.favorite ? 'Unfavorite' : 'Favorite'),
                ),
                const PopupMenuItem(value: 'delete', child: Text('Delete')),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}
