
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/router/app_router.dart';
import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Root widget of the KINETIQ application.
class KinetiqApp extends StatefulWidget {
  const KinetiqApp({super.key});

  @override
  State<KinetiqApp> createState() => _KinetiqAppState();
}

class _KinetiqAppState extends State<KinetiqApp> {
  // Create a dedicated router for this app instance.
  late final GoRouter _router = AppRouter.createRouter();

  @override
  void dispose() {
    // Release router resources when the app is disposed.
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'KINETIQ',
      debugShowCheckedModeBanner: false,
      theme: KinetiqTheme.dark,
      routerConfig: _router,
    );
  }
}
