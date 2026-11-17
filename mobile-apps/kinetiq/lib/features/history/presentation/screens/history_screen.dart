import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Displays completed workout sessions and training history.
class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

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
              // Page heading
              const Text(
                'KINETIQ / HISTORY',
                style: TextStyle(
                  color: KinetiqColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),

              const SizedBox(height: 10),

              const Text(
                'Training history',
                style: TextStyle(
                  color: KinetiqColors.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 6),

              const Text(
                'Every session counts.',
                style: TextStyle(
                  color: KinetiqColors.textSecondary,
                  fontSize: 14,
                ),
              ),

              // Empty history state
              const Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.history_outlined,
                        color: KinetiqColors.primary,
                        size: 52,
                      ),

                      SizedBox(height: 20),

                      Text(
                        'No workout history yet',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: KinetiqColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),

                      SizedBox(height: 10),

                      Text(
                        'Your completed training sessions will appear here.',
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
