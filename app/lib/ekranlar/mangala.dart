import 'package:flutter/material.dart';
import '../tema.dart';

/// MANGALA — Türk taş oyunu, gerçek kurallarla (federasyon kuralları):
/// tek taş öne gider; çoksa biri kuyuda kalır, kalan saat yönü tersine dağılır
/// (rakip hazine atlanır); son taş kendi hazineye → tekrar oyna; son taş rakip
/// kuyuyu ÇİFT yaparsa o kuyu alınır; son taş kendi BOŞ kuyuna düşerse karşı
/// kuyuyla birlikte alınır. Taşı biten oyuncu rakibin kalan taşlarını da alır.
class MangalaSayfasi extends StatefulWidget {
  const MangalaSayfasi({super.key});

  @override
  State<MangalaSayfasi> createState() => _MangalaSayfasiState();
}

class _MangalaSayfasiState extends State<MangalaSayfasi> {
  // 0-5: senin kuyuların · 6: senin hazinen · 7-12: Bayezid · 13: onun hazinesi
  late List<int> _k;
  bool _sende = true, _bitti = false, _aiOynuyor = false;
  String _mesaj = 'Kuyuna dokun — 4\'er taşla başlarız.';

  @override
  void initState() {
    super.initState();
    _yeni();
  }

  void _yeni() {
    _k = List.filled(14, 4);
    _k[6] = 0;
    _k[13] = 0;
    _sende = true;
    _bitti = false;
    _aiOynuyor = false;
    _mesaj = 'Kuyuna dokun — sıra sende.';
  }

  /// Hamleyi uygular; (tekrar oyna?) döner. benim=true → alt oyuncu (0-5, hazine 6).
  bool _oyna(int kuyu, bool benim) {
    final hazine = benim ? 6 : 13;
    final rakipHazine = benim ? 13 : 6;
    var el = _k[kuyu];
    var i = kuyu;
    if (el == 1) {
      _k[kuyu] = 0;
    } else {
      _k[kuyu] = 1;
      el -= 1;
    }
    while (el > 0) {
      i = (i + 1) % 14;
      if (i == rakipHazine) continue; // rakip hazine atlanır
      _k[i]++;
      el--;
    }
    // son taş kendi hazineye → tekrar oyna
    if (i == hazine) return true;
    final benimKuyu = benim ? (i >= 0 && i <= 5) : (i >= 7 && i <= 12);
    final rakipKuyu = benim ? (i >= 7 && i <= 12) : (i >= 0 && i <= 5);
    // rakip kuyuyu ÇİFT yaptıysa → o kuyuyu al
    if (rakipKuyu && _k[i] % 2 == 0) {
      _k[hazine] += _k[i];
      _k[i] = 0;
    }
    // kendi BOŞ kuyuna düştüyse (şimdi 1) → karşısıyla birlikte al
    if (benimKuyu && _k[i] == 1) {
      final karsi = 12 - i;
      if (_k[karsi] > 0) {
        _k[hazine] += _k[i] + _k[karsi];
        _k[i] = 0;
        _k[karsi] = 0;
      }
    }
    return false;
  }

  void _bitisKontrol() {
    final altBos = List.generate(6, (i) => _k[i]).every((x) => x == 0);
    final ustBos = List.generate(6, (i) => _k[i + 7]).every((x) => x == 0);
    if (!altBos && !ustBos) return;
    // Taşı biten, rakibin kuyularında kalanları da alır (federasyon kuralı)
    if (altBos) {
      for (var i = 7; i <= 12; i++) { _k[6] += _k[i]; _k[i] = 0; }
    } else {
      for (var i = 0; i <= 5; i++) { _k[13] += _k[i]; _k[i] = 0; }
    }
    _bitti = true;
    _mesaj = _k[6] > _k[13]
        ? 'KAZANDIN! ${_k[6]} — ${_k[13]} 🏆'
        : _k[6] == _k[13]
            ? 'BERABERE ${_k[6]} — ${_k[13]}'
            : 'Bayezid kazandı ${_k[13]} — ${_k[6]}';
  }

  Future<void> _dokun(int kuyu) async {
    if (!_sende || _bitti || _aiOynuyor || _k[kuyu] == 0) return;
    final tekrar = _oyna(kuyu, true);
    _bitisKontrol();
    setState(() => _mesaj = _bitti ? _mesaj : (tekrar ? 'Hazineye düştü — TEKRAR OYNA!' : 'Bayezid oynuyor…'));
    if (_bitti || tekrar) return;
    _sende = false;
    await _aiSira();
  }

  Future<void> _aiSira() async {
    setState(() => _aiOynuyor = true);
    var tekrar = true;
    while (tekrar && !_bitti) {
      await Future.delayed(const Duration(milliseconds: 650));
      // Açgözlü: en çok hazine kazandıran / tekrar oynatan kuyu
      var enIyi = -1;
      var enPuan = -1;
      for (var kuyu = 7; kuyu <= 12; kuyu++) {
        if (_k[kuyu] == 0) continue;
        final yedek = List<int>.from(_k);
        final t = _oyna(kuyu, false);
        final puan = (_k[13] - yedek[13]) * 10 + (t ? 6 : 0) + _k[kuyu];
        _k = yedek;
        if (puan > enPuan) { enPuan = puan; enIyi = kuyu; }
      }
      if (enIyi < 0) break;
      tekrar = _oyna(enIyi, false);
      _bitisKontrol();
      if (mounted) setState(() {});
    }
    if (mounted) {
      setState(() {
        _aiOynuyor = false;
        _sende = true;
        if (!_bitti) _mesaj = 'Sıra sende.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: tema.colorScheme.surface,
        title: Text('Mangala', style: tema.textTheme.titleLarge),
        actions: [
          IconButton(
              onPressed: () => setState(_yeni),
              icon: Icon(Icons.replay, color: context.vurgu)),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Bosluk.kenar),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('BAYEZİD', style: TextStyle(fontSize: 11, letterSpacing: 2, color: context.soluk)),
              const SizedBox(height: Bosluk.m),
              Row(
                children: [
                  _hazine(_k[13]),
                  const SizedBox(width: Bosluk.s),
                  Expanded(
                    child: Column(
                      children: [
                        // Bayezid kuyuları (12→7, ekranda soldan sağa)
                        Row(children: [
                          for (var i = 12; i >= 7; i--) _kuyu(i, false),
                        ]),
                        const SizedBox(height: Bosluk.m),
                        // Senin kuyuların (0→5)
                        Row(children: [
                          for (var i = 0; i <= 5; i++) _kuyu(i, true),
                        ]),
                      ],
                    ),
                  ),
                  const SizedBox(width: Bosluk.s),
                  _hazine(_k[6]),
                ],
              ),
              const SizedBox(height: Bosluk.m),
              Text('SEN (TİMUR)', style: TextStyle(fontSize: 11, letterSpacing: 2, color: context.soluk)),
              const SizedBox(height: Bosluk.xl),
              Text(_mesaj,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.w700, color: context.vurgu)),
              if (_bitti) ...[
                const SizedBox(height: Bosluk.l),
                AltinButon(metin: 'TEKRAR OYNA', ikon: Icons.replay, onTap: () => setState(_yeni)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _hazine(int adet) {
    return Container(
      width: 52,
      height: 132,
      decoration: BoxDecoration(
        gradient: altinGradyan,
        borderRadius: BorderRadius.circular(26),
      ),
      child: Center(
        child: Text('$adet',
            style: const TextStyle(
                fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF171207))),
      ),
    );
  }

  Widget _kuyu(int i, bool benim) {
    final tema = Theme.of(context);
    final aktif = benim && _sende && !_bitti && !_aiOynuyor && _k[i] > 0;
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(3),
        child: AspectRatio(
          aspectRatio: 1,
          child: Material(
            color: tema.colorScheme.surfaceContainerHighest,
            shape: CircleBorder(
                side: BorderSide(
                    color: aktif ? Renkler.altin : tema.colorScheme.outline,
                    width: aktif ? 1.8 : 1)),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: benim ? () => _dokun(i) : null,
              child: Center(
                child: Text('${_k[i]}',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: aktif ? context.vurgu : context.soluk)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
