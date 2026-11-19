import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';

/// Reusable numeric input for sets, hydration, portions, cardio and goals.
class KNumberField extends StatelessWidget {
  const KNumberField({
    super.key,
    required this.controller,
    required this.label,
    this.decimal = true,
    this.onChanged,
    this.suffix,
    this.enabled = true,
  });
  final TextEditingController controller;
  final String label;
  final bool decimal, enabled;
  final String? suffix;
  final ValueChanged<String>? onChanged;
  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    enabled: enabled,
    keyboardType: TextInputType.numberWithOptions(decimal: decimal),
    inputFormatters: [
      FilteringTextInputFormatter.allow(
        decimal ? RegExp(r'^\d*\.?\d*$') : RegExp(r'^\d*$'),
      ),
    ],
    onChanged: onChanged,
    decoration: InputDecoration(labelText: label, suffixText: suffix),
  );
}
