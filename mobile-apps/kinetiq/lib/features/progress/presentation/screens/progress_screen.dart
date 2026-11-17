import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Displays training statistics and fitness progress.
class ProgressScreen extends StatelessWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KinetiqColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 28,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'KINETIQ / PROGRESS',
                style: TextStyle(
                  color: KinetiqColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),

              const SizedBox(height: 10),

              const Text(
                'Your progress',
                style: TextStyle(
                  color: KinetiqColors.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 6),

              const Text(
                'See how far you have come.',
                style: TextStyle(
                  color: KinetiqColors.textSecondary,
                  fontSize: 14,
                ),
              ),

              // Empty progress state
              const Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.show_chart_outlined,
                        color: KinetiqColors.primary,
                        size: 52,
                      ),

                      SizedBox(height: 20),

                      Text(
                        'Your progress starts here',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: KinetiqColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),

                      SizedBox(height: 10),

                      Text(
                        'Complete your first workout to start tracking your progress.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: KinetiqColors.textSecondary,
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
