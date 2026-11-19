import 'dart:async';

import 'package:material_ui/material_ui.dart';

import '../../../core/domain/models.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_number_field.dart';

/// One universal set editor: inputs are chosen from [mode] props.
/// Actual values persist without requiring set completion.
class SetRow extends StatefulWidget {
  const SetRow({
    super.key,
    required this.set,
    required this.mode,
    required this.imperial,
    required this.onSave,
    required this.onDelete,
    this.onDetails,
  });
  final LoggedSet set;
  final String mode;
  final bool imperial;
  final Future<void> Function({
    double? weightKg,
    int? reps,
    int? seconds,
    double? meters,
    required bool completed,
  })
  onSave;
  final VoidCallback onDelete;
  final VoidCallback? onDetails;
  @override
  State<SetRow> createState() => _SetRowState();
}

class _SetRowState extends State<SetRow> {
  late TextEditingController weight, reps, seconds, meters;
  Timer? _debounce;
  bool _saving = false;
  @override
  void initState() {
    super.initState();
    _initialize();
  }

  void _initialize() {
    weight = TextEditingController(
      text: widget.set.weightKg == null
          ? ''
          : numberLabel(
              displayWeight(widget.set.weightKg!, widget.imperial),
              1,
            ),
    );
    reps = TextEditingController(text: widget.set.reps?.toString() ?? '');
    seconds = TextEditingController(text: widget.set.seconds?.toString() ?? '');
    meters = TextEditingController(text: widget.set.meters?.toString() ?? '');
  }

  @override
  void didUpdateWidget(covariant SetRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.set.id != widget.set.id ||
        oldWidget.imperial != widget.imperial) {
      weight.dispose();
      reps.dispose();
      seconds.dispose();
      meters.dispose();
      _initialize();
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    weight.dispose();
    reps.dispose();
    seconds.dispose();
    meters.dispose();
    super.dispose();
  }

  void scheduleSave() {
    _debounce?.cancel();
    _debounce = Timer(
      const Duration(milliseconds: 600),
      () => save(widget.set.completed),
    );
  }

  Future<void> save(bool completed) async {
    if (_saving) return;
    _debounce?.cancel();
    _saving = true;
    try {
      await widget.onSave(
        weightKg: double.tryParse(weight.text) == null
            ? null
            : canonicalWeight(double.parse(weight.text), widget.imperial),
        reps: int.tryParse(reps.text),
        seconds: int.tryParse(seconds.text),
        meters: double.tryParse(meters.text),
        completed: completed,
      );
    } finally {
      _saving = false;
    }
  }

  Widget field(
    String label,
    TextEditingController controller, {
    String? suffix,
    bool decimal = true,
  }) => Expanded(
    child: KNumberField(
      controller: controller,
      label: label,
      suffix: suffix,
      decimal: decimal,
      onChanged: (_) => scheduleSave(),
    ),
  );
  @override
  Widget build(BuildContext context) {
    final mode = widget.mode;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              '${widget.set.position + 1}',
              style: const TextStyle(
                color: KColors.muted,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          if (mode == 'weight_reps') ...[
            field('Weight', weight, suffix: widget.imperial ? 'lb' : 'kg'),
            const SizedBox(width: 8),
            field('Reps', reps, decimal: false),
          ],
          if (mode == 'reps') field('Reps', reps, decimal: false),
          if (mode == 'duration') field('Seconds', seconds, decimal: false),
          if (mode == 'distance') field('Meters', meters),
          const SizedBox(width: 7),
          IconButton(
            tooltip: widget.set.completed ? 'Mark incomplete' : 'Complete set',
            onPressed: () => save(!widget.set.completed),
            icon: Icon(
              widget.set.completed
                  ? Icons.check_circle
                  : Icons.radio_button_unchecked,
              color: widget.set.completed ? KColors.lime : KColors.muted,
            ),
          ),
          PopupMenuButton<String>(
            tooltip: 'Set actions',
            icon: const Icon(Icons.more_vert, size: 20),
            onSelected: (value) {
              if (value == 'details') {
                widget.onDetails?.call();
              } else if (value == 'delete') {
                widget.onDelete();
              }
            },
            itemBuilder: (context) => [
              if (widget.onDetails != null)
                const PopupMenuItem(
                  value: 'details',
                  child: Text('Set details'),
                ),
              const PopupMenuItem(value: 'delete', child: Text('Delete set')),
            ],
          ),
        ],
      ),
    );
  }
}
