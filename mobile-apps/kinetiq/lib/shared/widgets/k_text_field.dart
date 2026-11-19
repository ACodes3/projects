import 'package:material_ui/material_ui.dart';

class KTextField extends StatelessWidget {
  const KTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.lines = 1,
    this.keyboardType,
    this.onChanged,
    this.prefix,
    this.suffix,
    this.readOnly = false,
    this.obscure = false,
    this.autofillHints,
    this.inputAction,
  });
  final TextEditingController controller;
  final String label;
  final String? hint;
  final int lines;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final Widget? prefix, suffix;
  final bool readOnly, obscure;
  final Iterable<String>? autofillHints;
  final TextInputAction? inputAction;
  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    readOnly: readOnly,
    obscureText: obscure,
    maxLines: lines,
    keyboardType: keyboardType,
    onChanged: onChanged,
    textInputAction: inputAction,
    autofillHints: autofillHints,
    decoration: InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: prefix,
      suffixIcon: suffix,
    ),
  );
}
