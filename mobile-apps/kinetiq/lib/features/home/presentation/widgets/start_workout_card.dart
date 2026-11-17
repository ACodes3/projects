import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/features/home/presentation/widgets/dashboard_card.dart';

/// Primary workout action displayed on the Home Dashboard.
class StartWorkoutCard extends StatelessWidget {
  const StartWorkoutCard({super.key});

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'YOUR NEXT SESSION',
            style: TextStyle(
              color: KinetiqColors.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5,
            ),
          ),

          const SizedBox(height: 12),

          const Text(
            'Start training',
            style: TextStyle(
              color: KinetiqColors.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),

          const SizedBox(height: 8),

          const Text(
            'Track exercises, sets, and progress.',
            style: TextStyle(
              color: KinetiqColors.textSecondary,
              fontSize: 14,
              height: 1.5,
            ),
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Workout tracking coming soon!'),
                  ),
                );
              },
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('START WORKOUT'),
                  SizedBox(width: 10),
                  Icon(Icons.arrow_forward, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
