import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/kinetiq_theme.dart';

/// The ONLY header used by all screens; presentation is controlled by props.
class KHeader extends StatelessWidget {
  const KHeader({
    super.key,
    required this.title,
    this.eyebrow,
    this.subtitle,
    this.trailing,
    this.showBack = false,
    this.onBack,
    this.compact = false,
  });
  final String title;
  final String? eyebrow, subtitle;
  final Widget? trailing;
  final bool showBack, compact;
  final VoidCallback? onBack;
  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.only(top: compact ? 10 : 16, bottom: compact ? 18 : 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showBack) ...[
          InkWell(
            onTap:
                onBack ??
                () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/train');
                  }
                },
            borderRadius: BorderRadius.circular(12),
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.arrow_back_rounded, size: 19),
                  SizedBox(width: 8),
                  Text(
                    'BACK',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (eyebrow != null) ...[
          Text(
            eyebrow!.toUpperCase(),
            style: const TextStyle(
              color: KColors.lime,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 8),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Text(
                title,
                style: (compact
                    ? Theme.of(context).textTheme.headlineMedium
                    : Theme.of(context).textTheme.headlineLarge),
              ),
            ),
            if (trailing != null) ...[const SizedBox(width: 12), trailing!],
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 9),
          Text(
            subtitle!,
            style: const TextStyle(
              color: KColors.muted,
              fontSize: 13,
              height: 1.45,
            ),
          ),
        ],
      ],
    ),
  );
}
