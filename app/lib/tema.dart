// ═══════════════════════════════════════════════════════════════════════════
// TARİH AJANI — PREMIUM TASARIM SİSTEMİ (native, aydınlık + karanlık)
// Aydınlık: fildişi kâğıt + altın + mürekkep. Karanlık: gece laciverti + altın.
// SİMETRİ: her boşluk 4pt ızgaradan (4/8/12/16/24/32), tek köşe ailesi
// (12/16/999), tüm birincil butonlar 52pt, her ekranda 16pt kenar payı.
// ═══════════════════════════════════════════════════════════════════════════
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// 4pt ızgara — tüm ekranlar bu sabitleri kullanır (simetri garantisi).
class Bosluk {
  static const double xs = 4, s = 8, m = 12, l = 16, xl = 24, xxl = 32;
  static const double kenar = 16;
}

class Kose {
  static const double kart = 14, cip = 999, alan = 16;
}

class Renkler {
  // Aydınlık
  static const kagit = Color(0xFFF7F1E3);
  static const kart = Color(0xFFFFFDF8);
  static const murekkep = Color(0xFF241F16);
  static const murekkep2 = Color(0xFF6B6454);
  static const altinKoyu = Color(0xFF8A6417);
  static const cizgiAcik = Color(0x47967434);
  // Karanlık (gece laciverti — PWA/web gece kimliği)
  static const gece = Color(0xFF090C14);
  static const geceKart = Color(0xFF11151F);
  static const geceMurekkep = Color(0xFFF2ECD9);
  static const geceMurekkep2 = Color(0xFF9AA0AC);
  static const geceAltin = Color(0xFFE6C478);
  static const cizgiGece = Color(0x59C19A52);
  // Ortak
  static const altin = Color(0xFFC19A52);
  static const mor = Color(0xFF9A72EE);
}

/// Altın degrade — birincil eylemler (ÜRET) ve vurgu yüzeyleri için tek kaynak.
const altinGradyan = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFFA77D35), Color(0xFFE9C87E), Color(0xFFC19A52)],
  stops: [0.0, 0.55, 1.0],
);

extension TemaYardimci on BuildContext {
  bool get gece => Theme.of(this).brightness == Brightness.dark;
  Color get cizgi => gece ? Renkler.cizgiGece : Renkler.cizgiAcik;
  Color get soluk => gece ? Renkler.geceMurekkep2 : Renkler.murekkep2;
  Color get vurgu => gece ? Renkler.geceAltin : Renkler.altinKoyu;
}

ThemeData ajanTema(Brightness b) {
  final aydinlik = b == Brightness.light;
  final scheme = ColorScheme(
    brightness: b,
    primary: aydinlik ? Renkler.altinKoyu : Renkler.geceAltin,
    onPrimary: aydinlik ? Colors.white : Renkler.gece,
    secondary: Renkler.mor,
    onSecondary: Colors.white,
    error: const Color(0xFFC96A5A),
    onError: Colors.white,
    surface: aydinlik ? Renkler.kagit : Renkler.gece,
    onSurface: aydinlik ? Renkler.murekkep : Renkler.geceMurekkep,
    surfaceContainerHighest: aydinlik ? Renkler.kart : Renkler.geceKart,
    outline: aydinlik ? Renkler.cizgiAcik : Renkler.cizgiGece,
  );
  final serif = GoogleFonts.playfairDisplayTextTheme();
  final govde = GoogleFonts.interTextTheme();
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surface,
    textTheme: govde
        .apply(bodyColor: scheme.onSurface, displayColor: scheme.onSurface)
        .copyWith(
          headlineMedium: serif.headlineMedium?.copyWith(
              fontWeight: FontWeight.w800, color: scheme.onSurface, height: 1.15),
          headlineSmall: serif.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800, color: scheme.onSurface, height: 1.2),
          titleLarge: serif.titleLarge?.copyWith(
              fontWeight: FontWeight.w700, color: scheme.onSurface),
          labelSmall: govde.labelSmall?.copyWith(
              letterSpacing: 2, color: scheme.onSurface.withValues(alpha: .55)),
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
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Kose.cip),
        side: BorderSide(color: scheme.outline),
      ),
      backgroundColor: Colors.transparent,
      selectedColor: scheme.primary.withValues(alpha: aydinlik ? .16 : .2),
      labelStyle: TextStyle(color: scheme.onSurface, fontSize: 13),
      padding: const EdgeInsets.symmetric(horizontal: Bosluk.m, vertical: Bosluk.s),
      showCheckmark: false,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Kose.kart)),
        textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: .6),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        side: BorderSide(color: scheme.outline),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Kose.kart)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainerHighest,
      contentPadding: const EdgeInsets.symmetric(horizontal: Bosluk.l, vertical: Bosluk.l),
      hintStyle: TextStyle(color: scheme.onSurface.withValues(alpha: .4)),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Kose.alan),
        borderSide: BorderSide(color: scheme.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Kose.alan),
        borderSide: BorderSide(color: scheme.outline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Kose.alan),
        borderSide: BorderSide(color: scheme.primary, width: 1.4),
      ),
    ),
  );
}

/// Kredi rozeti — bilinen son bakiye (sunucu yanıtlarından). PWA'daki "11490 KR".
class KrediRozeti extends StatelessWidget {
  const KrediRozeti({super.key, required this.bakiye});
  final int? bakiye;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Bosluk.m, vertical: 6),
      decoration: BoxDecoration(
        border: Border.all(color: context.cizgi),
        borderRadius: BorderRadius.circular(Kose.cip),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.toll, size: 14, color: context.vurgu),
          const SizedBox(width: 6),
          Text(bakiye == null ? 'KR' : '$bakiye KR',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: .5,
                  color: context.vurgu)),
        ],
      ),
    );
  }
}

/// Bölüm başlığı etiketi — "GİZLİ ARŞİV" gibi harf aralıklı altın eyebrow.
class BolumEtiketi extends StatelessWidget {
  const BolumEtiketi(this.metin, {super.key, this.sag});
  final String metin;
  final Widget? sag;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(metin,
            style: TextStyle(
                fontSize: 11,
                letterSpacing: 2.4,
                fontWeight: FontWeight.w700,
                color: context.vurgu)),
        const Spacer(),
        if (sag != null) sag!,
      ],
    );
  }
}

/// Altın degrade birincil buton (ÜRET vb.) — tek kaynak, her yerde aynı.
class AltinButon extends StatelessWidget {
  const AltinButon({super.key, required this.metin, this.onTap, this.ikon});
  final String metin;
  final VoidCallback? onTap;
  final IconData? ikon;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: onTap == null ? null : altinGradyan,
        color: onTap == null ? context.cizgi : null,
        borderRadius: BorderRadius.circular(Kose.kart),
        boxShadow: onTap == null
            ? null
            : [BoxShadow(color: Renkler.altin.withValues(alpha: .35), blurRadius: 22, offset: const Offset(0, 8))],
      ),
      child: SizedBox(
        height: 52,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(Kose.kart),
            onTap: onTap,
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (ikon != null) ...[
                    Icon(ikon, size: 18, color: const Color(0xFF171207)),
                    const SizedBox(width: Bosluk.s),
                  ],
                  Text(metin,
                      style: const TextStyle(
                          color: Color(0xFF171207),
                          fontWeight: FontWeight.w800,
                          letterSpacing: .8)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
