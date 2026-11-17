import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Reusable surface card for the KINETIQ dashboard.
class DashboardCard extends StatelessWidget {
  const DashboardCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: KinetiqColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: KinetiqColors.border,
          width: 1,
        ),
      ),
      child: child,
    );
  }
}
