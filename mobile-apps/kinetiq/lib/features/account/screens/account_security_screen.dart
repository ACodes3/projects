import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_text_field.dart';

class AccountSecurityScreen extends ConsumerStatefulWidget {
  const AccountSecurityScreen({super.key});
  @override
  ConsumerState<AccountSecurityScreen> createState() =>
      _AccountSecurityScreenState();
}

class _AccountSecurityScreenState extends ConsumerState<AccountSecurityScreen> {
  final code = TextEditingController(),
      oldPassword = TextEditingController(),
      newPassword = TextEditingController();
  @override
  void dispose() {
    code.dispose();
    oldPassword.dispose();
    newPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final account = ref.watch(accountControllerProvider);
    return KScreen(
      title: 'Account security',
      back: true,
      subtitle: 'Verification codes require configured email delivery.',
      children: [
        if (!account.verified) ...[
          KButton(
            label: 'REQUEST VERIFICATION EMAIL',
            onPressed: () =>
                performAction(context, account.requestVerification),
          ),
          const SizedBox(height: 12),
          KTextField(controller: code, label: 'Verification code'),
          const SizedBox(height: 12),
          KButton(
            label: 'VERIFY EMAIL',
            style: KButtonStyle.secondary,
            onPressed: () async {
              await performAction(
                context,
                () => account.confirmVerification(code.text.trim()),
              );
              if (context.mounted) context.pop();
            },
          ),
        ],
        const SizedBox(height: 20),
        const Text('Change password'),
        const SizedBox(height: 12),
        KTextField(
          controller: oldPassword,
          label: 'Current password',
          obscure: true,
        ),
        const SizedBox(height: 12),
        KTextField(
          controller: newPassword,
          label: 'New password (12+ characters)',
          obscure: true,
        ),
        const SizedBox(height: 14),
        KButton(
          label: 'CHANGE PASSWORD',
          onPressed: () async {
            await performAction(
              context,
              () => account.changePassword(oldPassword.text, newPassword.text),
              success: 'Password changed.',
            );
          },
        ),
      ],
    );
  }
}
