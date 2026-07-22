import 'package:flutter/material.dart';
import '../tema.dart';

/// KRONOLOJİ — olayları eskiden yeniye SIRAYLA seç. Oyun Tüneli'nin 2. üyesi.
class KronolojiSayfasi extends StatefulWidget {
  const KronolojiSayfasi({super.key});

  @override
  State<KronolojiSayfasi> createState() => _KronolojiSayfasiState();
}

class _Olay {
  const _Olay(this.ad, this.yil);
  final String ad;
  final int yil;
}

const _turlar = [
  [
    _Olay('Göbekli Tepe kuruluyor', -9600),
    _Olay('Mısır piramitleri', -2560),
    _Olay('İstanbul\'un fethi', 1453),
    _Olay('Piri Reis haritası', 1513),
  ],
  [
    _Olay('Ötzi Alpler\'de ölüyor', -3300),
    _Olay('Truva Savaşı (efsanevi)', -1180),
    _Olay('Malazgirt Zaferi', 1071),
    _Olay('Enigma kırılıyor', 1941),
  ],
  [
    _Olay('Loulan Güzeli yaşıyor', -1800),
    _Olay('Varang Muhafızları kuruluyor', 988),
    _Olay('Kanuni tahta çıkıyor', 1520),
    _Olay('Derinkuyu yeniden keşfediliyor', 1963),
  ],
];

class _KronolojiSayfasiState extends State<KronolojiSayfasi> {
  int _tur = 0, _puan = 0;
  final List<int> _secimler = [];
  bool _bitti = false;

  List<_Olay> get _olaylar => _turlar[_tur];

  List<int> get _dogruSira {
    final idx = List<int>.generate(_olaylar.length, (i) => i);
    idx.sort((a, b) => _olaylar[a].yil.compareTo(_olaylar[b].yil));
    return idx;
  }

  void _sec(int i) {
    if (_secimler.contains(i)) return;
    setState(() => _secimler.add(i));
    if (_secimler.length == _olaylar.length) {
      final dogru = _dogruSira;
      var hepsi = true;
      for (var k = 0; k < dogru.length; k++) {
        if (_secimler[k] != dogru[k]) hepsi = false;
      }
      if (hepsi) _puan++;
      Future.delayed(const Duration(milliseconds: 900), () {
        if (!mounted) return;
        setState(() {
          if (_tur + 1 >= _turlar.length) {
            _bitti = true;
          } else {
            _tur++;
            _secimler.clear();
          }
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: tema.colorScheme.surface,
        title: Text('Kronoloji', style: tema.textTheme.titleLarge),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Bosluk.kenar),
          child: _bitti
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(Icons.hourglass_bottom, size: 56, color: context.vurgu),
                    const SizedBox(height: Bosluk.l),
                    Text('$_puan / ${_turlar.length} tur doğru',
                        textAlign: TextAlign.center,
                        style: tema.textTheme.headlineMedium),
                    const SizedBox(height: Bosluk.xl),
                    AltinButon(
                        metin: 'TEKRAR OYNA',
                        ikon: Icons.replay,
                        onTap: () => setState(() {
                              _tur = 0;
                              _puan = 0;
                              _secimler.clear();
                              _bitti = false;
                            })),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    BolumEtiketi('TUR ${_tur + 1} / ${_turlar.length}',
                        sag: Text('$_puan doğru tur',
                            style: TextStyle(fontSize: 12, color: context.soluk))),
                    const SizedBox(height: Bosluk.m),
                    Text('Olayları ESKİDEN YENİYE sırayla seç',
                        style: tema.textTheme.headlineSmall),
                    const SizedBox(height: Bosluk.xl),
                    for (var i = 0; i < _olaylar.length; i++) ...[
                      _OlayKarti(
                        olay: _olaylar[i],
                        sira: _secimler.indexOf(i),
                        tamam: _secimler.length == _olaylar.length,
                        dogruYer: _dogruSira.indexOf(i),
                        onTap: () => _sec(i),
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

class _OlayKarti extends StatelessWidget {
  const _OlayKarti(
      {required this.olay,
      required this.sira,
      required this.tamam,
      required this.dogruYer,
      required this.onTap});
  final _Olay olay;
  final int sira; // -1 = seçilmedi
  final bool tamam;
  final int dogruYer;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    final dogru = tamam && sira == dogruYer;
    final yanlis = tamam && sira != dogruYer;
    final kenar = dogru
        ? const Color(0xFF2F7D43)
        : yanlis
            ? tema.colorScheme.error
            : sira >= 0
                ? tema.colorScheme.primary
                : tema.colorScheme.outline;
    final yilEtiket = olay.yil < 0 ? 'MÖ ${-olay.yil}' : '${olay.yil}';
    return Material(
      color: tema.colorScheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Kose.kart),
        side: BorderSide(color: kenar, width: sira >= 0 ? 1.6 : 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(Kose.kart),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(Bosluk.l),
          child: Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: sira >= 0 ? altinGradyan : null,
                  border: sira >= 0
                      ? null
                      : Border.all(color: tema.colorScheme.outline),
                ),
                child: Center(
                  child: Text(sira >= 0 ? '${sira + 1}' : '',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: Color(0xFF171207))),
                ),
              ),
              const SizedBox(width: Bosluk.m),
              Expanded(
                  child: Text(olay.ad,
                      style: const TextStyle(fontWeight: FontWeight.w600))),
              if (tamam)
                Text(yilEtiket,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: context.vurgu)),
            ],
          ),
        ),
      ),
    );
  }
}
