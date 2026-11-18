import 'package:drift/drift.dart' show Value;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/workouts/providers/workout_template_providers.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_template_card.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_templates_empty_state.dart';

/// Displays and manages saved workout templates.
class WorkoutsScreen extends ConsumerWidget {
  const WorkoutsScreen({super.key});

  // ----------------------------------------------------------
  // CREATE / EDIT TEMPLATE
  // ----------------------------------------------------------

  Future<void> _showTemplateForm(
    BuildContext context,
    WidgetRef ref, {
    WorkoutTemplate? template,
  }) async {
    final isEditing = template != null;

    final nameController = TextEditingController(text: template?.name ?? '');

    final descriptionController = TextEditingController(
      text: template?.description ?? '',
    );

    final formKey = GlobalKey<FormState>();

    try {
      final shouldSave = await showDialog<bool>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            backgroundColor: KinetiqColors.surface,
            title: Text(
              isEditing ? 'Edit Workout' : 'Create Workout',
              style: const TextStyle(color: KinetiqColors.textPrimary),
            ),
            content: SingleChildScrollView(
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: nameController,
                      maxLength: 120,
                      autofocus: true,
                      textCapitalization: TextCapitalization.words,
                      style: const TextStyle(color: KinetiqColors.textPrimary),
                      decoration: const InputDecoration(
                        labelText: 'Workout name *',
                        hintText: 'e.g. Upper Body',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Workout name is required.';
                        }

                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: descriptionController,
                      maxLines: 3,
                      style: const TextStyle(color: KinetiqColors.textPrimary),
                      decoration: const InputDecoration(
                        labelText: 'Description (optional)',
                        hintText: 'Describe your routine...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop(false);
                },
                child: const Text('CANCEL'),
              ),
              ElevatedButton(
                onPressed: () {
                  if (formKey.currentState!.validate()) {
                    Navigator.of(dialogContext).pop(true);
                  }
                },
                child: Text(isEditing ? 'SAVE CHANGES' : 'CREATE'),
              ),
            ],
          );
        },
      );

      if (shouldSave != true || !context.mounted) return;

      final name = nameController.text.trim();
      final description = descriptionController.text.trim();

      final repository = ref.read(workoutTemplateRepositoryProvider);

      if (isEditing) {
        final existing = await repository.getTemplateById(template.id);

        if (existing == null) {
          throw StateError('Workout template no longer exists.');
        }

        await repository.updateTemplate(
          existing.copyWith(
            name: name,
            description: Value(description.isEmpty ? null : description),
          ),
        );
      } else {
        await repository.createTemplate(
          WorkoutTemplatesCompanion(
            name: Value(name),
            description: Value(description.isEmpty ? null : description),
          ),
        );
      }
    } catch (_) {
      if (!context.mounted) return;

      _showError(context, 'Could not save workout template.');
    } finally {
      nameController.dispose();
      descriptionController.dispose();
    }
  }

  // ----------------------------------------------------------
  // TOGGLE FAVORITE
  // ----------------------------------------------------------

  Future<void> _toggleFavorite(
    BuildContext context,
    WidgetRef ref,
    WorkoutTemplate template,
  ) async {
    try {
      final repository = ref.read(workoutTemplateRepositoryProvider);

      final existing = await repository.getTemplateById(template.id);

      if (existing == null) {
        throw StateError('Workout template no longer exists.');
      }

      await repository.updateTemplate(
        existing.copyWith(isFavorite: !existing.isFavorite),
      );
    } catch (_) {
      if (!context.mounted) return;

      _showError(context, 'Could not update favorite.');
    }
  }

  // ----------------------------------------------------------
  // DELETE TEMPLATE
  // ----------------------------------------------------------

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    WorkoutTemplate template,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: KinetiqColors.surface,
          title: const Text(
            'Delete Workout?',
            style: TextStyle(color: KinetiqColors.textPrimary),
          ),
          content: Text(
            'Are you sure you want to delete '
            '"${template.name}"?',
            style: const TextStyle(color: KinetiqColors.textSecondary),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(false);
              },
              child: const Text('CANCEL'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(true);
              },
              child: const Text(
                'DELETE',
                style: TextStyle(color: Colors.redAccent),
              ),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !context.mounted) return;

    try {
      final repository = ref.read(workoutTemplateRepositoryProvider);

      await repository.deleteTemplate(template.id);
    } catch (_) {
      if (!context.mounted) return;

      _showError(context, 'Could not delete workout template.');
    }
  }

  // ----------------------------------------------------------
  // ERROR MESSAGE
  // ----------------------------------------------------------

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  // ----------------------------------------------------------
  // BUILD
  // ----------------------------------------------------------

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final templatesAsync = ref.watch(workoutTemplatesProvider);

    return Scaffold(
      backgroundColor: KinetiqColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ----------------------------------------------
              // HEADER
              // ----------------------------------------------

              const Text(
                'YOUR WORKOUTS',
                style: TextStyle(
                  color: KinetiqColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                ),
              ),

              const SizedBox(height: 8),

              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Workout Templates',
                      style: TextStyle(
                        color: KinetiqColors.textPrimary,
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),

                  IconButton.filled(
                    tooltip: 'Create workout',
                    onPressed: () {
                      _showTemplateForm(context, ref);
                    },
                    style: IconButton.styleFrom(
                      backgroundColor: KinetiqColors.primary,
                      foregroundColor: KinetiqColors.background,
                    ),
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // ----------------------------------------------
              // DATABASE CONTENT
              // ----------------------------------------------
              Expanded(
                child: templatesAsync.when(
                  loading: () {
                    return const Center(
                      child: CircularProgressIndicator(
                        color: KinetiqColors.primary,
                      ),
                    );
                  },

                  error: (error, stackTrace) {
                    return const Center(
                      child: Text(
                        'Could not load workout templates.',
                        style: TextStyle(color: KinetiqColors.textSecondary),
                      ),
                    );
                  },

                  data: (templates) {
                    // No saved templates.
                    if (templates.isEmpty) {
                      return WorkoutTemplatesEmptyState(
                        onCreateWorkout: () {
                          _showTemplateForm(context, ref);
                        },
                      );
                    }

                    // Display saved templates.
                    return ListView.builder(
                      padding: const EdgeInsets.only(bottom: 24),
                      itemCount: templates.length,
                      itemBuilder: (context, index) {
                        final template = templates[index];

                        return WorkoutTemplateCard(
                          template: template,

                          onEdit: () {
                            _showTemplateForm(context, ref, template: template);
                          },

                          onDelete: () {
                            _confirmDelete(context, ref, template);
                          },

                          onToggleFavorite: () {
                            _toggleFavorite(context, ref, template);
                          },
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
