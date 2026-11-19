import 'package:material_ui/material_ui.dart';

import '../../core/theme/kinetiq_theme.dart';
import 'k_card.dart';

class KListTile extends StatelessWidget {
  const KListTile({
    super.key,
    required this.title,
    this.subtitle,
    this.icon = Icons.fitness_center_outlined,
    this.trailing,
    this.onTap,
    this.accent = false,
  });
  final String title;
  final String? subtitle;
  final IconData icon;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool accent;
  @override
  Widget build(BuildContext context) => KCard(
    onTap: onTap,
    padding: const EdgeInsets.all(13),
    child: Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: accent
                ? KColors.lime.withValues(alpha: .14)
                : KColors.surfaceRaised,
            borderRadius: BorderRadius.circular(13),
          ),
          child: Icon(
            icon,
            size: 21,
            color: accent ? KColors.lime : KColors.text,
          ),
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium,
                overflow: TextOverflow.ellipsis,
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 5),
                Text(
                  subtitle!,
                  style: const TextStyle(color: KColors.muted, fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
        const SizedBox(width: 6),
        trailing ??
            const Icon(Icons.chevron_right_rounded, color: KColors.muted),
      ],
    ),
  );
}
