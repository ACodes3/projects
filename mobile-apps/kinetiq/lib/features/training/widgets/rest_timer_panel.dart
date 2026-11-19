import 'dart:async';

import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/state/providers.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';

/// Deadline-based timer persists even if the widget or app is killed.
class RestTimerPanel extends ConsumerStatefulWidget {
  const RestTimerPanel({
    super.key,
    required this.sessionId,
    this.defaultSeconds = 90,
  });
  final String sessionId;
  final int defaultSeconds;
  @override
  ConsumerState<RestTimerPanel> createState() => _RestTimerPanelState();
}

class _RestTimerPanelState extends ConsumerState<RestTimerPanel> {
  Timer? ticker;
  int? deadlineMs;
  int remainingMs = 90000;
  bool loaded = false;
  String get _deadlineKey => 'rest_deadline_${widget.sessionId}';
  String get _remainingKey => 'rest_remaining_${widget.sessionId}';
  int get remaining => deadlineMs == null
      ? remainingMs
      : ((deadlineMs! - DateTime.now().millisecondsSinceEpoch).clamp(
          0,
          99999999,
        )).toInt();
  bool get running => deadlineMs != null && remaining > 0;
  @override
  void initState() {
    super.initState();
    remainingMs = widget.defaultSeconds * 1000;
    _restore();
    ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  Future<void> _restore() async {
    final repo = ref.read(repositoryProvider);
    final savedDeadline = int.tryParse(
      await repo.preference(_deadlineKey) ?? '',
    );
    final savedRemaining = int.tryParse(
      await repo.preference(_remainingKey) ?? '',
    );
    if (!mounted) return;
    setState(() {
      deadlineMs = savedDeadline != null && savedDeadline > 0
          ? savedDeadline
          : null;
      remainingMs = savedRemaining ?? widget.defaultSeconds * 1000;
      loaded = true;
    });
  }

  Future<void> _persist() async {
    final repo = ref.read(repositoryProvider);
    await repo.db.transaction(() async {
      await repo.setPreference(_deadlineKey, '${deadlineMs ?? 0}');
      await repo.setPreference(_remainingKey, '$remainingMs');
    });
  }

  Future<void> _start() async {
    setState(
      () => deadlineMs = DateTime.now().millisecondsSinceEpoch + remainingMs,
    );
    await _persist();
  }

  Future<void> _pause() async {
    final left = remaining;
    setState(() {
      remainingMs = left;
      deadlineMs = null;
    });
    await _persist();
  }

  Future<void> _reset() async {
    setState(() {
      remainingMs = widget.defaultSeconds * 1000;
      deadlineMs = null;
    });
    await _persist();
  }

  Future<void> _adjust(int seconds) async {
    setState(() {
      if (deadlineMs != null) {
        deadlineMs = deadlineMs! + seconds * 1000;
      } else {
        remainingMs = (remainingMs + seconds * 1000).clamp(0, 3600000).toInt();
      }
    });
    await _persist();
  }

  @override
  void dispose() {
    ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => KCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.timer_outlined, color: KColors.lime, size: 21),
            SizedBox(width: 8),
            Text(
              'REST TIMER',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Text(
              loaded
                  ? durationLabel(Duration(milliseconds: remaining))
                  : '--:--',
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 35),
            ),
            const Spacer(),
            IconButton(
              onPressed: loaded ? () => _adjust(-15) : null,
              tooltip: 'Minus 15 seconds',
              icon: const Icon(Icons.remove_circle_outline),
            ),
            IconButton(
              onPressed: loaded ? () => _adjust(15) : null,
              tooltip: 'Plus 15 seconds',
              icon: const Icon(Icons.add_circle_outline),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: KButton(
                label: running ? 'Pause' : 'Start / resume',
                icon: running ? Icons.pause : Icons.play_arrow,
                expanded: true,
                onPressed: !loaded
                    ? null
                    : running
                    ? _pause
                    : _start,
              ),
            ),
            const SizedBox(width: 10),
            KButton(
              label: 'Reset',
              style: KButtonStyle.secondary,
              expanded: false,
              onPressed: loaded ? _reset : null,
            ),
          ],
        ),
      ],
    ),
  );
}
