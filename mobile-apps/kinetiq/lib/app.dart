import 'package:material_ui/material_ui.dart';

import 'core/router/app_router.dart';
import 'core/theme/kinetiq_theme.dart';

class KinetiqApp extends StatelessWidget {
  const KinetiqApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp.router(
    title: 'KINETIQ',
    debugShowCheckedModeBanner: false,
    theme: KTheme.dark,
    routerConfig: appRouter,
  );
}
