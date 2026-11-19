import 'package:material_ui/material_ui.dart';

import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../core/theme/kinetiq_theme.dart';

class BillingScreen extends StatelessWidget {
  const BillingScreen({super.key});
  @override
  Widget build(BuildContext context) => const KScreen(
    title: 'KINETIQ plans',
    eyebrow: 'ACCOUNT / PLAN',
    back: true,
    subtitle:
        'Core training, nutrition and export remain available without Pro.',
    children: [
      KCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'FREE ACCOUNT',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: KColors.lime,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'Local workouts, routine library, diary, hydration, history and manual backup.',
            ),
          ],
        ),
      ),
      SizedBox(height: 14),
      KCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'PRO · NOT YET AVAILABLE',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 12),
            Text(
              'Pro subscriptions, purchasing, entitlement verification and restore purchases are not configured. No purchase can be made.',
            ),
          ],
        ),
      ),
    ],
  );
}
