import 'package:material_ui/material_ui.dart';

import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';

class HydrationCard extends StatelessWidget {
  const HydrationCard({
    super.key,
    required this.loggedMl,
    required this.onAdd,
    this.onCustom,
  });
  final int loggedMl;
  final ValueChanged<int> onAdd;
  final VoidCallback? onCustom;
  @override
  Widget build(BuildContext context) => KCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.water_drop_outlined, color: KColors.lime, size: 19),
            SizedBox(width: 8),
            Text(
              'HYDRATION',
              style: TextStyle(
                color: KColors.lime,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
                fontSize: 11,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text(
          '$loggedMl mL',
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 25),
        ),
        const SizedBox(height: 4),
        const Text(
          'Logged water · no automatic daily target',
          style: TextStyle(color: KColors.muted, fontSize: 12),
        ),
        const SizedBox(height: 15),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            KButton(
              label: '+ 250 mL',
              expanded: false,
              style: KButtonStyle.secondary,
              onPressed: () => onAdd(250),
            ),
            KButton(
              label: '+ 500 mL',
              expanded: false,
              style: KButtonStyle.secondary,
              onPressed: () => onAdd(500),
            ),
            KButton(
              label: 'Custom',
              expanded: false,
              style: KButtonStyle.ghost,
              onPressed: onCustom,
            ),
          ],
        ),
      ],
    ),
  );
}
