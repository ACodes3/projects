import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';

/// Displays exercises stored in the local SQLite database.
class ExerciseLibraryScreen extends ConsumerWidget {
  const ExerciseLibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exercisesAsync = ref.watch(exercisesProvider);

    return Scaffold(
      backgroundColor: KinetiqColors.background,
      appBar: AppBar(
        title: const Text('Exercise Library'),
        backgroundColor: KinetiqColors.background,
      ),
      body: exercisesAsync.when(
        // Database query is loading.
        loading: () => const Center(
          child: CircularProgressIndicator(
            color: KinetiqColors.primary,
          ),
        ),

        // Database query failed.
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

        // Database query succeeded.
        data: (exercises) {
          if (exercises.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.fitness_center_outlined,
                      size: 52,
                      color: KinetiqColors.primary,
                    ),
                    SizedBox(height: 20),
                    Text(
                      'Your exercise library is empty',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: KinetiqColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 10),
                    Text(
                      'Exercises you add will appear here.',
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

          return ListView.separated(
            padding: const EdgeInsets.all(24),
            itemCount: exercises.length,
            separatorBuilder: (context, index) =>
            const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final exercise = exercises[index];

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
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
