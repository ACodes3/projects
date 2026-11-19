import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';
import 'package:flutter/foundation.dart';

import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_card.dart';

/// Simple zero-dependency chart that only plots supplied measured values.
class TrendChart extends StatelessWidget {
  const TrendChart({
    super.key,
    required this.values,
    required this.labels,
    required this.title,
    this.unit = '',
  });
  final List<double> values;
  final List<String> labels;
  final String title, unit;
  @override
  Widget build(BuildContext context) {
    final max = values.isEmpty ? 0.0 : values.reduce(math.max);
    return Semantics(
      label:
          '$title: ${List.generate(values.length, (i) => '${labels[i]} ${values[i].toStringAsFixed(0)} $unit').join(', ')}',
      child: KCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 10),
            Text(
              'Peak ${max.toStringAsFixed(0)} $unit',
              style: const TextStyle(color: KColors.muted, fontSize: 12),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 120,
              width: double.infinity,
              child: CustomPaint(painter: _TrendPainter(values)),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                for (final item in labels)
                  Flexible(
                    child: Text(
                      item,
                      style: const TextStyle(
                        fontSize: 10,
                        color: KColors.muted,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TrendPainter extends CustomPainter {
  const _TrendPainter(this.values);
  final List<double> values;
  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = KColors.outline
      ..strokeWidth = 1;
    for (var i = 0; i < 4; i++) {
      final y = size.height * i / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
    if (values.isEmpty) return;
    final max = math.max(1.0, values.reduce(math.max));
    final dx = values.length == 1 ? 0.0 : size.width / (values.length - 1);
    final path = Path();
    for (var i = 0; i < values.length; i++) {
      final p = Offset(dx * i, size.height - (values[i] / max) * size.height);
      if (i == 0) {
        path.moveTo(p.dx, p.dy);
      } else {
        path.lineTo(p.dx, p.dy);
      }
    }
    final linePaint = Paint()
      ..color = KColors.lime
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(path, linePaint);
    for (var i = 0; i < values.length; i++) {
      final p = Offset(dx * i, size.height - (values[i] / max) * size.height);
      canvas.drawCircle(p, 4, Paint()..color = KColors.lime);
    }
  }

  @override
  bool shouldRepaint(covariant _TrendPainter oldDelegate) =>
      !listEquals(oldDelegate.values, values);
}
