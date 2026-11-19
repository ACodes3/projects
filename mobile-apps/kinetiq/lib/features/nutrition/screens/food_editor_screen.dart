import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_text_field.dart';

class FoodEditorScreen extends ConsumerStatefulWidget {
  const FoodEditorScreen({super.key, this.foodId});
  final String? foodId;
  @override
  ConsumerState<FoodEditorScreen> createState() => _FoodEditorScreenState();
}

class _FoodEditorScreenState extends ConsumerState<FoodEditorScreen> {
  final name = TextEditingController();
  final brand = TextEditingController();
  final kcal = TextEditingController();
  final protein = TextEditingController();
  final carbs = TextEditingController();
  final fat = TextEditingController();
  bool initialized = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!initialized) {
      initialized = true;
      final app = ref.read(appControllerProvider);
      final food = app.foods.where((e) => e.id == widget.foodId).firstOrNull;
      if (food != null) {
        name.text = food.name;
        brand.text = food.brand;
        kcal.text = food.kcal?.toString() ?? '';
        protein.text = food.protein?.toString() ?? '';
        carbs.text = food.carbs?.toString() ?? '';
        fat.text = food.fat?.toString() ?? '';
      }
    }
  }

  @override
  void dispose() {
    name.dispose();
    brand.dispose();
    kcal.dispose();
    protein.dispose();
    carbs.dispose();
    fat.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final app = ref.read(appControllerProvider);
    final result = await performAction(
      context,
      () => app.mutate(
        (r) => r.saveFood(
          id: widget.foodId,
          name: name.text,
          brand: brand.text,
          kcal: double.tryParse(kcal.text),
          protein: double.tryParse(protein.text),
          carbs: double.tryParse(carbs.text),
          fat: double.tryParse(fat.text),
        ),
      ),
    );
    if (mounted && result != null) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return KScreen(
      title: widget.foodId == null ? 'Create custom food' : 'Edit custom food',
      eyebrow: 'FUEL / SOURCE',
      back: true,
      subtitle: 'Enter label or measured values per 100 g. Blank means unknown, not zero.',
      children: [
        KTextField(controller: name, label: 'Food name'),
        const SizedBox(height: 12),
        KTextField(controller: brand, label: 'Brand or source note (optional)'),
        const SizedBox(height: 18),
        KCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'NUTRIENTS PER 100 G',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 14),
              KNumberField(controller: kcal, label: 'Energy', suffix: 'kcal'),
              const SizedBox(height: 12),
              KNumberField(controller: protein, label: 'Protein', suffix: 'g'),
              const SizedBox(height: 12),
              KNumberField(
                controller: carbs,
                label: 'Carbohydrates',
                suffix: 'g',
              ),
              const SizedBox(height: 12),
              KNumberField(controller: fat, label: 'Fat', suffix: 'g'),
            ],
          ),
        ),
        const SizedBox(height: 24),
        KButton(label: 'SAVE FOOD', icon: Icons.check, onPressed: _save),
      ],
    );
  }
}
