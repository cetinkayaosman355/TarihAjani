import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api.dart';
import '../tema.dart';
import '../veri.dart';
import 'sohbet.dart';
import 'vaka.dart';
import 'oyun.dart';
import 'magaza.dart';
import 'oyun2.dart';
import 'satranc.dart';
import 'mangala.dart';

/// MASA — açılış: Günün Dosyası + Yeni Dosya CTA + Gizli Arşiv + Oyun Tüneli
/// + sağ üstte GEZİN/İÇERİK/MAĞAZA menü paneli (PWA kimliğinin premium hâli).
class MasaEkrani extends StatelessWidget {
  const MasaEkrani({super.key, required this.api, required this.uretAc});
  final StudioApi api;
  final VoidCallback uretAc;

  void _vakaAc(BuildContext context, Vaka v) => Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => VakaSayfasi(vaka: v, uretAc: uretAc)));

  void _menuAc(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) => _MenuPaneli(
        uretAc: () { Navigator.pop(sheetContext); uretAc(); },
        sohbetAc: () {
          Navigator.pop(sheetContext);
          Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => SohbetSayfasi(api: api)));
        },
        oyunAc: () {
          Navigator.pop(sheetContext);
          Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const OyunSayfasi()));
        },
        magazaAc: () {
          Navigator.pop(sheetContext);
          Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const MagazaSayfasi()));
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    final ilkVaka = vakalar.first;
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(Bosluk.kenar),
        children: [
          const SizedBox(height: Bosluk.s),
          Row(
            children: [
              Icon(Icons.explore, color: context.vurgu, size: 26),
              const SizedBox(width: Bosluk.s),
              Text('Tarih Ajanı', style: tema.textTheme.headlineSmall),
              const Spacer(),
              ValueListenableBuilder<int?>(
                  valueListenable: sonKredi,
                  builder: (context, b, _) => KrediRozeti(bakiye: b)),
              const SizedBox(width: Bosluk.s),
              IconButton(
                onPressed: () => _menuAc(context),
                icon: Icon(Icons.menu, color: context.vurgu),
                style: IconButton.styleFrom(
                  side: BorderSide(color: tema.colorScheme.outline),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Kose.kart)),
                ),
              ),
            ],
          ),
          const SizedBox(height: Bosluk.xl),

          // GÜNÜN DOSYASI — tıklayınca vaka dosyası açılır
          InkWell(
            borderRadius: BorderRadius.circular(Kose.kart),
            onTap: () => _vakaAc(context, ilkVaka),
            child: _GununDosyasi(vaka: ilkVaka),
          ),
          const SizedBox(height: Bosluk.l),

          AltinButon(metin: 'YENİ DOSYA ÜRET', ikon: Icons.auto_stories, onTap: uretAc),
          const SizedBox(height: Bosluk.m),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => SohbetSayfasi(api: api))),
            icon: Icon(Icons.forum_outlined, size: 18, color: context.vurgu),
            label: const Text('Ajanla konuşarak üret'),
          ),
          const SizedBox(height: Bosluk.xxl),

          // GİZLİ ARŞİV — gerçek vakalar, tıklanınca dosya açılır
          BolumEtiketi('GİZLİ ARŞİV',
              sag: Text('${vakalar.length} dosya',
                  style: TextStyle(fontSize: 11, color: context.soluk))),
          const SizedBox(height: Bosluk.m),
          SizedBox(
            height: 156,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: vakalar.length,
              separatorBuilder: (_, __) => const SizedBox(width: Bosluk.m),
              itemBuilder: (context, i) {
                final v = vakalar[i];
                return SizedBox(
                  width: 172,
                  child: Card(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(Kose.kart),
                      onTap: () => _vakaAc(context, v),
                      child: Padding(
                        padding: const EdgeInsets.all(Bosluk.l),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(v.no,
                                style: TextStyle(
                                    fontSize: 9.5,
                                    letterSpacing: 1.6,
                                    color: context.vurgu,
                                    fontWeight: FontWeight.w700)),
                            const Spacer(),
                            Text(v.baslik,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    height: 1.35)),
                            const SizedBox(height: Bosluk.s),
                            Text(v.donem.toUpperCase(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    fontSize: 8.5,
                                    letterSpacing: 1.2,
                                    color: context.soluk)),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: Bosluk.xxl),

          // OYUN TÜNELİ — ilk native oyun: Zaman Görevi
          const BolumEtiketi('OYUN TÜNELİ'),
          const SizedBox(height: Bosluk.m),
          Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(Kose.kart),
              onTap: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => const OyunSayfasi())),
              child: Padding(
                padding: const EdgeInsets.all(Bosluk.l),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                          gradient: altinGradyan, shape: BoxShape.circle),
                      child: const Icon(Icons.timer_outlined,
                          color: Color(0xFF171207)),
                    ),
                    const SizedBox(width: Bosluk.m),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Zaman Görevi',
                              style: TextStyle(
                                  fontSize: 15, fontWeight: FontWeight.w700)),
                          Text('${zamanGorevi.length} soru · tarih bilgi oyunu',
                              style:
                                  TextStyle(fontSize: 12, color: context.soluk)),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: context.soluk),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: Bosluk.m),
          Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(Kose.kart),
              onTap: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => const KronolojiSayfasi())),
              child: Padding(
                padding: const EdgeInsets.all(Bosluk.l),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                          gradient: altinGradyan, shape: BoxShape.circle),
                      child: const Icon(Icons.hourglass_bottom,
                          color: Color(0xFF171207)),
                    ),
                    const SizedBox(width: Bosluk.m),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Kronoloji',
                              style: TextStyle(
                                  fontSize: 15, fontWeight: FontWeight.w700)),
                          Text('olayları eskiden yeniye sırala',
                              style:
                                  TextStyle(fontSize: 12, color: context.soluk)),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: context.soluk),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: Bosluk.m),
          _OyunKarti(
            simge: '♞',
            ad: 'Satranç 1402',
            alt: 'Timur vs Bayezid — gerçek kurallar',
            ac: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const SatrancSayfasi())),
          ),
          const SizedBox(height: Bosluk.m),
          _OyunKarti(
            simge: '🏺',
            ad: 'Mangala',
            alt: 'Türk taş oyunu — hazineyi doldur',
            ac: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const MangalaSayfasi())),
          ),
          const SizedBox(height: Bosluk.xl),
        ],
      ),
    );
  }
}

/// GEZİN / İÇERİK / MAĞAZA — PWA'daki menü panelinin premium native hâli.
class _MenuPaneli extends StatelessWidget {
  const _MenuPaneli(
      {required this.uretAc,
      required this.sohbetAc,
      required this.oyunAc,
      required this.magazaAc});
  final VoidCallback uretAc, sohbetAc, oyunAc, magazaAc;

  @override
  Widget build(BuildContext context) {
    Widget oge(IconData ikon, String ad, VoidCallback? onTap) => Expanded(
          child: Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(Kose.kart),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: Bosluk.l),
                child: Column(
                  children: [
                    Icon(ikon, color: context.vurgu),
                    const SizedBox(height: Bosluk.s),
                    Text(ad,
                        style: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ),
        );

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(Bosluk.kenar),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                      color: context.cizgi,
                      borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: Bosluk.l),
            const BolumEtiketi('GEZİN'),
            const SizedBox(height: Bosluk.m),
            Row(children: [
              oge(Icons.auto_stories, 'Dosya Üret', uretAc),
              const SizedBox(width: Bosluk.m),
              oge(Icons.forum_outlined, 'Ajan Masası', sohbetAc),
            ]),
            const SizedBox(height: Bosluk.l),
            const BolumEtiketi('İÇERİK'),
            const SizedBox(height: Bosluk.m),
            Row(children: [
              oge(Icons.videogame_asset_outlined, 'Oyun Tüneli', oyunAc),
              const SizedBox(width: Bosluk.m),
              oge(Icons.school_outlined, 'Akademi', () { Navigator.pop(context); launchUrl(Uri.parse('https://tarihajani.com/egitim'), mode: LaunchMode.externalApplication); }),
            ]),
            const SizedBox(height: Bosluk.l),
            const BolumEtiketi('MAĞAZA'),
            const SizedBox(height: Bosluk.m),
            Row(children: [
              oge(Icons.toll, 'Krediler & Paketler', magazaAc),
              const SizedBox(width: Bosluk.m),
              oge(Icons.menu_book_outlined, 'E-Kitaplar', () { Navigator.pop(context); launchUrl(Uri.parse('https://tarihajani.com/ekitap'), mode: LaunchMode.externalApplication); }),
            ]),
            const SizedBox(height: Bosluk.l),
          ],
        ),
      ),
    );
  }
}

class _GununDosyasi extends StatelessWidget {
  const _GununDosyasi({required this.vaka});
  final Vaka vaka;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 190,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(Kose.kart),
        border: Border.all(color: context.cizgi),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: context.gece
              ? const [Color(0xFF1A2030), Color(0xFF0D1017)]
              : const [Color(0xFFEFE3C8), Color(0xFFF9F3E4)],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(Bosluk.l),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: Bosluk.m, vertical: Bosluk.xs),
              decoration: BoxDecoration(
                gradient: altinGradyan,
                borderRadius: BorderRadius.circular(Kose.cip),
              ),
              child: const Text('GÜNÜN DOSYASI',
                  style: TextStyle(
                      fontSize: 9.5,
                      letterSpacing: 1.6,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF171207))),
            ),
            const Spacer(),
            Text(vaka.baslik, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: Bosluk.xs),
            Text('TARİH DOSYASI — dosyayı aç →',
                style: TextStyle(
                    fontSize: 11, letterSpacing: 1.2, color: context.vurgu)),
          ],
        ),
      ),
    );
  }
}

/// Oyun Tüneli satır kartı — tek kaynak (simetri).
class _OyunKarti extends StatelessWidget {
  const _OyunKarti(
      {required this.simge, required this.ad, required this.alt, required this.ac});
  final String simge, ad, alt;
  final VoidCallback ac;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(Kose.kart),
        onTap: ac,
        child: Padding(
          padding: const EdgeInsets.all(Bosluk.l),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                    gradient: altinGradyan, shape: BoxShape.circle),
                child: Center(
                    child: Text(simge,
                        style: const TextStyle(
                            fontSize: 20, color: Color(0xFF171207)))),
              ),
              const SizedBox(width: Bosluk.m),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ad,
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700)),
                    Text(alt,
                        style: TextStyle(fontSize: 12, color: context.soluk)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: context.soluk),
            ],
          ),
        ),
      ),
    );
  }
}
