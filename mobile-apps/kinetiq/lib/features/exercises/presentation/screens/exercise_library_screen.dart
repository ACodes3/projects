import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/router/app_router.dart';
import 'package:kinetiq/app/theme/kinetiq_theme.dart';

import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';

import 'package:kinetiq/features/exercises/presentation/widgets/exercise_card.dart';
import 'package:kinetiq/features/exercises/presentation/widgets/exercise_library_empty_state.dart';
import 'package:kinetiq/features/exercises/presentation/widgets/exercise_library_filters.dart';

/// Main Exercise Library screen.
///
/// Responsibilities:
/// - Watch exercises through Riverpod.
/// - Manage search and category state.
/// - Coordinate navigation and deletion.
/// - Compose reusable UI widgets.
class ExerciseLibraryScreen extends ConsumerStatefulWidget {
  const ExerciseLibraryScreen({super.key});

  @override
  ConsumerState<ExerciseLibraryScreen> createState() =>
      _ExerciseLibraryScreenState();
}

class _ExerciseLibraryScreenState extends ConsumerState<ExerciseLibraryScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'all';

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  void _onSearchChanged(String value) {
    setState(() {
      _searchQuery = value.trim().toLowerCase();
    });
  }

  // ----------------------------------------------------------
  // CATEGORY FILTER
  // ----------------------------------------------------------

  void _onCategoryChanged(String category) {
    setState(() {
      _selectedCategory = category;
    });
  }

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  void _openAddExercise() {
    context.push(AppRouter.addExercise);
  }

  void _openEditExercise(int exerciseId) {
    context.pushNamed(
      'edit-exercise',
      pathParameters: {'exerciseId': exerciseId.toString()},
    );
  }

  // ----------------------------------------------------------
  // DELETE EXERCISE
  // ----------------------------------------------------------

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

    // User cancelled or dismissed the dialog.
    if (shouldDelete != true || !context.mounted) {
      return;
    }

    try {
      final repository = ref.read(exerciseRepositoryProvider);

      final deletedRows = await repository.deleteExercise(exerciseId);

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
          content: Text('Could not delete exercise. Please try again.'),
        ),
      );
    }
  }

  // ----------------------------------------------------------
  // BUILD
  // ----------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final exercisesAsync = ref.watch(exercisesProvider);

    return Scaffold(
      backgroundColor: KinetiqColors.background,

      appBar: AppBar(
        title: const Text('Exercise Library'),
        backgroundColor: KinetiqColors.background,
        actions: [
          IconButton(
            tooltip: 'Add exercise',
            onPressed: _openAddExercise,
            icon: const Icon(
              Icons.add_circle_outline,
              color: KinetiqColors.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 12),
        ],
      ),

      body: Column(
        children: [
          // --------------------------------------------------
          // SEARCH + CATEGORY FILTERS
          // --------------------------------------------------
          ExerciseLibraryFilters(
            searchQuery: _searchQuery,
            selectedCategory: _selectedCategory,
            onSearchChanged: _onSearchChanged,
            onCategoryChanged: _onCategoryChanged,
          ),

          // --------------------------------------------------
          // DATABASE CONTENT
          // --------------------------------------------------
          Expanded(
            child: exercisesAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: KinetiqColors.primary),
              ),

              error: (error, stackTrace) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Could not load exercises.\n$error',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: KinetiqColors.textSecondary),
                  ),
                ),
              ),

              data: (exercises) {
                // Apply search and category filters together.
                final filteredExercises = exercises.where((exercise) {
                  final matchesSearch = exercise.name.toLowerCase().contains(
                    _searchQuery,
                  );

                  final matchesCategory =
                      _selectedCategory == 'all' ||
                      exercise.category == _selectedCategory;

                  return matchesSearch && matchesCategory;
                }).toList();

                // Empty library.
                if (exercises.isEmpty) {
                  return ExerciseLibraryEmptyState(
                    hasExercises: false,
                    onAddExercise: _openAddExercise,
                  );
                }

                // Search or category returned no results.
                if (filteredExercises.isEmpty) {
                  return ExerciseLibraryEmptyState(
                    hasExercises: true,
                    onAddExercise: _openAddExercise,
                  );
                }

                // ----------------------------------------------
                // EXERCISE LIST
                // ----------------------------------------------
                return ListView.separated(
                  padding: const EdgeInsets.all(24),
                  itemCount: filteredExercises.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final exercise = filteredExercises[index];

                    return ExerciseCard(
                      exercise: exercise,

                      onEdit: () {
                        _openEditExercise(exercise.id);
                      },

                      onDelete: () {
                        _confirmDelete(context, exercise.id, exercise.name);
                      },
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
