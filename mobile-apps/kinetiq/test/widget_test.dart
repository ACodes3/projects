
import 'package:flutter_test/flutter_test.dart';

import 'package:kinetiq/app/app.dart';

void main() {
  testWidgets('Welcome screen navigates to Home', (
      WidgetTester tester,
      ) async {
    // Build the KINETIQ application.
    await tester.pumpWidget(const KinetiqApp());

    // Verify the welcome screen.
    expect(find.text('KINETIQ'), findsOneWidget);
    expect(find.text('TRAIN. TRACK. EVOLVE.'), findsOneWidget);
    expect(find.text('GET STARTED'), findsOneWidget);

    // Tap the GET STARTED button.
    await tester.tap(find.text('GET STARTED'));

    // Allow GoRouter to complete the navigation.
    await tester.pumpAndSettle();

    // Verify that the Home screen is displayed.
    expect(find.text('Welcome to KINETIQ!'), findsOneWidget);

    // The welcome button should no longer be visible.
    expect(find.text('GET STARTED'), findsNothing);
  });
}
