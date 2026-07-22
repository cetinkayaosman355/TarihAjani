import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';
import 'sohbet.dart';

/// MASA — açılış: Günün Dosyası + Yeni Dosya CTA + Gizli Arşiv şeridi + Ajanla
/// Konuş. PWA'daki düzenin premium hâli; iki temada da aynı ızgara.
class MasaEkrani extends StatelessWidget {
  const MasaEkrani({super.key, required this.api, required this.uretAc});
  final StudioApi api;
  final VoidCallback uretAc;

  static const _arsivOrnekleri = [
    ('TA-ARSIV-022', 'Mısır\'ın 3500 Yıllık Gebelik Testi'),
    ('TA-ARSIV-023', 'Derinkuyu — Tavukların Bulduğu Yeraltı Şehri'),
    ('TA-ARSIV-024', 'Loulan Güzeli — Çölün 3800 Yıllık Sırrı'),
    ('TA-ARSIV-025', 'Attila\'nın Kayıp Mezarı'),
  ];

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
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
            ],
          ),
          const SizedBox(height: Bosluk.xl),

          // GÜNÜN DOSYASI — kahraman kart (altın çerçeveli, degrade zemin)
          _GununDosyasi(vurgu: context.vurgu),
          const SizedBox(height: Bosluk.l),

          // YENİ DOSYA — birincil eylem
          AltinButon(metin: 'YENİ DOSYA ÜRET', ikon: Icons.auto_stories, onTap: uretAc),
          const SizedBox(height: Bosluk.m),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => SohbetSayfasi(api: api))),
            icon: Icon(Icons.forum_outlined, size: 18, color: context.vurgu),
            label: const Text('Ajanla konuşarak üret'),
          ),
          const SizedBox(height: Bosluk.xxl),

          // GİZLİ ARŞİV — yatay şerit
          BolumEtiketi('GİZLİ ARŞİV',
              sag: Text('web ile ortak →',
                  style: TextStyle(fontSize: 11, color: context.soluk))),
          const SizedBox(height: Bosluk.m),
          SizedBox(
            height: 148,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _arsivOrnekleri.length,
              separatorBuilder: (_, __) => const SizedBox(width: Bosluk.m),
              itemBuilder: (context, i) {
                final (no, ad) = _arsivOrnekleri[i];
                return SizedBox(
                  width: 168,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(Bosluk.l),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(no,
                              style: TextStyle(
                                  fontSize: 9.5,
                                  letterSpacing: 1.6,
                                  color: context.vurgu,
                                  fontWeight: FontWeight.w700)),
                          const Spacer(),
                          Text(ad,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600, height: 1.35)),
                          const SizedBox(height: Bosluk.s),
                          Text('TARİH DOSYASI',
                              style: TextStyle(fontSize: 9, letterSpacing: 1.4, color: context.soluk)),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: Bosluk.xl),
          Text(
            'Tam arşiv, mağaza ve oyunlar web\'de: tarihajani.com — hesabın ortak, ürettiklerin iki tarafta da görünür.',
            style: TextStyle(fontSize: 12, color: context.soluk, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class _GununDosyasi extends StatelessWidget {
  const _GununDosyasi({required this.vurgu});
  final Color vurgu;

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
              padding: const EdgeInsets.symmetric(horizontal: Bosluk.m, vertical: Bosluk.xs),
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
            Text('Ötzi — Tarihin En Eski Cinayeti',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: Bosluk.xs),
            Text('TARİH DOSYASI — dosyayı aç →',
                style: TextStyle(fontSize: 11, letterSpacing: 1.2, color: vurgu)),
          ],
        ),
      ),
    );
  }
}
