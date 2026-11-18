import 'package:drift/drift.dart' show Value;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'package:kinetiq/app/theme/kinetiq_theme.dart';
import 'package:kinetiq/core/database/app_database.dart';
import 'package:kinetiq/features/exercises/domain/enums/exercise_tracking_mode.dart';
import 'package:kinetiq/features/exercises/presentation/widgets/exercise_form/exercise_category_selector.dart';
import 'package:kinetiq/features/exercises/presentation/widgets/exercise_form/exercise_form_fields.dart';
import 'package:kinetiq/features/exercises/presentation/widgets/exercise_form/exercise_save_button.dart';
import 'package:kinetiq/features/exercises/presentation/widgets/exercise_tracking_mode_selector.dart';
import 'package:kinetiq/features/exercises/providers/exercise_providers.dart';

/// Screen for creating and editing custom exercises.
class AddExerciseScreen extends ConsumerStatefulWidget {
  const AddExerciseScreen({super.key, this.exerciseId});

  /// Null = create; non-null = edit an existing exercise.
  final int? exerciseId;

  @override
  ConsumerState<AddExerciseScreen> createState() => _AddExerciseScreenState();
}

class _AddExerciseScreenState extends ConsumerState<AddExerciseScreen> {
  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _muscleGroupController = TextEditingController();
  final _notesController = TextEditingController();

  String _category = 'strength';

  ExerciseTrackingMode _trackingMode = ExerciseTrackingMode.reps;

  bool _isLoading = false;
  bool _isSaving = false;
  bool _hasLoadError = false;

  bool get _isEditing => widget.exerciseId != null;

  // ----------------------------------------------------------
  // LIFECYCLE
  // ----------------------------------------------------------

  @override
  void initState() {
    super.initState();

    if (_isEditing) {
      _loadExercise();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _muscleGroupController.dispose();
    _notesController.dispose();

    super.dispose();
  }

  // ----------------------------------------------------------
  // LOAD EXISTING EXERCISE
  // ----------------------------------------------------------

  Future<void> _loadExercise() async {
    setState(() {
      _isLoading = true;
      _hasLoadError = false;
    });

    try {
      final repository = ref.read(exerciseRepositoryProvider);

      final exercise = await repository.getExerciseById(widget.exerciseId!);

      if (!mounted) return;

      if (exercise == null) {
        setState(() {
          _hasLoadError = true;
        });
        return;
      }

      // Populate the form with saved SQLite data.
      _nameController.text = exercise.name;
      _muscleGroupController.text = exercise.muscleGroup ?? '';
      _notesController.text = exercise.notes ?? '';

      setState(() {
        _category = exercise.category;
        _trackingMode = ExerciseTrackingMode.fromDatabase(
          exercise.trackingMode,
        );
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

  // ----------------------------------------------------------
  // CATEGORY AND TRACKING MODE
  // ----------------------------------------------------------

  void _onCategoryChanged(String category) {
    setState(() {
      _category = category;

      // Suggest the default tracking mode for this category.
      _trackingMode = category == 'cardio'
          ? ExerciseTrackingMode.duration
          : ExerciseTrackingMode.reps;
    });
  }

  void _onTrackingModeChanged(ExerciseTrackingMode mode) {
    setState(() {
      _trackingMode = mode;
    });
  }

  // ----------------------------------------------------------
  // SAVE EXERCISE
  // ----------------------------------------------------------

  Future<void> _saveExercise() async {
    // Prevent duplicate submissions.
    if (_isSaving || _isLoading) return;

    // Validate required fields before saving.
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

      // Values shared by Create and Edit operations.
      final companion = ExercisesCompanion(
        name: Value(_nameController.text.trim()),
        category: Value(_category),
        trackingMode: Value(_trackingMode.databaseValue),
        muscleGroup: Value(muscleGroup.isEmpty ? null : muscleGroup),
        notes: Value(notes.isEmpty ? null : notes),
        isCustom: const Value(true),
      );

      if (_isEditing) {
        // ----------------------------------------------------
        // UPDATE EXISTING EXERCISE
        // ----------------------------------------------------

        final existingExercise = await repository.getExerciseById(
          widget.exerciseId!,
        );

        if (existingExercise == null) {
          throw StateError('Exercise no longer exists.');
        }

        await repository.updateExercise(
          existingExercise.copyWith(
            name: companion.name.value,
            category: companion.category.value,
            trackingMode: companion.trackingMode.value,
            muscleGroup: Value(companion.muscleGroup.value),
            notes: Value(companion.notes.value),
          ),
        );
      } else {
        // ----------------------------------------------------
        // CREATE NEW EXERCISE
        // ----------------------------------------------------

        await repository.createExercise(companion);
      }

      if (!mounted) return;

      // Return to the Exercise Library after saving.
      context.pop();
    } catch (_) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not save exercise. Please try again.'),
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

  // ----------------------------------------------------------
  // BUILD
  // ----------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KinetiqColors.background,

      // ------------------------------------------------------
      // APP BAR
      // ------------------------------------------------------
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Exercise' : 'Add Exercise'),
        backgroundColor: KinetiqColors.background,
      ),

      // ------------------------------------------------------
      // SCREEN CONTENT
      // ------------------------------------------------------
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: KinetiqColors.primary),
            )
          : _hasLoadError
          ? const Center(
              child: Text(
                'Could not load this exercise.',
                style: TextStyle(color: KinetiqColors.textSecondary),
              ),
            )
          : SafeArea(
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    // ------------------------------------
                    // PAGE HEADING
                    // ------------------------------------

                    Text(
                      _isEditing ? 'EDIT EXERCISE' : 'CREATE EXERCISE',
                      style: const TextStyle(
                        color: KinetiqColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.5,
                      ),
                    ),

                    const SizedBox(height: 10),

                    Text(
                      _isEditing ? 'Refine your exercise.' : 'Make it yours.',
                      style: const TextStyle(
                        color: KinetiqColors.textPrimary,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),

                    const SizedBox(height: 8),

                    const Text(
                      'Customize your exercise and how you track it.',
                      style: TextStyle(
                        color: KinetiqColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // ------------------------------------
                    // NAME FIELD COMPONENT
                    // ------------------------------------
                    ExerciseFormFields(
                      nameController: _nameController,
                      muscleGroupController: _muscleGroupController,
                      notesController: _notesController,
                      showName: true,
                      showOptionalFields: false,
                    ),

                    const SizedBox(height: 20),

                    // ------------------------------------
                    // CATEGORY SELECTOR COMPONENT
                    // ------------------------------------
                    ExerciseCategorySelector(
                      selectedCategory: _category,
                      onChanged: _onCategoryChanged,
                    ),

                    const SizedBox(height: 28),

                    // ------------------------------------
                    // TRACKING MODE COMPONENT
                    // ------------------------------------
                    ExerciseTrackingModeSelector(
                      selectedMode: _trackingMode,
                      onChanged: _onTrackingModeChanged,
                    ),

                    const SizedBox(height: 20),

                    // ------------------------------------
                    // OPTIONAL FORM FIELDS COMPONENT
                    // ------------------------------------
                    ExerciseFormFields(
                      nameController: _nameController,
                      muscleGroupController: _muscleGroupController,
                      notesController: _notesController,
                      showName: false,
                      showOptionalFields: true,
                    ),

                    const SizedBox(height: 32),

                    // ------------------------------------
                    // REUSABLE SAVE BUTTON COMPONENT
                    // ------------------------------------
                    ExerciseSaveButton(
                      isSaving: _isSaving,
                      isEditing: _isEditing,
                      onPressed: _saveExercise,
                    ),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
    );
  }
}
