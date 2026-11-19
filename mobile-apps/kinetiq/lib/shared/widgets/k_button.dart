import 'package:material_ui/material_ui.dart';

import '../../core/theme/kinetiq_theme.dart';

enum KButtonStyle { primary, secondary, ghost, danger }

class KButton extends StatelessWidget {
  const KButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.style = KButtonStyle.primary,
    this.expanded = true,
    this.busy = false,
  });
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final KButtonStyle style;
  final bool expanded, busy;
  @override
  Widget build(BuildContext context) {
    final bg = switch (style) {
      KButtonStyle.primary => KColors.lime,
      KButtonStyle.secondary => KColors.surfaceRaised,
      KButtonStyle.ghost => Colors.transparent,
      KButtonStyle.danger => KColors.danger.withValues(alpha: 0.14),
    };
    final fg = switch (style) {
      KButtonStyle.primary => KColors.background,
      KButtonStyle.danger => KColors.danger,
      _ => KColors.text,
    };
    final content = busy
        ? SizedBox(
            height: 18,
            width: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: fg),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18),
                const SizedBox(width: 9),
              ],
              Flexible(
                child: Text(
                  label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          );
    final button = FilledButton(
      onPressed: busy ? null : onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: fg,
        disabledBackgroundColor: bg.withValues(alpha: 0.45),
        elevation: 0,
        minimumSize: const Size(0, 48),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(
            color: style == KButtonStyle.ghost
                ? KColors.outline
                : Colors.transparent,
          ),
        ),
      ),
      child: content,
    );
    return expanded ? SizedBox(width: double.infinity, child: button) : button;
  }
}
