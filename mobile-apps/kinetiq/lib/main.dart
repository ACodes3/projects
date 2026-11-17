import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kinetiq/app/app.dart';

void main() {
  runApp(
    const ProviderScope(
      child: KinetiqApp(),
    ),
  );
}
