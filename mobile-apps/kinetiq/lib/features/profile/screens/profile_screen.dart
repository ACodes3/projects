import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/state/providers.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../core/utils/action.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_choice.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_screen.dart';
import '../../../shared/widgets/k_section.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool initialized = false, imperial = false;
  String experience = 'Beginner',
      goal = 'Build strength',
      equipment = 'Full gym',
      nutrition = 'Meals + macros';
  int days = 3, minutes = 45;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!initialized) {
      initialized = true;
      final app = ref.read(appControllerProvider);
      experience = app.experience;
      goal = app.goal;
      equipment = app.equipment;
      imperial = app.imperial;
      days = app.daysPerWeek;
      minutes = app.minutesPerWorkout;
      nutrition = app.nutritionMode;
    }
  }

  Widget choose(
    List<String> options,
    String current,
    ValueChanged<String> change,
  ) => Wrap(
    spacing: 8,
    runSpacing: 7,
    children: [
      for (final option in options)
        KChoice(
          label: option,
          selected: current == option,
          onTap: () => setState(() => change(option)),
        ),
    ],
  );
  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final account = ref.watch(accountControllerProvider);
    return KScreen(
      title: 'Training profile',
      eyebrow: 'SETTINGS / PREFERENCES',
      subtitle: 'Experience settings guide the interface, never restrict your workout data.',
      back: true,
      children: [
        KListTile(
          title: account.accountLabel,
          subtitle:
              account.email ?? 'Account, cloud backup, sign-in and privacy',
          icon: Icons.manage_accounts_outlined,
          onTap: () => context.push('/account'),
        ),
        KSection(
          title: 'Experience',
          child: choose(
            ['Beginner', 'Intermediate', 'Advanced'],
            experience,
            (v) => experience = v,
          ),
        ),
        KSection(
          title: 'Primary goals',
          child: choose(
            [
              'Build strength',
              'Build muscle',
              'Endurance',
              'General fitness',
              'Consistency',
              'Mobility',
            ],
            goal,
            (v) => goal = v,
          ),
        ),
        KSection(
          title: 'Equipment',
          child: choose(
            [
              'Full gym',
              'Home dumbbells',
              'Resistance bands',
              'Bodyweight',
              'Outdoor / cardio',
              'No equipment',
            ],
            equipment,
            (v) => equipment = v,
          ),
        ),
        KSection(
          title: 'Training days per week',
          child: choose(
            ['1', '2', '3', '4', '5', '6', '7'],
            '$days',
            (v) => days = int.parse(v),
          ),
        ),
        KSection(
          title: 'Typical duration',
          child: choose(
            ['20', '30', '45', '60', '90'],
            '$minutes',
            (v) => minutes = int.parse(v),
          ),
        ),
        KSection(
          title: 'Nutrition mode',
          child: choose(
            ['Meals + macros', 'Simple diary', 'Hydration only', 'Not now'],
            nutrition,
            (v) => nutrition = v,
          ),
        ),
        KSection(
          title: 'Units',
          child: choose(
            ['Metric', 'Imperial'],
            imperial ? 'Imperial' : 'Metric',
            (v) => imperial = v == 'Imperial',
          ),
        ),
        const SizedBox(height: 24),
        KButton(
          label: 'SAVE PREFERENCES',
          icon: Icons.check,
          onPressed: app.working
              ? null
              : () async {
                  await performAction(
                    context,
                    () => app.saveProfile(
                      experience: experience,
                      goal: goal,
                      equipment: equipment,
                      days: days,
                      minutes: minutes,
                      imperial: imperial,
                      nutritionMode: nutrition,
                    ),
                    success: 'Preferences saved on this device',
                  );
                },
        ),
        KSection(
          title: 'Your data',
          child: KListTile(
            title: 'Data and privacy',
            subtitle: 'Export, import, or clear data with confirmation',
            icon: Icons.ios_share,
            onTap: () => context.push('/data'),
          ),
        ),
        const SizedBox(height: 12),
        KListTile(
          title: 'Replay onboarding',
          subtitle: 'Revisit your initial preferences; existing logs are kept',
          icon: Icons.replay,
          onTap: () => context.push('/onboarding'),
        ),
        const SizedBox(height: 18),
        const Text(
          'All tracking remains local-first. Account services and backup require your own configured server; subscription purchases are disabled.',
          style: TextStyle(color: KColors.muted, fontSize: 12, height: 1.5),
        ),
      ],
    );
  }
}
