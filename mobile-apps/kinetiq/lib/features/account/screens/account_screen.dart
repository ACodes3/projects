import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final account = ref.watch(accountControllerProvider);
    return KScreen(
      title: 'Your account',
      eyebrow: 'PROFILE / ACCOUNT',
      back: true,
      subtitle: 'Your local logs remain yours whether you sign in or not.',
      children: [
        KCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                account.accountLabel.toUpperCase(),
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  color: KColors.lime,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                account.email ??
                    'Your data is currently stored on this device.',
              ),
              if (account.error != null) ...[
                const SizedBox(height: 8),
                Text(
                  account.error!,
                  style: const TextStyle(color: KColors.muted),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 18),
        if (!account.signedIn) ...[
          KButton(
            label: 'CREATE FREE ACCOUNT',
            icon: Icons.person_add_alt,
            onPressed: () => context.push('/auth/signup'),
          ),
          const SizedBox(height: 10),
          KButton(
            label: 'SIGN IN',
            style: KButtonStyle.secondary,
            onPressed: () => context.push('/auth/login'),
          ),
        ] else ...[
          KSection(
            title: 'Backup and restore',
            child: KListTile(
              title: 'Review local & cloud data',
              subtitle: 'Explicit import/export; never automatically replace local records',
              icon: Icons.cloud_outlined,
              onTap: () => context.push('/account/review'),
            ),
          ),
          if (!account.verified) ...[
            const SizedBox(height: 12),
            KListTile(
              title: 'Verify email',
              subtitle: 'Requires configured email delivery',
              icon: Icons.mark_email_unread_outlined,
              onTap: () => context.push('/account/security'),
            ),
          ],
          KSection(
            title: 'Security',
            child: KListTile(
              title: 'Password and verification',
              subtitle: 'Change password or verify email address',
              icon: Icons.lock_outline,
              onTap: () => context.push('/account/security'),
            ),
          ),
          KSection(
            title: 'Plan',
            child: KListTile(
              title: 'Free account',
              subtitle: 'Pro purchases are disabled until store billing is integrated',
              icon: Icons.workspace_premium_outlined,
              onTap: () => context.push('/billing'),
            ),
          ),
          KButton(
            label: 'SIGN OUT',
            style: KButtonStyle.secondary,
            busy: account.busy,
            onPressed: () async {
              if (await confirmAction(
                    context,
                    title: 'Sign out?',
                    message:
                        'Local workouts and nutrition stay on this device.',
                    confirm: 'Sign out',
                  ) &&
                  context.mounted) {
                await performAction(context, () => account.signOut());
                if (context.mounted) ref.read(appControllerProvider).reload();
              }
            },
          ),
          const SizedBox(height: 12),
          KButton(
            label: 'DELETE CLOUD ACCOUNT',
            style: KButtonStyle.danger,
            onPressed: () async {
              if (await confirmAction(
                    context,
                    title: 'Delete cloud account?',
                    message: 'This permanently deletes the account and its server backup. Local data stays on this device.',
                    confirm: 'Delete cloud account',
                    destructive: true,
                  ) &&
                  context.mounted) {
                await performAction(context, () => account.deleteAccount());
                if (context.mounted) ref.read(appControllerProvider).reload();
              }
            },
          ),
        ],
        const SizedBox(height: 16),
        KListTile(
          title: 'Data & privacy',
          subtitle: 'Export, import or explicitly clear local records',
          icon: Icons.security_outlined,
          onTap: () => context.push('/data'),
        ),
      ],
    );
  }
}
