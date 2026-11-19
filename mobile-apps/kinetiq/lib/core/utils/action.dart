import 'package:material_ui/material_ui.dart';

import 'formatters.dart';

/// A single shared UI error boundary for user-triggered asynchronous writes.
Future<T?> performAction<T>(
  BuildContext context,
  Future<T> Function() action, {
  String? success,
}) async {
  try {
    final result = await action();
    if (context.mounted && success != null) feedback(context, success);
    return result;
  } catch (error) {
    if (context.mounted) {
      feedback(context, error.toString().replaceFirst('Bad state: ', ''));
    }
    return null;
  }
}
