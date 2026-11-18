import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';

/// Allows users to select an exercise from their library.
///
/// Returns the selected exercise ID through Navigator.pop().
///
/// The parent screen is responsible for adding the selected
/// exercise to a workout template.
class WorkoutExercisePickerDialog extends ConsumerStatefulWidget {
  const WorkoutExercisePickerDialog({super.key});

  @override
  ConsumerState<WorkoutExercisePickerDialog> createState() =>
      _WorkoutExercisePickerDialogState();
}

class _WorkoutExercisePickerDialogState
    extends ConsumerState<WorkoutExercisePickerDialog> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final exercisesAsync = ref.watch(exercisesProvider);

    return AlertDialog(
      backgroundColor: KinetiqColors.surface,

      // ------------------------------------------------------
      // TITLE
      // ------------------------------------------------------
      title: const Text(
        'Add Exercise',
        style: TextStyle(
          color: KinetiqColors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),

      // ------------------------------------------------------
      // CONTENT
      // ------------------------------------------------------
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ------------------------------------------------
            // SEARCH FIELD
            // ------------------------------------------------

            TextField(
              onChanged: (value) {
                setState(() {
                  _searchQuery = value.trim().toLowerCase();
                });
              },
              style: const TextStyle(color: KinetiqColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'Search exercises...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 16),

            // ------------------------------------------------
            // EXERCISE LIBRARY
            // ------------------------------------------------
            SizedBox(
              height: 350,
              child: exercisesAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(
                    color: KinetiqColors.primary,
                  ),
                ),

                error: (error, stackTrace) => const Center(
                  child: Text(
                    'Could not load exercises.',
                    style: TextStyle(color: KinetiqColors.textSecondary),
                  ),
                ),

                data: (exercises) {
                  final filteredExercises = exercises.where((exercise) {
                    final name = exercise.name.toLowerCase();

                    final category = exercise.category.toLowerCase();

                    return name.contains(_searchQuery) ||
                        category.contains(_searchQuery);
                  }).toList();

                  // ------------------------------------------
                  // EMPTY LIBRARY
                  // ------------------------------------------

                  if (exercises.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text(
                          'Your Exercise Library is empty.\n'
                          'Create an exercise first.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: KinetiqColors.textSecondary,
                            height: 1.5,
                          ),
                        ),
                      ),
                    );
                  }

                  // ------------------------------------------
                  // NO SEARCH RESULTS
                  // ------------------------------------------

                  if (filteredExercises.isEmpty) {
                    return const Center(
                      child: Text(
                        'No matching exercises found.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: KinetiqColors.textSecondary),
                      ),
                    );
                  }

                  // ------------------------------------------
                  // EXERCISE LIST
                  // ------------------------------------------

                  return ListView.separated(
                    itemCount: filteredExercises.length,
                    separatorBuilder: (context, index) =>
                        const Divider(color: KinetiqColors.border, height: 1),
                    itemBuilder: (context, index) {
                      final exercise = filteredExercises[index];

                      final isCardio = exercise.category == 'cardio';

                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 4,
                        ),

                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: KinetiqColors.surfaceElevated,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            isCardio
                                ? Icons.directions_run
                                : Icons.fitness_center,
                            color: KinetiqColors.primary,
                          ),
                        ),

                        title: Text(
                          exercise.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: KinetiqColors.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),

                        subtitle: Text(
                          isCardio ? 'Cardio' : 'Strength',
                          style: const TextStyle(
                            color: KinetiqColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),

                        trailing: const Icon(
                          Icons.add_circle_outline,
                          color: KinetiqColors.primary,
                        ),

                        // Return the selected library exercise ID.
                        onTap: () {
                          Navigator.of(context).pop(exercise.id);
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

      // ------------------------------------------------------
      // ACTIONS
      // ------------------------------------------------------
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text('CANCEL'),
        ),
      ],
    );
  }
}
