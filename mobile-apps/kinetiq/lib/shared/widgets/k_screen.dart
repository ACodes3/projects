import 'package:material_ui/material_ui.dart';

import 'k_header.dart';

/// Consistent responsive screen body. All routes compose reusable building blocks.
class KScreen extends StatelessWidget {
  const KScreen({
    super.key,
    required this.title,
    required this.children,
    this.eyebrow,
    this.subtitle,
    this.action,
    this.back = false,
    this.compact = false,
    this.floatingAction,
  });
  final String title;
  final String? eyebrow, subtitle;
  final Widget? action, floatingAction;
  final List<Widget> children;
  final bool back, compact;
  @override
  Widget build(BuildContext context) => Scaffold(
    floatingActionButton: floatingAction,
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: ListView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
            children: [
              KHeader(
                title: title,
                eyebrow: eyebrow,
                subtitle: subtitle,
                trailing: action,
                showBack: back,
                compact: compact,
              ),
              ...children,
            ],
          ),
        ),
      ),
    ),
  );
}
