import 'package:material_ui/material_ui.dart';

import '../../core/theme/kinetiq_theme.dart';

class KSection extends StatelessWidget {
  const KSection({
    super.key,
    required this.title,
    required this.child,
    this.trailing,
    this.topSpace = 22,
    this.subtitle,
  });
  final String title;
  final Widget child;
  final Widget? trailing;
  final double topSpace;
  final String? subtitle;
  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.only(top: topSpace, bottom: 4),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(title, style: Theme.of(context).textTheme.titleLarge),
            ),
            ?trailing,
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: const TextStyle(color: KColors.muted, fontSize: 12),
          ),
        ],
        const SizedBox(height: 14),
        child,
      ],
    ),
  );
}
