import 'package:material_ui/material_ui.dart';

String dayLabel(DateTime date) =>
    '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
String timeLabel(DateTime date) =>
    '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
String durationLabel(Duration duration) {
  final seconds = duration.inSeconds < 0 ? 0 : duration.inSeconds;
  final h = seconds ~/ 3600;
  final m = (seconds % 3600) ~/ 60;
  final s = seconds % 60;
  return h > 0
      ? '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}'
      : '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
}

String numberLabel(num? value, [int decimals = 0]) =>
    value == null ? '—' : value.toStringAsFixed(decimals);
String weightUnit(bool imperial) => imperial ? 'lb' : 'kg';
double displayWeight(double kilograms, bool imperial) =>
    imperial ? kilograms * 2.2046226218 : kilograms;
double canonicalWeight(double value, bool imperial) =>
    imperial ? value / 2.2046226218 : value;
String displayDistance(double meters, bool imperial) => imperial
    ? '${(meters / 1609.344).toStringAsFixed(2)} mi'
    : '${(meters / 1000).toStringAsFixed(2)} km';
void feedback(BuildContext context, String message) {
  if (!context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

Future<bool> confirmAction(
  BuildContext context, {
  required String title,
  required String message,
  String confirm = 'Confirm',
  bool destructive = false,
}) async {
  return await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              style: TextButton.styleFrom(
                foregroundColor: destructive
                    ? Theme.of(context).colorScheme.error
                    : null,
              ),
              child: Text(confirm),
            ),
          ],
        ),
      ) ??
      false;
}
