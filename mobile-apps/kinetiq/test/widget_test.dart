
import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/main.dart';

void main() {
  testWidgets('KINETIQ welcome screen displays correctly', (
      WidgetTester tester,
      ) async {
    // Build the KINETIQ application.
    await tester.pumpWidget(const KinetiqApp());

    // Verify the application name.
    expect(find.text('KINETIQ'), findsOneWidget);

    // Verify the tagline.
    expect(find.text('MOVE. TRACK. IMPROVE.'), findsOneWidget);

    // Verify the main button.
    expect(find.text('GET STARTED'), findsOneWidget);

    // Tap the welcome button.
    await tester.tap(find.text('GET STARTED'));
    await tester.pump();

    // Verify the welcome message.
    expect(find.text('Welcome to KINETIQ!'), findsOneWidget);
  });
}
