import 'package:material_ui/material_ui.dart';

import '../../core/theme/kinetiq_theme.dart';
import 'k_button.dart';
import 'k_card.dart';

class KEmptyState extends StatelessWidget {
  const KEmptyState({
    super.key,
    required this.title,
    required this.message,
    this.icon = Icons.inbox_outlined,
    this.actionLabel,
    this.onAction,
  });
  final String title, message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;
  @override
  Widget build(BuildContext context) => KCard(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: KColors.surfaceRaised,
            child: Icon(icon, color: KColors.lime, size: 26),
          ),
          const SizedBox(height: 15),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 7),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: KColors.muted, height: 1.45),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 18),
            KButton(label: actionLabel!, onPressed: onAction, expanded: false),
          ],
        ],
      ),
    ),
  );
}
