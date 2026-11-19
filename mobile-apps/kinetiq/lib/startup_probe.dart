import 'package:material_ui/material_ui.dart';

void main() {
  runApp(
    const MaterialApp(
      home: Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Text(
            'FLUTTER RENDERS!',
            style: TextStyle(
              color: Colors.black,
              fontSize: 28,
            ),
          ),
        ),
      ),
    ),
  );
}
