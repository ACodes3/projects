import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';

import 'package:kinetiq/app/shell/app_shell.dart';

import 'package:kinetiq/features/welcome/presentation/screens/welcome_screen.dart';
import 'package:kinetiq/features/home/presentation/screens/home_screen.dart';
import 'package:kinetiq/features/workouts/presentation/screens/workouts_screen.dart';
import 'package:kinetiq/features/workouts/presentation/screens/workout_template_details_screen.dart';
import 'package:kinetiq/features/history/presentation/screens/history_screen.dart';
import 'package:kinetiq/features/progress/presentation/screens/progress_screen.dart';
import 'package:kinetiq/features/exercises/presentation/screens/exercise_library_screen.dart';
import 'package:kinetiq/features/exercises/presentation/screens/add_exercise_screen.dart';

/// Central navigation configuration for KINETIQ.
abstract final class AppRouter {
  // ----------------------------------------------------------
  // ROUTE PATHS
  // ----------------------------------------------------------

  static const String welcome = '/';
  static const String home = '/home';
  static const String workouts = '/workouts';
  static const String history = '/history';
  static const String progress = '/progress';

  // Exercise Library routes.
  static const String exerciseLibrary = '/workouts/exercises';
  static const String addExercise = '/workouts/exercises/add';
  static const String editExercise = '/workouts/exercises/:exerciseId/edit';

  // Workout Template routes.
  static const String workoutTemplateDetails =
      '/workouts/templates/:templateId';

  // ----------------------------------------------------------
  // APPLICATION ROUTER
  // ----------------------------------------------------------

  static GoRouter createRouter() => GoRouter(
    initialLocation: welcome,
    routes: [
      // --------------------------------------------------
      // WELCOME SCREEN
      // --------------------------------------------------

      // Outside the main bottom navigation shell.
      GoRoute(
        path: welcome,
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),

      // --------------------------------------------------
      // MAIN APPLICATION SHELL
      // --------------------------------------------------
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          // ----------------------------------------------
          // HOME TAB
          // ----------------------------------------------

          StatefulShellBranch(
            routes: [
              GoRoute(
                path: home,
                name: 'home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),

          // ----------------------------------------------
          // WORKOUTS TAB
          // ----------------------------------------------
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: workouts,
                name: 'workouts',
                builder: (context, state) => const WorkoutsScreen(),
                routes: [
                  // --------------------------------------
                  // WORKOUT TEMPLATE DETAILS
                  // --------------------------------------

                  GoRoute(
                    path: 'templates/:templateId',
                    name: 'workout-template-details',
                    builder: (context, state) {
                      final templateId = int.tryParse(
                        state.pathParameters['templateId'] ?? '',
                      );

                      if (templateId == null || templateId <= 0) {
                        return const Scaffold(
                          body: Center(
                            child: Text('Invalid workout template.'),
                          ),
                        );
                      }

                      // The details screen manages its own
                      // Add, Edit, Remove, and Reorder actions.
                      return WorkoutTemplateDetailsScreen(
                        templateId: templateId,
                      );
                    },
                  ),

                  // --------------------------------------
                  // EXERCISE LIBRARY
                  // --------------------------------------
                  GoRoute(
                    path: 'exercises',
                    name: 'exercise-library',
                    builder: (context, state) => const ExerciseLibraryScreen(),
                    routes: [
                      // ----------------------------------
                      // CREATE EXERCISE
                      // ----------------------------------

                      GoRoute(
                        path: 'add',
                        name: 'add-exercise',
                        builder: (context, state) => const AddExerciseScreen(),
                      ),

                      // ----------------------------------
                      // EDIT EXERCISE
                      // ----------------------------------
                      GoRoute(
                        path: ':exerciseId/edit',
                        name: 'edit-exercise',
                        builder: (context, state) {
                          final exerciseId = int.tryParse(
                            state.pathParameters['exerciseId'] ?? '',
                          );

                          if (exerciseId == null || exerciseId <= 0) {
                            return const Scaffold(
                              body: Center(child: Text('Invalid exercise ID.')),
                            );
                          }

                          return AddExerciseScreen(exerciseId: exerciseId);
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),

          // ----------------------------------------------
          // HISTORY TAB
          // ----------------------------------------------
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: history,
                name: 'history',
                builder: (context, state) => const HistoryScreen(),
              ),
            ],
          ),

          // ----------------------------------------------
          // PROGRESS TAB
          // ----------------------------------------------
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
