import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/state/providers.dart';
import '../../core/theme/kinetiq_theme.dart';
import '../../core/utils/action.dart';
import '../../shared/widgets/k_button.dart';
import '../../shared/widgets/k_card.dart';

class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Padding(
              padding: const EdgeInsets.all(26),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Spacer(),
                  const Text(
                    'K / KINETIQ',
                    style: TextStyle(
                      color: KColors.lime,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                      fontSize: 17,
                    ),
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    'TRAIN.\nFUEL.\nEVOLVE.',
                    style: TextStyle(
                      fontSize: 54,
                      fontWeight: FontWeight.w900,
                      height: .99,
                      letterSpacing: -1.5,
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Your training and nutrition, built around you. Fully usable offline.',
                    style: TextStyle(
                      color: KColors.muted,
                      height: 1.6,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 30),
                  const KCard(
                    child: Row(
                      children: [
                        Icon(Icons.offline_bolt_outlined, color: KColors.lime),
                        SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'Guest-first. Your activity stays on this device. No account or AI required.',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  KButton(
                    label: 'GET STARTED',
                    icon: Icons.arrow_forward_rounded,
                    onPressed: () => context.go('/onboarding'),
                  ),
                  const SizedBox(height: 12),
                  KButton(
                    label: 'EXPLORE AS GUEST',
                    style: KButtonStyle.secondary,
                    busy: app.working,
                    onPressed: () => performAction(context, () async {
                      await app.mutate(
                        (r) => r.setPreference('onboarded', 'true'),
                      );
                      if (context.mounted) context.go('/home');
                    }),
                  ),
                  const SizedBox(height: 12),
                  KButton(
                    label: 'SIGN IN',
                    style: KButtonStyle.ghost,
                    icon: Icons.login,
                    onPressed: () => context.push('/auth/login'),
                  ),
                  const SizedBox(height: 8),
                  KButton(
                    label: 'CREATE FREE ACCOUNT',
                    style: KButtonStyle.ghost,
                    icon: Icons.person_add_outlined,
                    onPressed: () => context.push('/auth/signup'),
                  ),
                  const SizedBox(height: 16),
                  const Center(
                    child: Text(
                      'Local tracking always works. Cloud backup needs a connected account server.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: KColors.muted, fontSize: 11),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
