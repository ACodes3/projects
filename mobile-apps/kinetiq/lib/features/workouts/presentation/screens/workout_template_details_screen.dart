import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_template_exercise_card.dart';
import 'package:kinetiq/features/workouts/providers/workout_template_exercise_providers.dart';
import 'package:kinetiq/features/workouts/providers/workout_template_providers.dart';

/// Displays the exercises and configuration of a saved workout.
///
/// The parent router supplies the callbacks for adding and
/// editing exercises once those flows have been implemented.
class WorkoutTemplateDetailsScreen extends ConsumerWidget {
  const WorkoutTemplateDetailsScreen({
    super.key,
    required this.templateId,
    required this.onAddExercise,
    required this.onEditExercise,
  });

  final int templateId;

  final VoidCallback onAddExercise;

  final ValueChanged<WorkoutTemplateExercise> onEditExercise;

  // ----------------------------------------------------------
  // REMOVE EXERCISE
  // ----------------------------------------------------------

  Future<void> _confirmRemove(
    BuildContext context,
    WidgetRef ref,
    WorkoutTemplateExercise exercise,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: KinetiqColors.surface,
          title: const Text(
            'Remove Exercise?',
            style: TextStyle(color: KinetiqColors.textPrimary),
          ),
          content: const Text(
            'Remove this exercise from the workout? '
            'It will remain in your Exercise Library.',
            style: TextStyle(color: KinetiqColors.textSecondary),
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
                'REMOVE',
                style: TextStyle(color: Colors.redAccent),
              ),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !context.mounted) return;

    try {
      final repository = ref.read(workoutTemplateExerciseRepositoryProvider);

      await repository.removeExercise(exercise.id);
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not remove exercise.')),
      );
    }
  }

  // ----------------------------------------------------------
  // BUILD
  // ----------------------------------------------------------

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final templatesAsync = ref.watch(workoutTemplatesProvider);

    final workoutExercisesAsync = ref.watch(
      workoutTemplateExercisesProvider(templateId),
    );

    final libraryExercisesAsync = ref.watch(exercisesProvider);

    return Scaffold(
      backgroundColor: KinetiqColors.background,
      appBar: AppBar(
        title: const Text('Workout Details'),
        backgroundColor: KinetiqColors.background,
      ),
      body: templatesAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: KinetiqColors.primary),
        ),
        error: (error, stackTrace) => const Center(
          child: Text(
            'Could not load workout details.',
            style: TextStyle(color: KinetiqColors.textSecondary),
          ),
        ),
        data: (templates) {
          WorkoutTemplate? template;

          for (final item in templates) {
            if (item.id == templateId) {
              template = item;
              break;
            }
          }

          if (template == null) {
            return const Center(
              child: Text(
                'Workout template not found.',
                style: TextStyle(color: KinetiqColors.textSecondary),
              ),
            );
          }

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ------------------------------------------
                  // WORKOUT HEADER
                  // ------------------------------------------

                  const Text(
                    'WORKOUT DETAILS',
                    style: TextStyle(
                      color: KinetiqColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5,
                    ),
                  ),

                  const SizedBox(height: 10),

                  Text(
                    template.name,
                    style: const TextStyle(
                      color: KinetiqColors.textPrimary,
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                    ),
                  ),

                  if (template.description != null &&
                      template.description!.trim().isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      template.description!,
                      style: const TextStyle(
                        color: KinetiqColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // ------------------------------------------
                  // EXERCISE LIST
                  // ------------------------------------------
                  Expanded(
                    child: workoutExercisesAsync.when(
                      loading: () => const Center(
                        child: CircularProgressIndicator(
                          color: KinetiqColors.primary,
                        ),
                      ),
                      error: (error, stackTrace) => const Center(
                        child: Text(
                          'Could not load workout exercises.',
                          style: TextStyle(color: KinetiqColors.textSecondary),
                        ),
                      ),
                      data: (workoutExercises) {
                        return libraryExercisesAsync.when(
                          loading: () => const Center(
                            child: CircularProgressIndicator(
                              color: KinetiqColors.primary,
                            ),
                          ),
                          error: (error, stackTrace) => const Center(
                            child: Text(
                              'Could not load Exercise Library.',
                              style: TextStyle(
                                color: KinetiqColors.textSecondary,
                              ),
                            ),
                          ),
                          data: (libraryExercises) {
                            final exerciseNames = {
                              for (final exercise in libraryExercises)
                                exercise.id: exercise.name,
                            };

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${workoutExercises.length} exercises',
                                  style: const TextStyle(
                                    color: KinetiqColors.textSecondary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),

                                const SizedBox(height: 16),

                                Expanded(
                                  child: workoutExercises.isEmpty
                                      ? const Center(
                                          child: Text(
                                            'No exercises added yet.\n'
                                            'Add your first exercise below.',
                                            textAlign: TextAlign.center,
                                            style: TextStyle(
                                              color:
                                                  KinetiqColors.textSecondary,
                                              fontSize: 14,
                                              height: 1.5,
                                            ),
                                          ),
                                        )
                                      : ListView.builder(
                                          padding: const EdgeInsets.only(
                                            bottom: 16,
                                          ),
                                          itemCount: workoutExercises.length,
                                          itemBuilder: (context, index) {
                                            final exercise =
                                                workoutExercises[index];

                                            return WorkoutTemplateExerciseCard(
                                              exercise: exercise,
                                              exerciseName:
                                                  exerciseNames[exercise
                                                      .exerciseId] ??
                                                  'Unknown exercise',
                                              onEdit: () {
                                                onEditExercise(exercise);
                                              },
                                              onRemove: () {
                                                _confirmRemove(
                                                  context,
                                                  ref,
                                                  exercise,
                                                );
                                              },
                                            );
                                          },
                                        ),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    ),
                  ),

                  // ------------------------------------------
                  // ADD EXERCISE BUTTON
                  // ------------------------------------------
                  Padding(
                    padding: const EdgeInsets.only(top: 12, bottom: 20),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: onAddExercise,
                        icon: const Icon(Icons.add),
                        label: const Text('ADD EXERCISE'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(54),
                          backgroundColor: KinetiqColors.primary,
                          foregroundColor: KinetiqColors.background,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
