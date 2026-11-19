import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/repository/kinetiq_repository.dart';
import '../../../core/state/providers.dart';
import '../../../core/utils/action.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/k_button.dart';
import '../../../shared/widgets/k_card.dart';
import '../../../shared/widgets/k_screen.dart';

class BackupReviewScreen extends ConsumerStatefulWidget {
  const BackupReviewScreen({super.key});
  @override
  ConsumerState<BackupReviewScreen> createState() => _BackupReviewScreenState();
}

class _BackupReviewScreenState extends ConsumerState<BackupReviewScreen> {
  Map<String, dynamic>? remote;
  ImportPreview? preview;
  String? error;
  bool loading = true;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final account = ref.read(accountControllerProvider);
      final snapshot = await account.getRemoteBackup();
      final result = await account.previewRemoteBackup(snapshot);
      if (mounted) {
        setState(() {
          remote = snapshot;
          preview = result;
          error = null;
          loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          error = '$e';
          loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final account = ref.watch(accountControllerProvider);
    final app = ref.watch(appControllerProvider);
    final revision = remote?['revision'] as int? ?? 0;
    return KScreen(
      title: 'Review your data',
      eyebrow: 'ACCOUNT / BACKUP',
      back: true,
      subtitle: 'Registration and successful cloud backup are separate. Nothing is overwritten automatically.',
      children: [
        KCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'THIS DEVICE',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              Text(
                '${app.routines.length} routines · ${app.sessions.length} sessions · ${app.meals.length} meal entries',
              ),
              const SizedBox(height: 12),
              Text(
                'ACCOUNT BACKUP',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              if (loading)
                const CircularProgressIndicator()
              else if (error != null)
                Text(error!)
              else ...[
                Text(
                  remote?['snapshot'] == null
                      ? 'No saved cloud backup'
                      : 'Revision $revision · ${preview?.added ?? 0} new records · ${preview?.duplicates ?? 0} already present · ${preview?.conflicts ?? 0} conflicts',
                ),
                const SizedBox(height: 6),
                const Text(
                  'This is a revision-checked snapshot, not automatic device synchronization.',
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (error != null)
          KButton(
            label: 'RETRY CHECK',
            style: KButtonStyle.secondary,
            onPressed: _load,
          ),
        if (!loading && error == null) ...[
          KButton(
            label: 'UPLOAD LOCAL BACKUP',
            icon: Icons.cloud_upload_outlined,
            busy: account.busy,
            onPressed: () async {
              if (!await confirmAction(
                    context,
                    title: revision == 0
                        ? 'Create a cloud backup?'
                        : 'Replace existing cloud copy?',
                    message: revision == 0
                        ? 'Upload an explicit snapshot of your current local records?'
                        : 'Your account already has a snapshot. This replaces it with this device’s data. Export/merge first if needed.',
                    confirm: 'Upload backup',
                  ) ||
                  !context.mounted) {
                return;
              }
              final result = await performAction(
                context,
                () => account.backupWithRevision(revision),
                success: 'Server confirmed the backup.',
              );
              if (result != null) await _load();
            },
          ),
          const SizedBox(height: 12),
          KButton(
            label: 'IMPORT AND MERGE CLOUD COPY',
            icon: Icons.cloud_download_outlined,
            style: KButtonStyle.secondary,
            onPressed:
                remote?['snapshot'] == null || (preview?.conflicts ?? 0) > 0
                ? null
                : () async {
                    if (!await confirmAction(
                          context,
                          title: 'Merge downloaded backup?',
                          message: 'Only new IDs will be added. Existing records will never be overwritten.',
                          confirm: 'Merge',
                        ) ||
                        !context.mounted) {
                      return;
                    }
                    final result = await performAction(
                      context,
                      () => account.mergeRemoteBackup(remote!),
                      success: 'Cloud records merged locally.',
                    );
                    if (result != null) {
                      await ref.read(appControllerProvider).reload();
                      await _load();
                    }
                  },
          ),
          if ((preview?.conflicts ?? 0) > 0) ...[
            const SizedBox(height: 14),
            const Text(
              'Some matching IDs have different values. Import is blocked to protect your data. Export both versions and resolve conflicts explicitly.',
            ),
          ],
        ],
        const SizedBox(height: 20),
        KButton(
          label: 'KEEP DATA LOCAL FOR NOW',
          style: KButtonStyle.ghost,
          onPressed: () => context.go('/home'),
        ),
      ],
    );
  }
}
