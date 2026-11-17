import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Main dashboard screen of the KINETIQ application.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KinetiqColors.background,
      appBar: AppBar(
        title: const Text(
          'KINETIQ',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
          ),
        ),
      ),
      body: const Center(
        child: Text(
          'Welcome to KINETIQ!',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: KinetiqColors.textPrimary,
          ),
        ),
      ),
    );
  }
}
