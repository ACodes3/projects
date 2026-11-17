import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/features/home/presentation/widgets/dashboard_card.dart';

/// Reusable statistics card for the Home Dashboard.
class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            color: KinetiqColors.primary,
            size: 24,
          ),

          const SizedBox(height: 16),

          Text(
            value,
            style: const TextStyle(
              color: KinetiqColors.textPrimary,
              fontSize: 26,
              fontWeight: FontWeight.w800,
            ),
          ),

          const SizedBox(height: 6),

          Text(
            label,
            style: const TextStyle(
              color: KinetiqColors.textSecondary,
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
