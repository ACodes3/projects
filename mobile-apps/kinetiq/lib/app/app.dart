import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/router/app_router.dart';
import 'package:kinetiq/app/theme/kinetiq_theme.dart';

/// Root widget of the KINETIQ application.
class KinetiqApp extends StatelessWidget {
  const KinetiqApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'KINETIQ',
      debugShowCheckedModeBanner: false,
      theme: KinetiqTheme.dark,
      routerConfig: AppRouter.router,
    );
  }
}
