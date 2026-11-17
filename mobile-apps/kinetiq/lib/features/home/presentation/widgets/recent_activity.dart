import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/features/home/presentation/widgets/dashboard_card.dart';

/// Displays recent training activity on the Home Dashboard.
///
/// Currently shows an empty state until workout history
/// is connected to the local database.
class RecentActivity extends StatelessWidget {
  const RecentActivity({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section heading
        const Text(
          'Recent activity',
          style: TextStyle(
            color: KinetiqColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),

        const SizedBox(height: 16),

        // Empty state
        DashboardCard(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 20,
              horizontal: 8,
            ),
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: KinetiqColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(
                    Icons.history_outlined,
                    color: KinetiqColors.primary,
                    size: 30,
                  ),
                ),

                const SizedBox(height: 20),

                const Text(
                  'No workouts logged yet',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: KinetiqColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),

                const SizedBox(height: 8),

                const Text(
                  'Your completed training sessions will appear here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: KinetiqColors.textSecondary,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
