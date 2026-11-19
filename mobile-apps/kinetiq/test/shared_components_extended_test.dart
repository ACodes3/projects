import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinetiq/features/account/widgets/account_form.dart';
import 'package:kinetiq/shared/widgets/k_button.dart';
import 'package:kinetiq/shared/widgets/k_card.dart';
import 'package:kinetiq/shared/widgets/k_choice.dart';
import 'package:kinetiq/shared/widgets/k_empty_state.dart';
import 'package:kinetiq/shared/widgets/k_header.dart';
import 'package:kinetiq/shared/widgets/k_number_field.dart';
import 'package:kinetiq/shared/widgets/k_screen.dart';
import 'package:kinetiq/shared/widgets/k_section.dart';
import 'package:kinetiq/shared/widgets/k_text_field.dart';

Widget shell(Widget child) => MaterialApp(
  home: Scaffold(body: SingleChildScrollView(child: child)),
);
void main() {
  testWidgets('shared header title is prop-driven', (tester) async {
    await tester.pumpWidget(shell(const KHeader(title: 'Progress')));
    expect(find.text('Progress'), findsOneWidget);
  });
  testWidgets('shared header eyebrow and subtitle are independent props', (
    tester,
  ) async {
    await tester.pumpWidget(
      shell(
        const KHeader(title: 'Fuel', eyebrow: 'NUTRITION', subtitle: 'Today'),
      ),
    );
    expect(find.text('NUTRITION'), findsOneWidget);
    expect(find.text('Today'), findsOneWidget);
  });
  testWidgets('header custom back callback fires', (tester) async {
    var count = 0;
    await tester.pumpWidget(
      shell(KHeader(title: 'Screen', showBack: true, onBack: () => count++)),
    );
    await tester.tap(find.text('BACK'));
    expect(count, 1);
  });
  testWidgets('shared primary button responds', (tester) async {
    var count = 0;
    await tester.pumpWidget(
      shell(KButton(label: 'Start', onPressed: () => count++)),
    );
    await tester.tap(find.text('Start'));
    expect(count, 1);
  });
  testWidgets('disabled button cannot trigger', (tester) async {
    await tester.pumpWidget(
      shell(const KButton(label: 'No action', onPressed: null)),
    );
    expect(
      tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
      isNull,
    );
  });
  testWidgets('busy button shows loading state', (tester) async {
    await tester.pumpWidget(
      shell(const KButton(label: 'Saving', busy: true, onPressed: null)),
    );
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
  testWidgets('ghost button renders label', (tester) async {
    await tester.pumpWidget(
      shell(
        const KButton(
          label: 'Skip',
          style: KButtonStyle.ghost,
          onPressed: null,
        ),
      ),
    );
    expect(find.text('Skip'), findsOneWidget);
  });
  testWidgets('danger button renders destructive label', (tester) async {
    await tester.pumpWidget(
      shell(
        const KButton(
          label: 'Delete',
          style: KButtonStyle.danger,
          onPressed: null,
        ),
      ),
    );
    expect(find.text('Delete'), findsOneWidget);
  });
  testWidgets('reusable choice invokes selected callback', (tester) async {
    var count = 0;
    await tester.pumpWidget(
      shell(KChoice(label: 'Beginner', selected: true, onTap: () => count++)),
    );
    await tester.tap(find.text('Beginner'));
    expect(count, 1);
  });
  testWidgets('reusable choice optional icon appears', (tester) async {
    await tester.pumpWidget(
      shell(
        KChoice(
          label: 'Weight',
          selected: false,
          onTap: () {},
          icon: Icons.fitness_center,
        ),
      ),
    );
    expect(find.byIcon(Icons.fitness_center), findsOneWidget);
  });
  testWidgets('empty state explains missing activity', (tester) async {
    await tester.pumpWidget(
      shell(const KEmptyState(title: 'No workouts', message: 'Start one.')),
    );
    expect(find.text('No workouts'), findsOneWidget);
    expect(find.text('Start one.'), findsOneWidget);
  });
  testWidgets('empty state optional action invokes callback', (tester) async {
    var count = 0;
    await tester.pumpWidget(
      shell(
        KEmptyState(
          title: 'Empty',
          message: 'None',
          actionLabel: 'Create',
          onAction: () => count++,
        ),
      ),
    );
    await tester.tap(find.text('Create'));
    expect(count, 1);
  });
  testWidgets('KCard receives arbitrary child via props', (tester) async {
    await tester.pumpWidget(shell(const KCard(child: Text('My record'))));
    expect(find.text('My record'), findsOneWidget);
  });
  testWidgets('KSection shows title subtitle and trailing', (tester) async {
    await tester.pumpWidget(
      shell(
        const KSection(
          title: 'Training',
          subtitle: 'Weekly',
          trailing: Text('More'),
          child: Text('Stats'),
        ),
      ),
    );
    expect(find.text('Training'), findsOneWidget);
    expect(find.text('Weekly'), findsOneWidget);
    expect(find.text('More'), findsOneWidget);
    expect(find.text('Stats'), findsOneWidget);
  });
  testWidgets('KTextField accepts label and hint via props', (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      shell(
        KTextField(
          controller: controller,
          label: 'Email',
          hint: 'You@example.com',
        ),
      ),
    );
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('You@example.com'), findsOneWidget);
  });
  testWidgets('KTextField supports obscured password', (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      shell(
        KTextField(controller: controller, label: 'Password', obscure: true),
      ),
    );
    expect(
      tester.widget<TextField>(find.byType(TextField)).obscureText,
      isTrue,
    );
  });
  testWidgets('KNumberField updates numeric value', (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      shell(KNumberField(controller: controller, label: 'Grams')),
    );
    await tester.enterText(find.byType(TextField), '250.5');
    expect(controller.text, '250.5');
  });
  testWidgets('KScreen routes content through shared header', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: const KScreen(
          title: 'History',
          eyebrow: 'TRAIN',
          children: [Text('Sessions')],
        ),
      ),
    );
    expect(find.byType(KHeader), findsOneWidget);
    expect(find.text('Sessions'), findsOneWidget);
  });
  testWidgets('auth form rejects invalid email', (tester) async {
    var calls = 0;
    await tester.pumpWidget(
      shell(
        AccountForm(
          title: 'Register',
          submitLabel: 'Register',
          onSubmit: (email, pw, code) async {
            calls++;
          },
        ),
      ),
    );
    await tester.tap(find.text('Register'));
    await tester.pump();
    expect(find.text('Enter a valid email address.'), findsOneWidget);
    expect(calls, 0);
  });
  testWidgets('auth form rejects short password', (tester) async {
    var calls = 0;
    await tester.pumpWidget(
      shell(
        AccountForm(
          title: 'Register',
          submitLabel: 'Register',
          onSubmit: (email, pw, code) async {
            calls++;
          },
        ),
      ),
    );
    await tester.enterText(find.byType(TextField).first, 'valid@example.com');
    await tester.enterText(find.byType(TextField).last, 'short');
    await tester.tap(find.text('Register'));
    await tester.pump();
    expect(
      find.text('Password must contain at least 12 characters.'),
      findsOneWidget,
    );
    expect(calls, 0);
  });
  testWidgets('auth form submits valid credentials', (tester) async {
    String? captured;
    await tester.pumpWidget(
      shell(
        AccountForm(
          title: 'Login',
          submitLabel: 'Sign in',
          onSubmit: (email, pw, code) async {
            captured = email;
          },
        ),
      ),
    );
    await tester.enterText(find.byType(TextField).first, 'valid@example.com');
    await tester.enterText(find.byType(TextField).last, 'long-password-123');
    await tester.tap(find.text('Sign in'));
    await tester.pump();
    expect(captured, 'valid@example.com');
  });
}
