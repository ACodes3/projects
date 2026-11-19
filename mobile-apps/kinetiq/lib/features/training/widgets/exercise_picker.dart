import 'package:material_ui/material_ui.dart';

import '../../../core/domain/models.dart';
import '../../../core/theme/kinetiq_theme.dart';
import '../../../shared/widgets/k_text_field.dart';
import 'exercise_tile.dart';

/// Reusable filtered exercise picker for templates and active workouts.
Future<Exercise?> showExercisePicker(
  BuildContext context, {
  required List<Exercise> exercises,
  String title = 'Choose an exercise',
}) => showModalBottomSheet<Exercise>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  builder: (context) => _PickerBody(exercises: exercises, title: title),
);

class _PickerBody extends StatefulWidget {
  const _PickerBody({required this.exercises, required this.title});
  final List<Exercise> exercises;
  final String title;
  @override
  State<_PickerBody> createState() => _PickerBodyState();
}

class _PickerBodyState extends State<_PickerBody> {
  final query = TextEditingController();
  @override
  void dispose() {
    query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.exercises
        .where(
          (x) =>
              x.name.toLowerCase().contains(query.text.toLowerCase()) ||
              x.group.toLowerCase().contains(query.text.toLowerCase()),
        )
        .toList();
    return FractionallySizedBox(
      heightFactor: .8,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 5),
            const Text(
              'Search by exercise name or muscle group.',
              style: TextStyle(color: KColors.muted),
            ),
            const SizedBox(height: 14),
            KTextField(
              controller: query,
              label: 'Search exercises',
              prefix: const Icon(Icons.search),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.separated(
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) => ExerciseTile(
                  exercise: items[index],
                  onTap: () => Navigator.pop(context, items[index]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
