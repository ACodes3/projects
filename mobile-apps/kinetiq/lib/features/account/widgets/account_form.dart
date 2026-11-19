import 'package:material_ui/material_ui.dart';

import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_text_field.dart';

/// Universal, prop-configured sign-in / sign-up / password-reset form.
class AccountForm extends StatefulWidget {
  const AccountForm({
    super.key,
    required this.title,
    required this.submitLabel,
    required this.onSubmit,
    this.askEmail = true,
    this.askPassword = true,
    this.confirmPassword = false,
    this.askCode = false,
    this.busy = false,
    this.passwordLabel = 'Password',
    this.initialEmail,
  });
  final String title, submitLabel, passwordLabel;
  final bool askEmail, askPassword, confirmPassword, askCode, busy;
  final String? initialEmail;
  final Future<void> Function(String email, String password, String code)
  onSubmit;
  @override
  State<AccountForm> createState() => _AccountFormState();
}

class _AccountFormState extends State<AccountForm> {
  late final email = TextEditingController(text: widget.initialEmail);
  final password = TextEditingController(),
      confirm = TextEditingController(),
      code = TextEditingController();
  String? error;
  bool hidden = true;
  @override
  void dispose() {
    email.dispose();
    password.dispose();
    confirm.dispose();
    code.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (widget.askEmail &&
        !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email.text.trim())) {
      setState(() => error = 'Enter a valid email address.');
      return;
    }
    if (widget.askPassword && password.text.length < 12) {
      setState(() => error = 'Password must contain at least 12 characters.');
      return;
    }
    if (widget.confirmPassword && password.text != confirm.text) {
      setState(() => error = 'Passwords do not match.');
      return;
    }
    if (widget.askCode && code.text.trim().isEmpty) {
      setState(() => error = 'Enter the code from your email.');
      return;
    }
    setState(() => error = null);
    try {
      await widget.onSubmit(email.text.trim(), password.text, code.text.trim());
    } catch (e) {
      if (mounted) {
        setState(() => error = e.toString().replaceFirst('Bad state: ', ''));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      if (widget.askEmail) ...[
        KTextField(
          controller: email,
          label: 'Email',
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
        ),
        const SizedBox(height: 14),
      ],
      if (widget.askCode) ...[
        KTextField(controller: code, label: 'Email code'),
        const SizedBox(height: 14),
      ],
      if (widget.askPassword) ...[
        KTextField(
          controller: password,
          label: widget.passwordLabel,
          obscure: hidden,
          suffix: IconButton(
            tooltip: hidden ? 'Show password' : 'Hide password',
            icon: Icon(
              hidden
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
            ),
            onPressed: () => setState(() => hidden = !hidden),
          ),
        ),
        const SizedBox(height: 14),
      ],
      if (widget.confirmPassword) ...[
        KTextField(
          controller: confirm,
          label: 'Confirm password',
          obscure: true,
        ),
        const SizedBox(height: 14),
      ],
      if (error != null) ...[
        Text(error!, style: const TextStyle(color: Colors.redAccent)),
        const SizedBox(height: 14),
      ],
      KButton(
        label: widget.submitLabel,
        busy: widget.busy,
        onPressed: widget.busy ? null : submit,
        icon: Icons.arrow_forward,
      ),
    ],
  );
}
