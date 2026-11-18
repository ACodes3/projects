import 'package:drift/drift.dart' show Value;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/domain/enums/exercise_tracking_mode.dart';
import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_exercise_picker_dialog.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_exercise_settings_dialog.dart';
import 'package:kinetiq/features/workouts/presentation/widgets/workout_template_exercise_card.dart';
import 'package:kinetiq/features/workouts/providers/workout_template_exercise_providers.dart';
import 'package:kinetiq/features/workouts/providers/workout_template_providers.dart';

/// Displays and manages the exercises inside a workout template.
class WorkoutTemplateDetailsScreen extends ConsumerWidget {
  const WorkoutTemplateDetailsScreen({
    super.key,
    required this.templateId,
    this.onAddExercise,
    this.onEditExercise,
  });

  final int templateId;

  // Optional for compatibility with the existing router.
  // These callbacks are no longer used by this screen.
  final VoidCallback? onAddExercise;
  final ValueChanged<WorkoutTemplateExercise>? onEditExercise;

  // ----------------------------------------------------------
  // USER MESSAGES
  // ----------------------------------------------------------

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  // ----------------------------------------------------------
  // EXERCISE SETTINGS DIALOG
  // ----------------------------------------------------------

  Future<WorkoutExerciseSettingsData?> _showSettings(
    BuildContext context,
    Exercise libraryExercise, {
    WorkoutTemplateExercise? existingExercise,
  }) {
    return showDialog<WorkoutExerciseSettingsData>(
      context: context,
      builder: (dialogContext) {
        return WorkoutExerciseSettingsDialog(
          exerciseName: libraryExercise.name,
          trackingMode: ExerciseTrackingMode.fromDatabase(
            libraryExercise.trackingMode,
          ),
          existingExercise: existingExercise,
        );
      },
    );
  }

  // ----------------------------------------------------------
  // ADD EXERCISE
  // ----------------------------------------------------------

  Future<void> _addExercise(BuildContext context, WidgetRef ref) async {
    final exerciseId = await showDialog<int>(
      context: context,
      builder: (dialogContext) {
        return const WorkoutExercisePickerDialog();
      },
    );

    if (exerciseId == null || !context.mounted) return;

    try {
      final exerciseRepository = ref.read(exerciseRepositoryProvider);

      final libraryExercise = await exerciseRepository.getExerciseById(
        exerciseId,
      );

      if (!context.mounted) return;

      if (libraryExercise == null) {
        _showMessage(context, 'Exercise no longer exists.');
        return;
      }

      final settings = await _showSettings(context, libraryExercise);

      if (settings == null || !context.mounted) return;

      final repository = ref.read(workoutTemplateExerciseRepositoryProvider);

      final existingExercises = await repository.getExercisesForTemplate(
        templateId,
      );

      if (!context.mounted) return;

      final nextPosition = existingExercises.isEmpty
          ? 0
          : existingExercises
                    .map((exercise) => exercise.position)
                    .reduce((a, b) => a > b ? a : b) +
                1;

      await repository.addExercise(
        WorkoutTemplateExercisesCompanion(
          templateId: Value(templateId),
          exerciseId: Value(exerciseId),
          position: Value(nextPosition),
          sets: Value(settings.sets),
          targetReps: Value(settings.targetReps),
          targetWeight: Value(settings.targetWeight),
          targetDurationSeconds: Value(settings.targetDurationSeconds),
          targetDistanceKm: Value(settings.targetDistanceKm),
          restBetweenSetsSeconds: Value(settings.restBetweenSetsSeconds),
          restAfterExerciseSeconds: Value(settings.restAfterExerciseSeconds),
          notes: Value(settings.notes),
        ),
      );

      if (!context.mounted) return;

      _showMessage(context, 'Exercise added to workout.');
    } catch (_) {
      if (!context.mounted) return;

      _showMessage(context, 'Could not add exercise to workout.');
    }
  }

  // ----------------------------------------------------------
  // EDIT EXERCISE SETTINGS
  // ----------------------------------------------------------

  Future<void> _editExercise(
    BuildContext context,
    WidgetRef ref,
    WorkoutTemplateExercise exercise,
  ) async {
    try {
      final exerciseRepository = ref.read(exerciseRepositoryProvider);

      final libraryExercise = await exerciseRepository.getExerciseById(
        exercise.exerciseId,
      );

      if (!context.mounted) return;

      if (libraryExercise == null) {
        _showMessage(context, 'Exercise no longer exists.');
        return;
      }

      final settings = await _showSettings(
        context,
        libraryExercise,
        existingExercise: exercise,
      );

      if (settings == null || !context.mounted) return;

      final repository = ref.read(workoutTemplateExerciseRepositoryProvider);

      final existing = await repository.getTemplateExerciseById(exercise.id);

      if (!context.mounted) return;

      if (existing == null || existing.templateId != templateId) {
        _showMessage(context, 'Workout exercise no longer exists.');
        return;
      }

      await repository.updateExercise(
        existing.copyWith(
          sets: settings.sets,
          targetReps: Value(settings.targetReps),
          targetWeight: Value(settings.targetWeight),
          targetDurationSeconds: Value(settings.targetDurationSeconds),
          targetDistanceKm: Value(settings.targetDistanceKm),
          restBetweenSetsSeconds: settings.restBetweenSetsSeconds,
          restAfterExerciseSeconds: settings.restAfterExerciseSeconds,
          notes: Value(settings.notes),
        ),
      );

      if (!context.mounted) return;

      _showMessage(context, 'Exercise settings updated.');
    } catch (_) {
      if (!context.mounted) return;

      _showMessage(context, 'Could not update exercise settings.');
    }
  }

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

      if (!context.mounted) return;

      _showMessage(context, 'Exercise removed from workout.');
    } catch (_) {
      if (!context.mounted) return;

      _showMessage(context, 'Could not remove exercise.');
    }
  }

  // ----------------------------------------------------------
  // REORDER EXERCISES
  // ----------------------------------------------------------

  Future<void> _reorderExercises(
    BuildContext context,
    WidgetRef ref,
    List<WorkoutTemplateExercise> exercises,
    int oldIndex,
    int newIndex,
  ) async {
    // onReorderItem already provides the adjusted destination.
    // Do not subtract 1 again when dragging downward.
    if (oldIndex == newIndex) return;

    // Never modify the Riverpod-provided list directly.
    final reordered = List<WorkoutTemplateExercise>.from(exercises);

    final movedExercise = reordered.removeAt(oldIndex);

    reordered.insert(newIndex, movedExercise);

    // These are workout-template-exercise relationship IDs,
    // not Exercise Library IDs.
    final orderedIds = reordered.map((exercise) => exercise.id).toList();

    try {
      final repository = ref.read(workoutTemplateExerciseRepositoryProvider);

      // The repository saves positions in one transaction.
      await repository.reorderExercises(templateId, orderedIds);

      // Drift notifies Riverpod and rebuilds the list
      // with the newly saved exercise order.
    } catch (_) {
      if (!context.mounted) return;

      _showMessage(context, 'Could not reorder exercises.');
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

                                // --------------------------------
                                // REORDERABLE EXERCISE LIST
                                // --------------------------------
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
                                      : ReorderableListView.builder(
                                          // We use our own drag handles.
                                          buildDefaultDragHandles: false,

                                          padding: const EdgeInsets.only(
                                            bottom: 16,
                                          ),

                                          itemCount: workoutExercises.length,

                                          // Uses Flutter's adjusted
                                          // destination index.
                                          onReorderItem: (oldIndex, newIndex) {
                                            _reorderExercises(
                                              context,
                                              ref,
                                              workoutExercises,
                                              oldIndex,
                                              newIndex,
                                            );
                                          },

                                          itemBuilder: (context, index) {
                                            final exercise =
                                                workoutExercises[index];

                                            return WorkoutTemplateExerciseCard(
                                              // Required stable key.
                                              key: ValueKey(exercise.id),

                                              exercise: exercise,

                                              exerciseName:
                                                  exerciseNames[exercise
                                                      .exerciseId] ??
                                                  'Unknown exercise',

                                              // Visible numbering: 1, 2, 3...
                                              displayPosition: index + 1,

                                              // Display the custom drag handle.
                                              reorderIndex: index,

                                              onEdit: () {
                                                _editExercise(
                                                  context,
                                                  ref,
                                                  exercise,
                                                );
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
                        onPressed: () {
                          _addExercise(context, ref);
                        },
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
