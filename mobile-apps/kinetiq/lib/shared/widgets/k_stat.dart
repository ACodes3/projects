import 'package:material_ui/material_ui.dart';

import '../../core/theme/kinetiq_theme.dart';
import 'k_card.dart';

class KStat extends StatelessWidget {
  const KStat({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.note,
  });
  final String label, value;
  final IconData? icon;
  final String? note;
  @override
  Widget build(BuildContext context) => KCard(
    padding: const EdgeInsets.all(16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (icon != null) ...[
          Icon(icon, color: KColors.lime, size: 18),
          const SizedBox(height: 14),
        ],
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 25,
            color: KColors.text,
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: KColors.muted)),
        if (note != null) ...[
          const SizedBox(height: 6),
          Text(
            note!,
            style: const TextStyle(fontSize: 11, color: KColors.lime),
          ),
        ],
      ],
    ),
  );
}
