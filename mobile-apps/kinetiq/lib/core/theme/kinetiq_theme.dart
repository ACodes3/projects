import 'package:material_ui/material_ui.dart';

abstract final class KColors {
  static const background = Color(0xFF101618);
  static const surface = Color(0xFF1D2728);
  static const surfaceRaised = Color(0xFF253132);
  static const lime = Color(0xFFB9ED66);
  static const text = Color(0xFFF4F7F2);
  static const muted = Color(0xFFACB9B4);
  static const outline = Color(0xFF344443);
  static const danger = Color(0xFFFF827C);
  static const orange = Color(0xFFFFC47B);
}

abstract final class KTheme {
  static ThemeData get dark {
    const scheme = ColorScheme.dark(
      primary: KColors.lime,
      onPrimary: KColors.background,
      secondary: KColors.lime,
      surface: KColors.surface,
      onSurface: KColors.text,
      error: KColors.danger,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: KColors.background,
      splashFactory: InkRipple.splashFactory,
      appBarTheme: const AppBarTheme(
        backgroundColor: KColors.background,
        foregroundColor: KColors.text,
        elevation: 0,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          height: 1.05,
          fontWeight: FontWeight.w800,
          color: KColors.text,
        ),
        headlineMedium: TextStyle(
          fontSize: 26,
          height: 1.12,
          fontWeight: FontWeight.w800,
          color: KColors.text,
        ),
        titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: KColors.text,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: KColors.text,
        ),
        bodyMedium: TextStyle(fontSize: 14, height: 1.4, color: KColors.text),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: KColors.surface,
        hintStyle: const TextStyle(color: KColors.muted),
        labelStyle: const TextStyle(color: KColors.muted),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: KColors.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: KColors.lime),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: KColors.danger),
        ),
      ),
      dividerColor: KColors.outline,
      snackBarTheme: SnackBarThemeData(
        backgroundColor: KColors.surfaceRaised,
        contentTextStyle: const TextStyle(color: KColors.text),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        behavior: SnackBarBehavior.floating,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: KColors.surface,
        modalBackgroundColor: KColors.surface,
        showDragHandle: true,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: KColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}
