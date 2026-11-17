import 'package:drift/drift.dart' show Value;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';

/// Form for creating custom exercises.
class AddExerciseScreen extends ConsumerStatefulWidget {
  const AddExerciseScreen({
    super.key,
    this.exerciseId,
  });

  final int? exerciseId;

  @override
  ConsumerState<AddExerciseScreen> createState() =>
      _AddExerciseScreenState();
}

class _AddExerciseScreenState
    extends ConsumerState<AddExerciseScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _muscleGroupController = TextEditingController();
  final _notesController = TextEditingController();

  String _category = 'strength';
  bool _isSaving = false;


  bool _isLoading = false;
  bool _hasLoadError = false;

  bool get _isEditing => widget.exerciseId != null;

  @override
  void initState() {
    super.initState();

    if (_isEditing) {
      _loadExercise();
    }
  }

  Future<void> _loadExercise() async {
    setState(() {
      _isLoading = true;
      _hasLoadError = false;
    });

    try {
      final repository = ref.read(exerciseRepositoryProvider);

      final exercise = await repository.getExerciseById(
        widget.exerciseId!,
      );

      if (!mounted) return;

      if (exercise == null) {
        setState(() {
          _hasLoadError = true;
        });
        return;
      }

      _nameController.text = exercise.name;
      _muscleGroupController.text = exercise.muscleGroup ?? '';
      _notesController.text = exercise.notes ?? '';

      setState(() {
        _category = exercise.category;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _hasLoadError = true;
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _muscleGroupController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _saveExercise() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final repository = ref.read(exerciseRepositoryProvider);

      final muscleGroup = _muscleGroupController.text.trim();
      final notes = _notesController.text.trim();

      final companion = ExercisesCompanion(
        name: Value(_nameController.text.trim()),
        category: Value(_category),
        trackingMode: Value(
          _category == 'cardio' ? 'duration' : 'reps',
        ),
        muscleGroup: Value(
          muscleGroup.isEmpty ? null : muscleGroup,
        ),
        notes: Value(
          notes.isEmpty ? null : notes,
        ),
        isCustom: const Value(true),
      );

      if (_isEditing) {
        final exercise = await repository.getExerciseById(
          widget.exerciseId!,
        );

        if (exercise == null) {
          throw StateError('Exercise no longer exists.');
        }

        await repository.updateExercise(
          exercise.copyWith(
            name: companion.name.value,
            category: companion.category.value,
            trackingMode: companion.trackingMode.value,
            muscleGroup: Value(companion.muscleGroup.value),
            notes: Value(companion.notes.value),
          ),
        );
      } else {
        await repository.createExercise(companion);
      }

      if (!mounted) return;

      // Return to the Exercise Library after saving.
      context.pop();
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Could not save exercise. Please try again.',
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KinetiqColors.background,
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Exercise' : 'Add Exercise'),
        backgroundColor: KinetiqColors.background,
      ),

      body: _isLoading
          ? const Center(
        child: CircularProgressIndicator(
          color: KinetiqColors.primary,
        ),
      )
          : _hasLoadError
          ? const Center(
        child: Text(
          'Could not load this exercise.',
          style: TextStyle(
            color: KinetiqColors.textSecondary,
          ),
        ),
      )
          : SafeArea(
      child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                _isEditing ? 'EDIT EXERCISE' : 'CREATE EXERCISE',
                style: TextStyle(
                  color: KinetiqColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),

              const SizedBox(height: 10),

              Text(
                _isEditing ? 'Refine your exercise.' : 'Make it yours.',
                style: TextStyle(
                  color: KinetiqColors.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 8),

              const Text(
                'Add a custom exercise to your library.',
                style: TextStyle(
                  color: KinetiqColors.textSecondary,
                  fontSize: 14,
                ),
              ),

              const SizedBox(height: 32),

              // Exercise name
              TextFormField(
                controller: _nameController,
                maxLength: 120,
                textCapitalization: TextCapitalization.words,
                style: const TextStyle(
                  color: KinetiqColors.textPrimary,
                ),
                decoration: const InputDecoration(
                  labelText: 'Exercise name *',
                  hintText: 'e.g. Bulgarian Split Squat',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Exercise name is required.';
                  }

                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Exercise category
              const Text(
                'CATEGORY *',
                style: TextStyle(
                  color: KinetiqColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),

              const SizedBox(height: 12),

              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'strength',
                    label: Text('Strength'),
                    icon: Icon(Icons.fitness_center),
                  ),
                  ButtonSegment(
                    value: 'cardio',
                    label: Text('Cardio'),
                    icon: Icon(Icons.directions_run),
                  ),
                ],
                selected: {_category},
                onSelectionChanged: (selection) {
                  setState(() {
                    _category = selection.first;
                  });
                },
              ),

              const SizedBox(height: 28),

              // Optional muscle group
              TextFormField(
                controller: _muscleGroupController,
                textCapitalization: TextCapitalization.words,
                style: const TextStyle(
                  color: KinetiqColors.textPrimary,
                ),
                decoration: const InputDecoration(
                  labelText: 'Muscle group (optional)',
                  hintText: 'e.g. Legs',
                  border: OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 20),

              // Optional notes
              TextFormField(
                controller: _notesController,
                maxLines: 4,
                style: const TextStyle(
                  color: KinetiqColors.textPrimary,
                ),
                decoration: const InputDecoration(
                  labelText: 'Notes (optional)',
                  hintText: 'Technique, equipment, instructions...',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
              ),

              const SizedBox(height: 32),

              // Save button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _saveExercise,
                  icon: _isSaving
                      ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  )
                      : const Icon(Icons.check),
                  label: Text(
                    _isSaving
                        ? 'SAVING...'
                        : _isEditing
                        ? 'SAVE CHANGES'
                        : 'SAVE EXERCISE',
                  ),
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
            ],
          ),
        ),
      ),
    );
  }
}
