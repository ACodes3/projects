import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

import 'package:go_router/go_router.dart';
import 'package:kinetiq/app/router/app_router.dart';

/// Main screen for managing workout routines.
class WorkoutsScreen extends StatelessWidget {
  const WorkoutsScreen({super.key});

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
                'KINETIQ / WORKOUTS',
                style: TextStyle(
                  color: KinetiqColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),

              const SizedBox(height: 10),

              const Text(
                'Your workouts',
                style: TextStyle(
                  color: KinetiqColors.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 6),

              const Text(
                'Build routines. Train your way.',
                style: TextStyle(
                  color: KinetiqColors.textSecondary,
                  fontSize: 14,
                ),
              ),


              const SizedBox(height: 28),

// Opens the Exercise Library within the Workouts tab.
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    context.push(AppRouter.exerciseLibrary);
                  },
                  icon: const Icon(
                    Icons.menu_book_outlined,
                    size: 20,
                  ),
                  label: const Text('EXERCISE LIBRARY'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(54),
                    backgroundColor: KinetiqColors.primary,
                    foregroundColor: KinetiqColors.background,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),

              const Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.fitness_center_outlined,
                        color: KinetiqColors.primary,
                        size: 52,
                      ),

                      SizedBox(height: 20),

                      Text(
                        'No workout routines yet',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: KinetiqColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),

                      SizedBox(height: 10),

                      Text(
                        'Your saved workout routines will appear here.',
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
