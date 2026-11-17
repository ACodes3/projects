import 'package:go_router/go_router.dart';

import 'package:kinetiq/app/shell/app_shell.dart';
import 'package:kinetiq/features/welcome/presentation/screens/welcome_screen.dart';
import 'package:kinetiq/features/home/presentation/screens/home_screen.dart';
import 'package:kinetiq/features/workouts/presentation/screens/workouts_screen.dart';
import 'package:kinetiq/features/history/presentation/screens/history_screen.dart';
import 'package:kinetiq/features/progress/presentation/screens/progress_screen.dart';

/// Central navigation configuration for KINETIQ.
abstract final class AppRouter {
  // Route paths
  static const String welcome = '/';
  static const String home = '/home';
  static const String workouts = '/workouts';
  static const String history = '/history';
  static const String progress = '/progress';

  // Application router
  static GoRouter createRouter() => GoRouter(
    initialLocation: welcome,
    routes: [
      // Welcome screen — outside the main navigation shell.
      GoRoute(
        path: welcome,
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),

      // Main navigation with four independent branches.
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          // Home tab
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: home,
                name: 'home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),

          // Workouts tab
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: workouts,
                name: 'workouts',
                builder: (context, state) => const WorkoutsScreen(),
              ),
            ],
          ),

          // History tab
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: history,
                name: 'history',
                builder: (context, state) => const HistoryScreen(),
              ),
            ],
          ),

          // Progress tab
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: progress,
                name: 'progress',
                builder: (context, state) => const ProgressScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
