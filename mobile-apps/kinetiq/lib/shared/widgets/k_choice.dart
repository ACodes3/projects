import 'package:material_ui/material_ui.dart';

import '../../core/theme/kinetiq_theme.dart';

class KChoice extends StatelessWidget {
  const KChoice({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  @override
  Widget build(BuildContext context) => ChoiceChip(
    label: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[Icon(icon, size: 16), const SizedBox(width: 6)],
        Text(label),
      ],
    ),
    selected: selected,
    onSelected: (_) => onTap(),
    showCheckmark: false,
    backgroundColor: KColors.surface,
    selectedColor: KColors.lime,
    labelStyle: TextStyle(
      color: selected ? KColors.background : KColors.text,
      fontWeight: FontWeight.w600,
    ),
    side: BorderSide(color: selected ? KColors.lime : KColors.outline),
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
  );
}
