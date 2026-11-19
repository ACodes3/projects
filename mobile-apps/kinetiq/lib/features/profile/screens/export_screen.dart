import 'dart:io';

import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/state/providers.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_screen.dart';

class ExportScreen extends ConsumerStatefulWidget {
  const ExportScreen({super.key});
  @override
  ConsumerState<ExportScreen> createState() => _ExportScreenState();
}

class _ExportScreenState extends ConsumerState<ExportScreen> {
  bool busy = false;
  String? savedPath;
  Future<File> _createExport() async {
    final data = await ref.read(repositoryProvider).exportJson();
    final dir = await getApplicationDocumentsDirectory();
    final now = DateTime.now();
    final filename =
        'kinetiq_${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}_${now.millisecondsSinceEpoch}.json';
    final file = File('${dir.path}/$filename');
    await file.writeAsString(data, flush: true);
    if (mounted) setState(() => savedPath = file.path);
    return file;
  }

  Future<void> _run(Future<void> Function() work) async {
    if (busy) return;
    setState(() => busy = true);
    try {
      await performAction(context, work);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => KScreen(
    title: 'Your data belongs to you',
    eyebrow: 'SETTINGS / EXPORT',
    back: true,
    subtitle: 'Your guest records are saved locally. You can export without an account or subscription.',
    children: [
      KCard(
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lock_outline, color: KColors.lime),
                SizedBox(width: 10),
                Text(
                  'A PRIVATE FILE',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
            SizedBox(height: 12),
            Text(
              'Exports contain workouts, actual sets, foods, meal history, hydration, preferences and other local records. Anyone with the JSON file may read that information.',
            ),
            SizedBox(height: 10),
            Text(
              'The export is unencrypted. Store and share it carefully.',
              style: TextStyle(color: KColors.orange, fontSize: 12),
            ),
          ],
        ),
      ),
      const SizedBox(height: 22),
      KButton(
        label: 'EXPORT & SHARE JSON',
        icon: Icons.ios_share,
        busy: busy,
        onPressed: () => _run(() async {
          final file = await _createExport();

          if (!context.mounted) return;

          final render = context.findRenderObject() as RenderBox?;
          await SharePlus.instance.share(
            ShareParams(
              files: [XFile(file.path, mimeType: 'application/json')],
              title: 'KINETIQ local data export',
              sharePositionOrigin: render == null
                  ? null
                  : render.localToGlobal(Offset.zero) & render.size,
            ),
          );
        }),
      ),
      const SizedBox(height: 12),
      KButton(
        label: 'COPY JSON TO CLIPBOARD',
        icon: Icons.copy,
        style: KButtonStyle.secondary,
        busy: busy,
        onPressed: () => _run(() async {
          final data = await ref.read(repositoryProvider).exportJson();
          await Clipboard.setData(ClipboardData(text: data));
          if (context.mounted) {
            feedback(context, 'JSON copied to clipboard.');
          }
        }),
      ),
      const SizedBox(height: 12),
      KButton(
        label: 'SAVE IN APP DOCUMENTS',
        icon: Icons.save_alt,
        style: KButtonStyle.secondary,
        busy: busy,
        onPressed: () => _run(() async {
          final file = await _createExport();
          if (context.mounted) {
            feedback(context, 'Saved ${file.path}');
          }
        }),
      ),
      if (savedPath != null) ...[
        const SizedBox(height: 15),
        SelectableText(
          'Latest local export: $savedPath',
          style: const TextStyle(color: KColors.muted, fontSize: 11),
        ),
      ],
      const SizedBox(height: 20),
      const Text(
        'Import, cloud restore, and account migration are not implemented in this version. Keep your export safe; uninstalling the app may erase its local database.',
        style: TextStyle(color: KColors.muted, fontSize: 12, height: 1.5),
      ),
    ],
  );
}
