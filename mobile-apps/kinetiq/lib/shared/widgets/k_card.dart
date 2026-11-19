import 'package:material_ui/material_ui.dart';

import '../../core/theme/kinetiq_theme.dart';

class KCard extends StatelessWidget {
  const KCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.onTap,
    this.background,
    this.borderColor,
    this.margin,
  });
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? background, borderColor;
  final EdgeInsetsGeometry? margin;
  @override
  Widget build(BuildContext context) => Container(
    margin: margin,
    decoration: BoxDecoration(
      color: background ?? KColors.surface,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: borderColor ?? KColors.outline),
    ),
    child: Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(padding: padding, child: child),
      ),
    ),
  );
}
