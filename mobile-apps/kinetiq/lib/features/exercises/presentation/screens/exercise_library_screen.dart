
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/router/app_router.dart';
import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';

/// Displays exercises stored in the local SQLite database.
class ExerciseLibraryScreen extends ConsumerStatefulWidget {
  const ExerciseLibraryScreen({super.key});

  @override
  ConsumerState<ExerciseLibraryScreen> createState() =>
      _ExerciseLibraryScreenState();
}

class _ExerciseLibraryScreenState
    extends ConsumerState<ExerciseLibraryScreen> {
  // Local UI state for filtering exercises by name.
  String _searchQuery = '';

  /// Asks the user to confirm before deleting a custom exercise.
  Future<void> _confirmDelete(
      BuildContext context,
      int exerciseId,
      String exerciseName,
      ) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: KinetiqColors.surface,
          title: const Text(
            'Delete exercise?',
            style: TextStyle(
              color: KinetiqColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          content: Text(
            'Are you sure you want to delete "$exerciseName"? '
                'This action cannot be undone.',
            style: const TextStyle(
              color: KinetiqColors.textSecondary,
            ),
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
                style: TextStyle(
                  color: Colors.redAccent,
                ),
              ),
            ),
          ],
        );
      },
    );

    // Stop if the user cancelled or dismissed the dialog.
    if (shouldDelete != true || !context.mounted) {
      return;
    }

    try {
      final repository = ref.read(exerciseRepositoryProvider);

      final deletedRows = await repository.deleteExercise(
        exerciseId,
      );

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            deletedRows > 0
                ? '"$exerciseName" deleted successfully.'
                : 'Exercise could not be found.',
          ),
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Could not delete exercise. Please try again.',
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch the reactive SQLite exercise list through Riverpod.
    final exercisesAsync = ref.watch(exercisesProvider);

    return Scaffold(
      backgroundColor: KinetiqColors.background,

      // --------------------------------------------------------
      // APP BAR
      // --------------------------------------------------------
      appBar: AppBar(
        title: const Text('Exercise Library'),
        backgroundColor: KinetiqColors.background,
        actions: [
          IconButton(
            tooltip: 'Add exercise',
            onPressed: () {
              context.push(AppRouter.addExercise);
            },
            icon: const Icon(
              Icons.add_circle_outline,
              color: KinetiqColors.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 12),
        ],
      ),

      // --------------------------------------------------------
      // SEARCH + EXERCISE CONTENT
      // --------------------------------------------------------
      body: Column(
        children: [
          // Search field.
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: TextField(
              onChanged: (value) {
                setState(() {
                  _searchQuery = value.trim().toLowerCase();
                });
              },
              style: const TextStyle(
                color: KinetiqColors.textPrimary,
              ),
              decoration: InputDecoration(
                hintText: 'Search exercises...',
                prefixIcon: const Icon(
                  Icons.search,
                  color: KinetiqColors.textSecondary,
                ),
                filled: true,
                fillColor: KinetiqColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Database content fills the remaining screen space.
          Expanded(
            child: exercisesAsync.when(
              // ------------------------------------------------
              // LOADING STATE
              // ------------------------------------------------
              loading: () => const Center(
                child: CircularProgressIndicator(
                  color: KinetiqColors.primary,
                ),
              ),

              // ------------------------------------------------
              // ERROR STATE
              // ------------------------------------------------
              error: (error, stackTrace) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Could not load exercises.\n$error',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: KinetiqColors.textSecondary,
                    ),
                  ),
                ),
              ),

              // ------------------------------------------------
              // DATA STATE
              // ------------------------------------------------
              data: (exercises) {
                // Filter exercises locally by their name.
                final filteredExercises = exercises.where((exercise) {
                  return exercise.name
                      .toLowerCase()
                      .contains(_searchQuery);
                }).toList();

                // Empty library (no exercises in SQLite).
                if (exercises.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.fitness_center_outlined,
                            size: 52,
                            color: KinetiqColors.primary,
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'Your exercise library is empty',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: KinetiqColors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Exercises you add will appear here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: KinetiqColors.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 28),

                          // Create the first exercise.
                          SizedBox(
                            width: 220,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                context.push(AppRouter.addExercise);
                              },
                              icon: const Icon(Icons.add),
                              label: const Text('ADD EXERCISE'),
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size.fromHeight(50),
                                backgroundColor: KinetiqColors.primary,
                                foregroundColor: KinetiqColors.background,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Search query returned no matches.
                if (filteredExercises.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.search_off_outlined,
                            size: 52,
                            color: KinetiqColors.textMuted,
                          ),
                          SizedBox(height: 20),
                          Text(
                            'No matching exercises',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: KinetiqColors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(height: 10),
                          Text(
                            'Try searching for a different exercise.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: KinetiqColors.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // ------------------------------------------------
                // EXERCISE LIST
                // ------------------------------------------------
                return ListView.separated(
                  padding: const EdgeInsets.all(24),
                  itemCount: filteredExercises.length,
                  separatorBuilder: (context, index) =>
                  const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final exercise = filteredExercises[index];

                    return Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: KinetiqColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: KinetiqColors.border,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.fitness_center,
                            color: KinetiqColors.primary,
                          ),

                          const SizedBox(width: 16),

                          // Exercise information.
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  exercise.name,
                                  style: const TextStyle(
                                    color: KinetiqColors.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),

                                const SizedBox(height: 6),

                                Text(
                                  [
                                    exercise.category,
                                    if (exercise.muscleGroup != null)
                                      exercise.muscleGroup!,
                                  ].join(' • '),
                                  style: const TextStyle(
                                    color: KinetiqColors.textSecondary,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(width: 8),

                          // Edit custom exercises.
                          IconButton(
                            tooltip: 'Edit ${exercise.name}',
                            onPressed: exercise.isCustom
                                ? () {
                              context.pushNamed(
                                'edit-exercise',
                                pathParameters: {
                                  'exerciseId':
                                  exercise.id.toString(),
                                },
                              );
                            }
                                : null,
                            icon: Icon(
                              Icons.edit_outlined,
                              color: exercise.isCustom
                                  ? KinetiqColors.primary
                                  : KinetiqColors.textMuted,
                              size: 22,
                            ),
                          ),

                          // Delete custom exercises.
                          IconButton(
                            tooltip: 'Delete ${exercise.name}',
                            onPressed: exercise.isCustom
                                ? () {
                              _confirmDelete(
                                context,
                                exercise.id,
                                exercise.name,
                              );
                            }
                                : null,
                            icon: Icon(
                              Icons.delete_outline,
                              color: exercise.isCustom
                                  ? Colors.redAccent
                                  : KinetiqColors.textMuted,
                              size: 22,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
