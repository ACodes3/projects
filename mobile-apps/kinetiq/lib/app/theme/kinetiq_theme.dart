
import 'package:material_ui/material_ui.dart';

/// Centralized color palette for the KINETIQ application.
abstract final class KinetiqColors {
  static const Color background = Color(0xFF101416);
  static const Color surface = Color(0xFF202B27);
  static const Color surfaceElevated = Color(0xFF28362D);

  static const Color primary = Color(0xFFC5F26B);

  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB1BDB7);
  static const Color textMuted = Color(0xFF9EAAA4);

  static const Color border = Color(0xFF34413B);
}

/// Application-wide Flutter theme.
abstract final class KinetiqTheme {
  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,

      scaffoldBackgroundColor: KinetiqColors.background,

      colorScheme: ColorScheme.fromSeed(
        seedColor: KinetiqColors.primary,
        brightness: Brightness.dark,
        surface: KinetiqColors.background,
      ),

      appBarTheme: const AppBarThemeData(
        backgroundColor: KinetiqColors.background,
        foregroundColor: KinetiqColors.textPrimary,
        centerTitle: false,
        elevation: 0,
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: KinetiqColors.primary,
          foregroundColor: KinetiqColors.background,
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 18,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }
}
