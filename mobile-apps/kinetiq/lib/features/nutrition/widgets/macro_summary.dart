import 'package:material_ui/material_ui.dart';

import '../../../core/domain/metrics.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_card.dart';

/// Counts only logged entries; incomplete source values display as unknown.
class MacroSummary extends StatelessWidget {
  const MacroSummary({
    super.key,
    required this.totals,
    required this.hasMeals,
    this.label = 'LOGGED NUTRITION',
  });
  final MacroTotals totals;
  final bool hasMeals;
  final String label;
  @override
  Widget build(BuildContext context) => KCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: KColors.lime,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.6,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 14),
        Text(
          hasMeals ? numberLabel(totals.kcal) : '—',
          style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w900),
        ),
        const Text('kcal logged', style: TextStyle(color: KColors.muted)),
        const SizedBox(height: 20),
        Row(
          children: [
            _macro('Protein', totals.protein),
            const SizedBox(width: 12),
            _macro('Carbs', totals.carbs),
            const SizedBox(width: 12),
            _macro('Fat', totals.fat),
          ],
        ),
        if (hasMeals &&
            [
              totals.kcal,
              totals.protein,
              totals.carbs,
              totals.fat,
            ].contains(null)) ...[
          const SizedBox(height: 13),
          const Text(
            'Some nutrient values are unknown. Totals are not assumed to be zero.',
            style: TextStyle(color: KColors.orange, fontSize: 11, height: 1.4),
          ),
        ],
        if (!hasMeals) ...[
          const SizedBox(height: 10),
          const Text(
            'No meals logged for this date.',
            style: TextStyle(color: KColors.muted, fontSize: 12),
          ),
        ],
      ],
    ),
  );
  Widget _macro(String label, double? grams) => Expanded(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          grams == null ? '—' : '${grams.toStringAsFixed(1)} g',
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
        const SizedBox(height: 5),
        Text(label, style: const TextStyle(color: KColors.muted, fontSize: 12)),
      ],
    ),
  );
}
