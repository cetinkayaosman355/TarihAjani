// ═══════════════════════════════════════════════════════════════════════════
// TARİH AJANI — TASARIM SİSTEMİ (native)
// Web'in kimliği (fildişi kâğıt + altın + mürekkep; gece: lacivert) native
// Material 3'e taşınır. SİMETRİ: her boşluk 4pt ızgaradan (4/8/12/16/24/32),
// her köşe yarıçapı tek aileden (8/12/16), her ekran aynı kenar payını (16)
// kullanır — hiçbir ekran kendi kafasına göre ölçü uydurmaz.
// ═══════════════════════════════════════════════════════════════════════════
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// 4pt ızgara — tüm ekranlar bu sabitleri kullanır (simetri garantisi).
class Bosluk {
  static const double xs = 4, s = 8, m = 12, l = 16, xl = 24, xxl = 32;
  static const double kenar = 16; // her ekranın yatay kenar payı
}

class Kose {
  static const double kart = 12, cip = 999, alan = 16, kucuk = 8;
}

class Renkler {
  // Aydınlık (varsayılan — web ile aynı sıcak kâğıt)
  static const kagit = Color(0xFFF7F1E3);
  static const kart = Color(0xFFFFFDF8);
  static const murekkep = Color(0xFF241F16);
  static const murekkep2 = Color(0xFF5B5445);
  static const altin = Color(0xFF8A6417);
  static const altinAcik = Color(0xFFC19A52);
  static const cizgi = Color(0x52967434);
  // Gece (web gece temasıyla aynı lacivert aile)
  static const gece = Color(0xFF0B0E16);
  static const geceKart = Color(0xFF141926);
  static const geceMurekkep = Color(0xFFE8E2D1);
  static const geceAltin = Color(0xFFD9B56A);
  static const mor = Color(0xFF6A3BD0);
}

ThemeData ajanTema(Brightness b) {
  final aydinlik = b == Brightness.light;
  final scheme = ColorScheme(
    brightness: b,
    primary: aydinlik ? Renkler.altin : Renkler.geceAltin,
    onPrimary: aydinlik ? Colors.white : Renkler.gece,
    secondary: Renkler.mor,
    onSecondary: Colors.white,
    error: const Color(0xFFB0413E),
    onError: Colors.white,
    surface: aydinlik ? Renkler.kagit : Renkler.gece,
    onSurface: aydinlik ? Renkler.murekkep : Renkler.geceMurekkep,
    surfaceContainerHighest: aydinlik ? Renkler.kart : Renkler.geceKart,
    outline: Renkler.cizgi,
  );
  final serif = GoogleFonts.playfairDisplayTextTheme();
  final govde = GoogleFonts.interTextTheme();
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surface,
    textTheme: govde.apply(bodyColor: scheme.onSurface, displayColor: scheme.onSurface).copyWith(
      // Başlıklar serif (web'deki Playfair kimliği), gövde temiz sans
      headlineMedium: serif.headlineMedium?.copyWith(fontWeight: FontWeight.w800, color: scheme.onSurface),
      titleLarge: serif.titleLarge?.copyWith(fontWeight: FontWeight.w700, color: scheme.onSurface),
    ),
    cardTheme: CardThemeData(
      color: scheme.surfaceContainerHighest,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Kose.kart),
        side: BorderSide(color: scheme.outline),
      ),
      margin: EdgeInsets.zero,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52), // tüm birincil butonlar AYNI yükseklik
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Kose.kart)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: .4),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainerHighest,
      contentPadding: const EdgeInsets.symmetric(horizontal: Bosluk.l, vertical: Bosluk.l),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Kose.alan),
        borderSide: BorderSide(color: scheme.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Kose.alan),
        borderSide: BorderSide(color: scheme.outline),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: scheme.surfaceContainerHighest,
      indicatorColor: scheme.primary.withValues(alpha: .16),
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
    ),
  );
}
