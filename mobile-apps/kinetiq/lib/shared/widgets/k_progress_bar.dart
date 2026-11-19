import 'package:material_ui/material_ui.dart';

import '../../core/theme/kinetiq_theme.dart';

class KProgressBar extends StatelessWidget {
  const KProgressBar({
    super.key,
    required this.value,
    this.label,
    this.trailing,
  });
  final double value;
  final String? label, trailing;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      if (label != null || trailing != null) ...[
        Row(
          children: [
            if (label != null)
              Expanded(
                child: Text(
                  label!,
                  style: const TextStyle(color: KColors.muted, fontSize: 12),
                ),
              ),
            if (trailing != null)
              Text(
                trailing!,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
          ],
        ),
        const SizedBox(height: 9),
      ],
      ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: LinearProgressIndicator(
          value: value.clamp(0, 1).toDouble(),
          minHeight: 8,
          backgroundColor: KColors.outline,
          color: KColors.lime,
        ),
      ),
    ],
  );
}
