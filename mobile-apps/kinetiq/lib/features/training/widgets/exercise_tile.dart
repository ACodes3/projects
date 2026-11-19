import 'package:material_ui/material_ui.dart';

import '../../../core/domain/models.dart';
import '../../../shared/widgets/k_list_tile.dart';

class ExerciseTile extends StatelessWidget {
  const ExerciseTile({
    super.key,
    required this.exercise,
    required this.onTap,
    this.trailing,
  });
  final Exercise exercise;
  final VoidCallback onTap;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => KListTile(
    title: exercise.name,
    subtitle:
        '${exercise.group} · ${exercise.equipment} · ${exercise.mode.replaceAll('_', ' + ')}',
    icon: exercise.category == 'cardio'
        ? Icons.directions_run
        : Icons.fitness_center,
    onTap: onTap,
    trailing: trailing,
    accent: exercise.favorite,
  );
}
