import 'package:material_ui/material_ui.dart';
import 'package:file_selector/file_selector.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/repository/kinetiq_repository.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_list_tile.dart';
import '../../../shared/widgets/k_screen.dart';

/// JSON may be pasted or imported from a file via the system share route later.
/// This screen exposes explicit preview and merge with no destructive overwrite.
class DataPrivacyScreen extends ConsumerStatefulWidget {
  const DataPrivacyScreen({super.key});
  @override
  ConsumerState<DataPrivacyScreen> createState() => _DataPrivacyScreenState();
}

class _DataPrivacyScreenState extends ConsumerState<DataPrivacyScreen> {
  final raw = TextEditingController();
  ImportPreview? preview;
  @override
  void dispose() {
    raw.dispose();
    super.dispose();
  }

  Future<void> _preview() async {
    final data = await performAction(
      context,
      () => ref.read(repositoryProvider).previewImport(raw.text),
    );
    if (mounted) setState(() => preview = data);
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    return KScreen(
      title: 'Your data & privacy',
      eyebrow: 'SETTINGS / OWNERSHIP',
      back: true,
      subtitle: 'Your local data is yours to review, back up and export without a subscription.',
      children: [
        KCard(
          child: Text(
            '${app.routines.length} routines · ${app.sessions.length} sessions · ${app.meals.length} meal entries · ${app.water.length} water entries',
          ),
        ),
        const SizedBox(height: 16),
        KListTile(
          title: 'Export complete JSON backup',
          subtitle: 'Share or save your personal local history',
          icon: Icons.ios_share,
          onTap: () => context.push('/export'),
        ),
        const SizedBox(height: 14),
        KButton(
          label: 'CHOOSE JSON BACKUP FILE',
          style: KButtonStyle.secondary,
          icon: Icons.folder_open_outlined,
          onPressed: () async {
            final file = await openFile(
              acceptedTypeGroups: [
                const XTypeGroup(label: 'KINETIQ JSON', extensions: ['json']),
              ],
            );
            if (file != null) {
              final contents = await file.readAsString();
              if (mounted) {
                setState(() {
                  raw.text = contents;
                  preview = null;
                });
              }
            }
          },
        ),
        const SizedBox(height: 14),
        const Text(
          'Import a KINETIQ export (paste JSON)',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: raw,
          maxLines: 4,
          minLines: 3,
          decoration: const InputDecoration(
            hintText: 'Paste JSON from a KINETIQ export',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        KButton(
          label: 'VALIDATE AND PREVIEW',
          style: KButtonStyle.secondary,
          onPressed: _preview,
        ),
        if (preview != null) ...[
          const SizedBox(height: 12),
          KCard(
            child: Text(
              '${preview!.added} new · ${preview!.duplicates} already present · ${preview!.conflicts} conflicts',
            ),
          ),
          const SizedBox(height: 12),
          KButton(
            label: 'IMPORT NEW RECORDS',
            onPressed: preview!.conflicts > 0
                ? null
                : () async {
                    if (!await confirmAction(
                          context,
                          title: 'Import validated records?',
                          message: 'New records are added; existing records are kept. The operation is transactional.',
                          confirm: 'Import',
                        ) ||
                        !context.mounted) {
                      return;
                    }
                    final result = await performAction(
                      context,
                      () => ref.read(repositoryProvider).importJson(raw.text),
                      success: 'Records imported.',
                    );
                    if (result != null) {
                      await ref.read(appControllerProvider).reload();
                      if (mounted) setState(() => preview = null);
                    }
                  },
          ),
        ],
        const SizedBox(height: 24),
        KButton(
          label: 'CLEAR LOCAL RECORDS',
          style: KButtonStyle.danger,
          onPressed: () async {
            if (!await confirmAction(
                  context,
                  title: 'Permanently clear local records?',
                  message: 'All local workouts, food diary, programs and history will be deleted. Export a backup first. This does not delete your cloud account.',
                  confirm: 'Delete local data',
                  destructive: true,
                ) ||
                !context.mounted) {
              return;
            }
            await performAction(
              context,
              () => ref
                  .read(appControllerProvider)
                  .mutate((repo) => repo.clearLocalRecords()),
            );
            if (mounted) ref.read(appControllerProvider).reload();
          },
        ),
        const SizedBox(height: 12),
        const Text(
          'Sensitive personal exports can be read by anyone with a copy. Store your backups securely. Import does not automatically restore an online account.',
        ),
      ],
    );
  }
}
