import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/features/welcome/presentation/screens/welcome_screen.dart';

/// Root widget of the KINETIQ application.
class KinetiqApp extends StatelessWidget {
  const KinetiqApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KINETIQ',
      debugShowCheckedModeBanner: false,
      theme: KinetiqTheme.dark,
      home: const WelcomeScreen(),
    );
  }
}
