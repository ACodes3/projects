import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Header displayed at the top of the Home Dashboard.
class DashboardHeader extends StatelessWidget {
  const DashboardHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Header text
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'KINETIQ / HOME',
                style: TextStyle(
                  color: KinetiqColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),
              SizedBox(height: 10),
              Text(
                'Ready to move?',
                style: TextStyle(
                  color: KinetiqColors.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'Every workout is progress.',
                style: TextStyle(
                  color: KinetiqColors.textSecondary,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(width: 12),

        // Header icon
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: KinetiqColors.surfaceElevated,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(
            Icons.bolt,
            color: KinetiqColors.primary,
            size: 28,
          ),
        ),
      ],
    );
  }
}
