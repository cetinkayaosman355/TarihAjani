import 'package:flutter/material.dart';
import '../tema.dart';
import '../veri.dart';

/// ZAMAN GÖREVİ — native tarih bilgi oyunu (Oyun Tüneli'nin ilk üyesi).
class OyunSayfasi extends StatefulWidget {
  const OyunSayfasi({super.key});

  @override
  State<OyunSayfasi> createState() => _OyunSayfasiState();
}

class _OyunSayfasiState extends State<OyunSayfasi> {
  int _soruNo = 0, _puan = 0;
  int? _secim;
  bool _bitti = false;

  void _cevapla(int i) {
    if (_secim != null) return;
    setState(() {
      _secim = i;
      if (i == zamanGorevi[_soruNo].dogru) _puan++;
    });
    Future.delayed(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      setState(() {
        if (_soruNo + 1 >= zamanGorevi.length) {
          _bitti = true;
        } else {
          _soruNo++;
          _secim = null;
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    final soru = zamanGorevi[_soruNo];
    return Scaffold(
      appBar: AppBar(
        backgroundColor: tema.colorScheme.surface,
        title: Text('Zaman Görevi', style: tema.textTheme.titleLarge),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Bosluk.kenar),
          child: _bitti
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(Icons.military_tech, size: 60, color: context.vurgu),
                    const SizedBox(height: Bosluk.l),
                    Text('$_puan / ${zamanGorevi.length}',
                        textAlign: TextAlign.center,
                        style: tema.textTheme.headlineMedium),
                    const SizedBox(height: Bosluk.s),
                    Text(
                      _puan >= 6
                          ? 'Başmüfettiş seviyesi — arşiv sana emanet.'
                          : _puan >= 4
                              ? 'Sağlam ajan işi. Bir tur daha?'
                              : 'Dosyalara biraz daha dal — tekrar dene.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: context.soluk, height: 1.5),
                    ),
                    const SizedBox(height: Bosluk.xl),
                    AltinButon(
                        metin: 'TEKRAR OYNA',
                        ikon: Icons.replay,
                        onTap: () => setState(() {
                              _soruNo = 0;
                              _puan = 0;
                              _secim = null;
                              _bitti = false;
                            })),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    BolumEtiketi('SORU ${_soruNo + 1} / ${zamanGorevi.length}',
                        sag: Text('$_puan doğru',
                            style: TextStyle(fontSize: 12, color: context.soluk))),
                    const SizedBox(height: Bosluk.m),
                    LinearProgressIndicator(
                      value: (_soruNo + 1) / zamanGorevi.length,
                      minHeight: 5,
                      borderRadius: BorderRadius.circular(3),
                      backgroundColor: tema.colorScheme.outline.withValues(alpha: .3),
                    ),
                    const SizedBox(height: Bosluk.xl),
                    Text(soru.metin, style: tema.textTheme.headlineSmall),
                    const SizedBox(height: Bosluk.xl),
                    for (var i = 0; i < soru.secenekler.length; i++) ...[
                      _Secenek(
                        metin: soru.secenekler[i],
                        durum: _secim == null
                            ? _Durum.bos
                            : i == soru.dogru
                                ? _Durum.dogru
                                : i == _secim
                                    ? _Durum.yanlis
                                    : _Durum.bos,
                        onTap: () => _cevapla(i),
                      ),
                      const SizedBox(height: Bosluk.m),
                    ],
                  ],
                ),
        ),
      ),
    );
  }
}

enum _Durum { bos, dogru, yanlis }

class _Secenek extends StatelessWidget {
  const _Secenek({required this.metin, required this.durum, required this.onTap});
  final String metin;
  final _Durum durum;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    final renk = switch (durum) {
      _Durum.dogru => const Color(0xFF2F7D43),
      _Durum.yanlis => tema.colorScheme.error,
      _Durum.bos => tema.colorScheme.outline,
    };
    return Material(
      color: durum == _Durum.dogru
          ? const Color(0xFF2F7D43).withValues(alpha: .12)
          : tema.colorScheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Kose.kart),
        side: BorderSide(color: renk, width: durum == _Durum.bos ? 1 : 1.6),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(Kose.kart),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(Bosluk.l),
          child: Text(metin, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}
