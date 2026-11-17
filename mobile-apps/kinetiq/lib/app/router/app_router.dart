import 'package:go_router/go_router.dart';

import 'package:kinetiq/features/home/presentation/screens/home_screen.dart';
import 'package:kinetiq/features/welcome/presentation/screens/welcome_screen.dart';

/// Central navigation configuration for KINETIQ.
abstract final class AppRouter {
  // Route paths
  static const String welcome = '/';
  static const String home = '/home';

  // Application router
  static final GoRouter router = GoRouter(
    initialLocation: welcome,
    routes: [
      GoRoute(
        path: welcome,
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),

      GoRoute(
        path: home,
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),
    ],
  );
}
