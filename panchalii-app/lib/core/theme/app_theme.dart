import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Panchalii — Luxury Indian Fashion (dark forest green + gold)
class AppColors {
  static const bg = Color(0xFF192619); // deep forest green
  static const bgDark = Color(0xFF0F1A0F); // darkest green
  static const bgCard = Color(0xFF1E301E); // elevated surface
  static const gold = Color(0xFFC9A96E); // champagne gold
  static const goldLight = Color(0xFFDEC48A); // hover gold
  static const cream = Color(0xFFF5F0E8); // warm cream
  static const creamMuted = Color(0xFFB8A98A); // muted cream
  static const border = Color(0x40C9A96E); // gold border (25% alpha)
  static const error = Color(0xFFD92D20);
  static const success = Color(0xFF22C55E);

  // Legacy names: screens use `white` as page background and `secondary` as primary text
  static const primary = gold;
  static const secondary = cream;
  static const tertiary = creamMuted;
  static const surface = bg;
  static const muted = bgCard;
  static const white = bg;
}

ThemeData buildAppTheme() {
  final base = ThemeData.dark(useMaterial3: true);

  final textTheme = base.textTheme.copyWith(
    displayLarge: GoogleFonts.cormorantGaramond(
      fontSize: 60,
      fontWeight: FontWeight.w300,
      color: AppColors.cream,
      height: 1.05,
    ),
    displayMedium: GoogleFonts.cormorantGaramond(
      fontSize: 44,
      fontWeight: FontWeight.w300,
      color: AppColors.cream,
      height: 1.1,
    ),
    displaySmall: GoogleFonts.cormorantGaramond(
      fontSize: 32,
      fontWeight: FontWeight.w400,
      color: AppColors.cream,
      height: 1.15,
    ),
    headlineLarge: GoogleFonts.cormorantGaramond(
      fontSize: 28,
      fontWeight: FontWeight.w500,
      color: AppColors.cream,
    ),
    headlineMedium: GoogleFonts.cormorantGaramond(
      fontSize: 22,
      fontWeight: FontWeight.w500,
      color: AppColors.cream,
    ),
    headlineSmall: GoogleFonts.cormorantGaramond(
      fontSize: 18,
      fontWeight: FontWeight.w500,
      color: AppColors.cream,
    ),
    bodyLarge: GoogleFonts.instrumentSans(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      color: AppColors.cream,
    ),
    bodyMedium: GoogleFonts.instrumentSans(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      color: AppColors.creamMuted,
    ),
    bodySmall: GoogleFonts.instrumentSans(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      color: AppColors.creamMuted,
    ),
    labelLarge: GoogleFonts.instrumentSans(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      color: AppColors.gold,
      letterSpacing: 2.5,
    ),
    labelMedium: GoogleFonts.instrumentSans(
      fontSize: 10,
      fontWeight: FontWeight.w500,
      color: AppColors.creamMuted,
      letterSpacing: 2.0,
    ),
    labelSmall: GoogleFonts.instrumentSans(
      fontSize: 9,
      fontWeight: FontWeight.w500,
      color: AppColors.creamMuted,
      letterSpacing: 2.0,
    ),
  );

  return base.copyWith(
    colorScheme: const ColorScheme.dark(
      primary: AppColors.gold,
      onPrimary: AppColors.bgDark,
      secondary: AppColors.bgCard,
      onSecondary: AppColors.cream,
      surface: AppColors.bg,
      onSurface: AppColors.cream,
      error: AppColors.error,
      outline: AppColors.border,
    ),
    scaffoldBackgroundColor: AppColors.bg,
    textTheme: textTheme,

    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.bgDark,
      foregroundColor: AppColors.cream,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: GoogleFonts.cormorantGaramond(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: AppColors.cream,
        letterSpacing: 3.0,
      ),
      iconTheme: const IconThemeData(color: AppColors.creamMuted, size: 20),
      surfaceTintColor: Colors.transparent,
    ),

    // Gold-outlined buttons
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.all(Colors.transparent),
        foregroundColor: WidgetStateProperty.all(AppColors.gold),
        side: WidgetStateProperty.all(
          const BorderSide(color: AppColors.gold, width: 1),
        ),
        textStyle: WidgetStateProperty.all(
          GoogleFonts.instrumentSans(
            fontWeight: FontWeight.w500,
            fontSize: 11,
            letterSpacing: 2.5,
          ),
        ),
        shape: WidgetStateProperty.all(const RoundedRectangleBorder()),
        minimumSize: WidgetStateProperty.all(const Size(double.infinity, 48)),
        padding: WidgetStateProperty.all(
          const EdgeInsets.symmetric(horizontal: 24),
        ),
        overlayColor: WidgetStateProperty.all(AppColors.gold.withOpacity(0.1)),
        elevation: WidgetStateProperty.all(0),
      ),
    ),

    // Gold filled button
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.bgDark,
        side: BorderSide.none,
        textStyle: GoogleFonts.instrumentSans(
          fontWeight: FontWeight.w600,
          fontSize: 11,
          letterSpacing: 2.5,
        ),
        shape: const RoundedRectangleBorder(),
        minimumSize: const Size(double.infinity, 48),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        elevation: 0,
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.transparent,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.gold.withOpacity(0.4)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.gold.withOpacity(0.3)),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.gold, width: 1),
      ),
      hintStyle: GoogleFonts.instrumentSans(
        color: AppColors.creamMuted.withOpacity(0.5),
        fontSize: 13,
      ),
      labelStyle: GoogleFonts.instrumentSans(
        color: AppColors.creamMuted,
        fontSize: 11,
        letterSpacing: 1.5,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    cardTheme: const CardThemeData(
      color: AppColors.bgCard,
      elevation: 0,
      shape: RoundedRectangleBorder(side: BorderSide(color: AppColors.border)),
      margin: EdgeInsets.zero,
    ),

    chipTheme: ChipThemeData(
      backgroundColor: AppColors.bgCard,
      selectedColor: AppColors.gold,
      labelStyle: GoogleFonts.instrumentSans(
        fontSize: 9,
        fontWeight: FontWeight.w500,
        letterSpacing: 2.0,
        color: AppColors.creamMuted,
      ),
      side: const BorderSide(color: AppColors.border),
      shape: const RoundedRectangleBorder(),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    ),

    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.bgDark,
      indicatorColor: AppColors.gold.withOpacity(0.15),
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      labelTextStyle: WidgetStateProperty.all(
        GoogleFonts.instrumentSans(
          fontSize: 9,
          fontWeight: FontWeight.w500,
          letterSpacing: 1.5,
          color: AppColors.creamMuted,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: AppColors.gold, size: 20);
        }
        return IconThemeData(
          color: AppColors.creamMuted.withOpacity(0.5),
          size: 20,
        );
      }),
    ),

    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.bgDark,
      selectedItemColor: AppColors.gold,
      unselectedItemColor: Color(0x60B8A98A),
    ),

    dividerColor: AppColors.border,
    dividerTheme: const DividerThemeData(color: AppColors.border, thickness: 1),

    iconTheme: const IconThemeData(color: AppColors.creamMuted, size: 20),
    primaryIconTheme: const IconThemeData(color: AppColors.gold, size: 20),

    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppColors.gold,
    ),
  );
}
