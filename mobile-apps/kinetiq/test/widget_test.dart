import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/shared/widgets/k_header.dart';

void main() {
  testWidgets('KINETIQ uses the universal, prop-driven header', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: KHeader(
            title: 'KINETIQ',
            eyebrow: 'TRAIN. FUEL. EVOLVE.',
            subtitle: 'Offline-first',
          ),
        ),
      ),
    );
    expect(find.byType(KHeader), findsOneWidget);
    expect(find.text('KINETIQ'), findsOneWidget);
    expect(find.text('Offline-first'), findsOneWidget);
  });
}
