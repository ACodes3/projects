import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

import 'package:kinetiq/features/home/presentation/widgets/dashboard_header.dart';
import 'package:kinetiq/features/home/presentation/widgets/start_workout_card.dart';
import 'package:kinetiq/features/home/presentation/widgets/stat_card.dart';
import 'package:kinetiq/features/home/presentation/widgets/recent_activity.dart';

/// Main dashboard screen of the KINETIQ application.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KinetiqColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 28,
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Dashboard header
              DashboardHeader(),

              SizedBox(height: 32),

              // Primary workout action
              StartWorkoutCard(),

              SizedBox(height: 24),

              // Weekly training statistics
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: StatCard(
                      icon: Icons.fitness_center,
                      value: '0',
                      label: 'Workouts this week',
                    ),
                  ),

                  SizedBox(width: 12),

                  Expanded(
                    child: StatCard(
                      icon: Icons.timer_outlined,
                      value: '0 min',
                      label: 'Training time',
                    ),
                  ),
                ],
              ),

              SizedBox(height: 32),

              // Recent training history
              RecentActivity(),
            ],
          ),
        ),
      ),
    );
  }
}
