import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/state/providers.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_screen.dart';
import '../widgets/account_form.dart';

/// Mode is a prop: one screen and one form implementation for all account flows.
enum AuthMode { signIn, signUp, forgot, reset }

class AuthScreen extends ConsumerWidget {
  const AuthScreen({super.key, required this.mode});
  final AuthMode mode;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final account = ref.watch(accountControllerProvider);
    final title = switch (mode) {
      AuthMode.signIn => 'Welcome back',
      AuthMode.signUp => 'Create your account',
      AuthMode.forgot => 'Reset your password',
      AuthMode.reset => 'Enter your reset code',
    };
    final subtitle = switch (mode) {
      AuthMode.signIn => 'Sign in without losing any local workouts.',
      AuthMode.signUp => 'A free account keeps your existing local data. Backup is a separate choice.',
      AuthMode.forgot =>
        'We only send a reset code when email delivery is configured.',
      AuthMode.reset => 'Use the single-use code sent to your email address.',
    };
    return KScreen(
      title: title,
      eyebrow: 'KINETIQ / ACCOUNT',
      subtitle: subtitle,
      back: true,
      children: [
        if (!account.serverConfigured)
          const KCard(
            child: Row(
              children: [
                Icon(Icons.info_outline, color: KColors.lime),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Account server is not connected. Guest workouts work offline. See README for server setup.',
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 12),
        AccountForm(
          key: ValueKey(mode),
          title: title,
          submitLabel: switch (mode) {
            AuthMode.signIn => 'SIGN IN',
            AuthMode.signUp => 'CREATE FREE ACCOUNT',
            AuthMode.forgot => 'SEND RESET CODE',
            AuthMode.reset => 'RESET PASSWORD',
          },
          askEmail: mode != AuthMode.reset,
          askPassword: mode != AuthMode.forgot,
          confirmPassword: mode == AuthMode.signUp || mode == AuthMode.reset,
          askCode: mode == AuthMode.reset,
          busy: account.busy,
          passwordLabel: mode == AuthMode.reset ? 'New password' : 'Password',
          onSubmit: (email, password, code) async {
            if (mode == AuthMode.forgot) {
              await account.requestReset(email);
              if (context.mounted) context.go('/auth/reset');
              return;
            }
            if (mode == AuthMode.reset) {
              await account.confirmReset(code, password);
              if (context.mounted) context.go('/auth/login');
              return;
            }
            await account.signIn(
              email,
              password,
              register: mode == AuthMode.signUp,
            );
            if (context.mounted) context.go('/account/review');
          },
        ),
        const SizedBox(height: 20),
        if (mode == AuthMode.signIn) ...[
          TextButton(
            onPressed: () => context.go('/auth/forgot'),
            child: const Text('Forgot password?'),
          ),
          TextButton(
            onPressed: () => context.go('/auth/signup'),
            child: const Text('New here? Create a free account'),
          ),
        ],
        if (mode == AuthMode.signUp)
          TextButton(
            onPressed: () => context.go('/auth/login'),
            child: const Text('Already have an account? Sign in'),
          ),
        if (mode == AuthMode.forgot || mode == AuthMode.reset)
          TextButton(
            onPressed: () => context.go('/auth/login'),
            child: const Text('Back to sign in'),
          ),
        TextButton(
          onPressed: () => context.go('/home'),
          child: const Text('Continue locally as a guest'),
        ),
      ],
    );
  }
}
