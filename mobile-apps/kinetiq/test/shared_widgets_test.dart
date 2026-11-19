import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/core/theme/kinetiq_theme.dart';
import 'package:kinetiq/shared/widgets/k_button.dart';
import 'package:kinetiq/shared/widgets/k_header.dart';
import 'package:kinetiq/shared/widgets/k_card.dart';

void main() {
  testWidgets('one configurable header accepts screen-specific props', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: KTheme.dark,
        home: Scaffold(
          body: KHeader(
            title: 'Train',
            eyebrow: 'WORKOUT STUDIO',
            subtitle: 'Your routines',
            compact: true,
            trailing: IconButton(
              onPressed: () {},
              icon: const Icon(Icons.search),
            ),
          ),
        ),
      ),
    );
    expect(find.text('Train'), findsOneWidget);
    expect(find.text('WORKOUT STUDIO'), findsOneWidget);
    expect(find.text('Your routines'), findsOneWidget);
    expect(find.byIcon(Icons.search), findsOneWidget);
  });
  testWidgets('button style and callback work', (tester) async {
    var pressed = 0;
    await tester.pumpWidget(
      MaterialApp(
        theme: KTheme.dark,
        home: Scaffold(
          body: KCard(
            child: KButton(
              label: 'Start workout',
              icon: Icons.play_arrow,
              style: KButtonStyle.secondary,
              onPressed: () => pressed++,
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Start workout'));
    expect(pressed, 1);
  });
}
