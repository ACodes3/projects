import 'package:material_ui/material_ui.dart';

import '../../../core/domain/models.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_list_tile.dart';

class MealCard extends StatelessWidget {
  const MealCard({
    super.key,
    required this.meal,
    required this.onDelete,
    this.onTap,
  });
  final MealEntry meal;
  final VoidCallback onDelete;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => KListTile(
    title: meal.name,
    subtitle:
        '${meal.grams.toStringAsFixed(0)} g · ${numberLabel(meal.kcal)} kcal · P ${numberLabel(meal.protein, 1)} / C ${numberLabel(meal.carbs, 1)} / F ${numberLabel(meal.fat, 1)}',
    icon: Icons.lunch_dining,
    trailing: IconButton(
      icon: const Icon(Icons.delete_outline),
      tooltip: 'Remove meal entry',
      onPressed: onDelete,
    ),
    onTap: onTap,
  );
}
