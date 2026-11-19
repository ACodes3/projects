import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../state/providers.dart';
import '../theme/kinetiq_theme.dart';
import '../../features/onboarding/welcome_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/training/screens/train_screen.dart';
import '../../features/training/screens/routine_editor_screen.dart';
import '../../features/training/screens/exercise_library_screen.dart';
import '../../features/training/screens/workout_session_screen.dart';
import '../../features/training/screens/session_detail_screen.dart';
import '../../features/training/screens/history_screen.dart';
import '../../features/training/screens/cardio_screen.dart';
import '../../features/training/screens/programs_screen.dart';
import '../../features/nutrition/screens/nutrition_screen.dart';
import '../../features/nutrition/screens/food_library_screen.dart';
import '../../features/nutrition/screens/food_editor_screen.dart';
import '../../features/nutrition/screens/meal_log_screen.dart';
import '../../features/nutrition/screens/recipes_screen.dart';
import '../../features/progress/screens/progress_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/export_screen.dart';
import '../../features/profile/screens/data_privacy_screen.dart';
import '../../features/account/screens/auth_screen.dart';
import '../../features/account/screens/account_screen.dart';
import '../../features/account/screens/account_security_screen.dart';
import '../../features/account/screens/backup_review_screen.dart';
import '../../features/account/screens/billing_screen.dart';
import '../../features/nutrition/screens/saved_meals_screen.dart';
import '../../features/nutrition/screens/nutrition_goals_screen.dart';
import '../../shared/widgets/k_empty_state.dart';
import '../../shared/widgets/k_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const _BootstrapScreen()),
    GoRoute(
      path: '/welcome',
      builder: (context, state) => const WelcomeScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/auth/login',
      builder: (context, state) => const AuthScreen(mode: AuthMode.signIn),
    ),
    GoRoute(
      path: '/auth/signup',
      builder: (context, state) => const AuthScreen(mode: AuthMode.signUp),
    ),
    GoRoute(
      path: '/auth/forgot',
      builder: (context, state) => const AuthScreen(mode: AuthMode.forgot),
    ),
    GoRoute(
      path: '/auth/reset',
      builder: (context, state) => const AuthScreen(mode: AuthMode.reset),
    ),
    GoRoute(
      path: '/account',
      builder: (context, state) => const AccountScreen(),
    ),
    GoRoute(
      path: '/account/security',
      builder: (context, state) => const AccountSecurityScreen(),
    ),
    GoRoute(
      path: '/account/review',
      builder: (context, state) => const BackupReviewScreen(),
    ),
    GoRoute(
      path: '/billing',
      builder: (context, state) => const BillingScreen(),
    ),
    GoRoute(
      path: '/data',
      builder: (context, state) => const DataPrivacyScreen(),
    ),
    GoRoute(
      path: '/saved-meals',
      builder: (context, state) => const SavedMealsScreen(),
    ),
    GoRoute(
      path: '/nutrition-goals',
      builder: (context, state) => const NutritionGoalsScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => KAppShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
        GoRoute(
          path: '/train',
          builder: (context, state) => const TrainScreen(),
        ),
        GoRoute(
          path: '/nutrition',
          builder: (context, state) => const NutritionScreen(),
        ),
        GoRoute(
          path: '/progress',
          builder: (context, state) => const ProgressScreen(),
        ),
      ],
    ),
    GoRoute(
      path: '/routines/:id',
      builder: (context, state) =>
          RoutineEditorScreen(routineId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/exercises',
      builder: (context, state) => const ExerciseLibraryScreen(),
    ),
    GoRoute(
      path: '/workout/:id',
      builder: (context, state) =>
          WorkoutSessionScreen(sessionId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/session/:id',
      builder: (context, state) =>
          SessionDetailScreen(sessionId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/history',
      builder: (context, state) => const HistoryScreen(),
    ),
    GoRoute(path: '/cardio', builder: (context, state) => const CardioScreen()),
    GoRoute(
      path: '/programs',
      builder: (context, state) => const ProgramsScreen(),
    ),
    GoRoute(
      path: '/foods',
      builder: (context, state) => FoodLibraryScreen(
        selectedDate: DateTime.tryParse(state.uri.queryParameters['day'] ?? ''),
      ),
    ),
    GoRoute(
      path: '/foods/edit',
      builder: (context, state) =>
          FoodEditorScreen(foodId: state.uri.queryParameters['id']),
    ),
    GoRoute(
      path: '/meal-log',
      builder: (context, state) => MealLogScreen(
        foodId: state.uri.queryParameters['food'],
        selectedDate: DateTime.tryParse(state.uri.queryParameters['day'] ?? ''),
      ),
    ),
    GoRoute(
      path: '/recipes',
      builder: (context, state) => const RecipesScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(path: '/export', builder: (context, state) => const ExportScreen()),
  ],
);

class _BootstrapScreen extends ConsumerWidget {
  const _BootstrapScreen();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    if (!app.ready) {
      return const _BrandedLoading();
    }
    if (app.loadError != null) {
      return KScreen(
        title: 'Could not open KINETIQ',
        children: [
          KEmptyState(
            title: 'Local database error',
            message: app.loadError!,
            icon: Icons.error_outline,
          ),
        ],
      );
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.mounted) {
        context.go(
          app.onboarded
              ? '/home'
              : app.onboardingInProgress
              ? '/onboarding'
              : '/welcome',
        );
      }
    });
    return const _BrandedLoading();
  }
}

class KAppShell extends StatelessWidget {
  const KAppShell({super.key, required this.child});
  final Widget child;
  static const routes = ['/home', '/train', '/nutrition', '/progress'];
  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    final selected = routes.indexOf(path);
    final index = selected < 0 ? 0 : selected;
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        height: 74,
        backgroundColor: KColors.surface,
        indicatorColor: KColors.lime.withValues(alpha: .18),
        selectedIndex: index,
        onDestinationSelected: (index) => context.go(routes[index]),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.fitness_center_outlined),
            selectedIcon: Icon(Icons.fitness_center),
            label: 'Train',
          ),
          NavigationDestination(
            icon: Icon(Icons.restaurant_outlined),
            selectedIcon: Icon(Icons.restaurant),
            label: 'Nutrition',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: 'Progress',
          ),
        ],
      ),
    );
  }
}

class _BrandedLoading extends StatelessWidget {
  const _BrandedLoading();
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'K',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 88,
              color: KColors.lime,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'KINETIQ',
            style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 5),
          ),
          SizedBox(height: 32),
          CircularProgressIndicator(color: KColors.lime),
          SizedBox(height: 24),
          Text('TRAIN. FUEL. EVOLVE.'),
        ],
      ),
    ),
  );
}
