import 'dart:convert';

import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/state/providers.dart';
import '../../core/theme/kinetiq_theme.dart';
import '../../core/utils/action.dart';
import '../../shared/widgets/k_button.dart';
import '../../shared/widgets/k_card.dart';
import '../../shared/widgets/k_choice.dart';
import '../../shared/widgets/k_header.dart';
import '../../shared/widgets/k_progress_bar.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int step = 0;
  @override
  void initState() {
    super.initState();
    _restoreDraft();
  }

  Future<void> _restoreDraft() async {
    try {
      final data = await ref
          .read(repositoryProvider)
          .preference('onboarding_draft');
      if (data == null || data.isEmpty) return;
      final values = jsonDecode(data) as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        step = ((values['step'] as num?)?.toInt() ?? 0).clamp(0, 5);
        experience = (values['experience'] as String?) ?? experience;
        goals
          ..clear()
          ..addAll((values['goals'] as List?)?.cast<String>() ?? []);
        equipment
          ..clear()
          ..addAll((values['equipment'] as List?)?.cast<String>() ?? []);
        days = (values['days'] as num?)?.toInt() ?? days;
        minutes = (values['minutes'] as num?)?.toInt() ?? minutes;
        nutrition = values['nutrition'] as String? ?? nutrition;
        imperial = values['imperial'] == true;
      });
    } catch (_) {
      /* Corrupt draft never blocks offline onboarding. */
    }
  }

  Future<void> _persistDraft() async {
    await ref
        .read(repositoryProvider)
        .setPreference(
          'onboarding_draft',
          jsonEncode({
            'step': step,
            'experience': experience,
            'goals': goals.toList(),
            'equipment': equipment.toList(),
            'days': days,
            'minutes': minutes,
            'nutrition': nutrition,
            'imperial': imperial,
          }),
        );
  }

  String experience = 'Beginner';
  final goals = <String>{'Build strength'};
  final equipment = <String>{'Full gym'};
  int days = 3, minutes = 45;
  String nutrition = 'Meals + macros';
  bool imperial = false;
  static const titles = [
    'Your training style',
    'What moves you?',
    'Your equipment',
    'Your rhythm',
    'Fuel & units',
    'Ready to begin',
  ];
  static const descriptions = [
    'Choose the amount of guidance you want. You can change it later.',
    'Select one or more goals. These are preferences, not prescriptions.',
    'Choose where and how you train. Skip anything that does not apply.',
    'This is an editable preference, not a commitment.',
    'Choose the tracking experience that suits you.',
    'Review your choices. Everything can be updated in Profile.',
  ];
  void next() {
    if (step < 5) {
      setState(() => step++);
      _persistDraft();
    } else {
      finish();
    }
  }

  void back() {
    if (step > 0) {
      setState(() => step--);
      _persistDraft();
    } else {
      context.go('/welcome');
    }
  }

  void flip(Set<String> set, String value) {
    setState(() {
      if (set.contains(value)) {
        set.remove(value);
      } else {
        set.add(value);
      }
    });
    _persistDraft();
  }

  Future<void> finish() async {
    final app = ref.read(appControllerProvider);
    await performAction(context, () async {
      await app.saveProfile(
        experience: experience,
        goal: goals.join(', '),
        equipment: equipment.join(', '),
        days: days,
        minutes: minutes,
        imperial: imperial,
        nutritionMode: nutrition,
      );
      if (mounted) context.go('/home');
    });
  }

  Widget choices(
    Iterable<String> options,
    bool Function(String) isSelected,
    void Function(String) tap,
  ) => Wrap(
    spacing: 10,
    runSpacing: 8,
    children: [
      for (final item in options)
        KChoice(
          label: item,
          selected: isSelected(item),
          onTap: () => tap(item),
        ),
    ],
  );
  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 700),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'K / KINETIQ',
                        style: TextStyle(
                          color: KColors.lime,
                          letterSpacing: 2,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '0${step + 1} / 06',
                        style: const TextStyle(color: KColors.muted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  KProgressBar(value: (step + 1) / 6),
                  const SizedBox(height: 20),
                  KHeader(
                    title: titles[step],
                    subtitle: descriptions[step],
                    compact: true,
                  ),
                  Expanded(
                    child: ListView(
                      children: [
                        if (step == 0)
                          choices(
                            ['Beginner', 'Intermediate', 'Advanced'],
                            (v) => experience == v,
                            (v) => setState(() => experience = v),
                          ),
                        if (step == 1)
                          choices(
                            [
                              'Build strength',
                              'Build muscle',
                              'Endurance',
                              'General fitness',
                              'Consistency',
                              'Mobility',
                            ],
                            goals.contains,
                            (v) => flip(goals, v),
                          ),
                        if (step == 2)
                          choices(
                            [
                              'Full gym',
                              'Home dumbbells',
                              'Resistance bands',
                              'Bodyweight',
                              'Outdoor / cardio',
                              'No equipment',
                            ],
                            equipment.contains,
                            (v) => flip(equipment, v),
                          ),
                        if (step == 3) ...[
                          KCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Training days per week',
                                  style: TextStyle(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 14),
                                choices(
                                  ['1', '2', '3', '4', '5', '6', '7'],
                                  (v) => days == int.parse(v),
                                  (v) => setState(() => days = int.parse(v)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          KCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Typical workout duration',
                                  style: TextStyle(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 14),
                                choices(
                                  ['20', '30', '45', '60', '90'],
                                  (v) => minutes == int.parse(v),
                                  (v) => setState(() => minutes = int.parse(v)),
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (step == 4) ...[
                          const Text(
                            'NUTRITION',
                            style: TextStyle(
                              color: KColors.lime,
                              letterSpacing: 1.5,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 14),
                          choices(
                            [
                              'Meals + macros',
                              'Simple diary',
                              'Hydration only',
                              'Not now',
                            ],
                            (v) => nutrition == v,
                            (v) => setState(() => nutrition = v),
                          ),
                          const SizedBox(height: 24),
                          const Text(
                            'MEASUREMENT UNITS',
                            style: TextStyle(
                              color: KColors.lime,
                              letterSpacing: 1.5,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 14),
                          choices(
                            ['Metric', 'Imperial'],
                            (v) => imperial == (v == 'Imperial'),
                            (v) => setState(() => imperial = v == 'Imperial'),
                          ),
                        ],
                        if (step == 5)
                          KCard(
                            child: Column(
                              children: [
                                _summary('Level', experience),
                                _summary(
                                  'Goals',
                                  goals.isEmpty ? 'Not set' : goals.join(', '),
                                ),
                                _summary(
                                  'Equipment',
                                  equipment.isEmpty
                                      ? 'Not set'
                                      : equipment.join(', '),
                                ),
                                _summary(
                                  'Training',
                                  '$days days/week · $minutes min',
                                ),
                                _summary('Nutrition', nutrition),
                                _summary(
                                  'Units',
                                  imperial ? 'Imperial' : 'Metric',
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  KButton(
                    label: step == 5 ? 'START AS GUEST' : 'CONTINUE',
                    busy: app.working,
                    onPressed: next,
                    icon: Icons.arrow_forward,
                  ),
                  if (step == 5) ...[
                    const SizedBox(height: 9),
                    KButton(
                      label: 'SAVE AND CREATE FREE ACCOUNT',
                      style: KButtonStyle.secondary,
                      onPressed: () async {
                        await ref
                            .read(appControllerProvider)
                            .saveProfile(
                              experience: experience,
                              goal: goals.join(', '),
                              equipment: equipment.join(', '),
                              days: days,
                              minutes: minutes,
                              imperial: imperial,
                              nutritionMode: nutrition,
                            );
                        if (context.mounted) {
                          context.go('/auth/signup');
                        }
                      },
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(onPressed: back, child: const Text('Back')),
                      if (step < 5)
                        TextButton(
                          onPressed: next,
                          child: const Text('Skip for now'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _summary(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 92,
          child: Text(label, style: const TextStyle(color: KColors.muted)),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    ),
  );
}
