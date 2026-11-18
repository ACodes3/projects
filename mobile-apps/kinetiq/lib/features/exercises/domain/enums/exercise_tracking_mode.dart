/// Supported exercise tracking modes in KINETIQ.
///
/// These values are stored in SQLite as strings.
enum ExerciseTrackingMode {
  weightReps('weight_reps', 'Weight + Reps'),
  reps('reps', 'Reps Only'),
  duration('duration', 'Duration'),
  distance('distance', 'Distance');

  const ExerciseTrackingMode(this.databaseValue, this.label);

  /// Value stored in SQLite.
  final String databaseValue;

  /// Human-readable label shown in the UI.
  final String label;

  /// Converts a SQLite string into a tracking mode.
  ///
  /// Falls back to reps if an unknown value is encountered.
  static ExerciseTrackingMode fromDatabase(String value) {
    for (final mode in ExerciseTrackingMode.values) {
      if (mode.databaseValue == value) {
        return mode;
      }
    }

    return ExerciseTrackingMode.reps;
  }
}
