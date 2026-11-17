import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Shared layout for KINETIQ's main navigation tabs.
///
/// GoRouter manages the active tab and preserves each
/// tab's navigation stack through StatefulShellRoute.
class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.navigationShell,
  });

  final StatefulNavigationShell navigationShell;

  /// Switches to the selected navigation branch.
  void _onDestinationSelected(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KinetiqColors.background,

      // Displays the active tab's screen.
      body: navigationShell,

      // Persistent navigation across the main screens.
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: _onDestinationSelected,
        backgroundColor: KinetiqColors.surface,
        indicatorColor: KinetiqColors.surfaceElevated,
        elevation: 0,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.fitness_center_outlined),
            selectedIcon: Icon(Icons.fitness_center),
            label: 'Workouts',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history),
            label: 'History',
          ),
          NavigationDestination(
            icon: Icon(Icons.show_chart_outlined),
            selectedIcon: Icon(Icons.show_chart),
            label: 'Progress',
          ),
        ],
      ),
    );
  }
}
