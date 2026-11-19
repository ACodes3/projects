import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_number_field.dart';
import '../../../shared/widgets/k_screen.dart';

/// User-set targets only; the app never prescribes energy deficits or macros.
class NutritionGoalsScreen extends ConsumerStatefulWidget {
  const NutritionGoalsScreen({super.key});
  @override
  ConsumerState<NutritionGoalsScreen> createState() =>
      _NutritionGoalsScreenState();
}

class _NutritionGoalsScreenState extends ConsumerState<NutritionGoalsScreen> {
  final kcal = TextEditingController(),
      protein = TextEditingController(),
      carbs = TextEditingController(),
      fat = TextEditingController();
  bool loaded = false;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await ref.read(repositoryProvider).nutritionGoals();
    if (!mounted) return;
    setState(() {
      String label(double? number) =>
          number == null ? '' : number.toStringAsFixed(0);
      kcal.text = label(data?.kcal);
      protein.text = label(data?.protein);
      carbs.text = label(data?.carbs);
      fat.text = label(data?.fat);
      loaded = true;
    });
  }

  @override
  void dispose() {
    kcal.dispose();
    protein.dispose();
    carbs.dispose();
    fat.dispose();
    super.dispose();
  }

  double? parse(TextEditingController field) =>
      field.text.trim().isEmpty ? null : double.tryParse(field.text.trim());
  @override
  Widget build(BuildContext context) => KScreen(
    title: 'Nutrition targets',
    eyebrow: 'FUEL / PREFERENCES',
    back: true,
    subtitle: 'All targets are optional and chosen by you. Missing diary entries do not mean zero intake.',
    children: [
      if (!loaded)
        const Center(child: CircularProgressIndicator())
      else ...[
        KNumberField(controller: kcal, label: 'Daily energy (kcal, optional)'),
        const SizedBox(height: 12),
        KNumberField(controller: protein, label: 'Protein (g, optional)'),
        const SizedBox(height: 12),
        KNumberField(controller: carbs, label: 'Carbohydrates (g, optional)'),
        const SizedBox(height: 12),
        KNumberField(controller: fat, label: 'Fat (g, optional)'),
        const SizedBox(height: 24),
        KButton(
          label: 'SAVE MY TARGETS',
          onPressed: () async {
            for (final field in [kcal, protein, carbs, fat]) {
              if (field.text.trim().isNotEmpty && parse(field) == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Enter valid numeric targets.')),
                );
                return;
              }
            }
            await performAction(
              context,
              () => ref
                  .read(appControllerProvider)
                  .mutate(
                    (r) => r.saveNutritionGoals(
                      kcal: parse(kcal),
                      protein: parse(protein),
                      carbs: parse(carbs),
                      fat: parse(fat),
                    ),
                  ),
              success: 'Targets saved locally.',
            );
          },
        ),
        const SizedBox(height: 14),
        KButton(
          label: 'CLEAR TARGETS',
          style: KButtonStyle.secondary,
          onPressed: () async {
            await performAction(
              context,
              () => ref
                  .read(appControllerProvider)
                  .mutate((r) => r.saveNutritionGoals()),
            );
            if (mounted) {
              kcal.clear();
              protein.clear();
              carbs.clear();
              fat.clear();
            }
          },
        ),
      ],
    ],
  );
}
