import 'dart:math';
import 'package:flutter/material.dart';
import 'package:chess/chess.dart' as sat;
import '../tema.dart';

/// SATRANÇ 1402 — Timur vs Bayezid. Gerçek kurallar (chess kütüphanesi),
/// Bayezid tarafını açgözlü bir yapay zekâ oynar. Beyaz: sen.
class SatrancSayfasi extends StatefulWidget {
  const SatrancSayfasi({super.key});

  @override
  State<SatrancSayfasi> createState() => _SatrancSayfasiState();
}

class _SatrancSayfasiState extends State<SatrancSayfasi> {
  final _oyun = sat.Chess();
  final _rasgele = Random();
  String? _secili; // 'e2' gibi
  List<String> _hedefler = [];
  bool _aiOynuyor = false;

  static const _taslar = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  };
  static const _deger = {'q': 9, 'r': 5, 'b': 3, 'n': 3, 'p': 1, 'k': 0};

  /// FEN'den 64 karelik tahta (a8..h1 sırasıyla; boş kare = '').
  List<String> get _tahta {
    final yerlesim = _oyun.fen.split(' ').first;
    final kareler = <String>[];
    for (final satir in yerlesim.split('/')) {
      for (final ch in satir.split('')) {
        final bos = int.tryParse(ch);
        if (bos != null) {
          kareler.addAll(List.filled(bos, ''));
        } else {
          kareler.add(ch);
        }
      }
    }
    return kareler;
  }

  String _kareAdi(int i) =>
      String.fromCharCode('a'.codeUnitAt(0) + (i % 8)) + '${8 - i ~/ 8}';

  List _hamleler() => _oyun.moves({'verbose': true}) as List;

  void _dokun(int i) {
    if (_aiOynuyor || _oyun.game_over) return;
    final kare = _kareAdi(i);
    if (_secili != null && _hedefler.contains(kare)) {
      _oyun.move({'from': _secili!, 'to': kare, 'promotion': 'q'});
      setState(() { _secili = null; _hedefler = []; });
      _aiSira();
      return;
    }
    final tas = _tahta[i];
    // Yalnız kendi (beyaz) taşını seç
    if (tas.isNotEmpty && tas == tas.toUpperCase()) {
      final hedefler = _hamleler()
          .where((m) => m['from'] == kare)
          .map<String>((m) => m['to'] as String)
          .toList();
      setState(() { _secili = kare; _hedefler = hedefler; });
    } else {
      setState(() { _secili = null; _hedefler = []; });
    }
  }

  Future<void> _aiSira() async {
    if (_oyun.game_over) { setState(() {}); return; }
    setState(() => _aiOynuyor = true);
    await Future.delayed(const Duration(milliseconds: 450));
    final hamleler = _hamleler();
    if (hamleler.isNotEmpty) {
      // Açgözlü Bayezid: en değerli taşı alan hamle; eşitse rastgele.
      Map? enIyi;
      var enIyiPuan = -1.0;
      for (final m in hamleler) {
        final alinan = (m['captured'] ?? '') as String? ?? '';
        var puan = (alinan.isEmpty ? 0 : (_deger[alinan.toLowerCase()] ?? 0))
                .toDouble() +
            (m['promotion'] != null ? 8 : 0) +
            _rasgele.nextDouble();
        if (puan > enIyiPuan) { enIyiPuan = puan; enIyi = m as Map; }
      }
      _oyun.move({'from': enIyi!['from'], 'to': enIyi['to'], 'promotion': 'q'});
    }
    if (mounted) setState(() => _aiOynuyor = false);
  }

  String get _durum {
    if (_oyun.in_checkmate) {
      return _oyun.turn == sat.Color.WHITE
          ? 'MAT — Bayezid kazandı'
          : 'MAT — Timur (sen) kazandın! 🏆';
    }
    if (_oyun.in_stalemate || _oyun.in_draw) return 'PAT / Beraberlik';
    if (_aiOynuyor) return 'Bayezid düşünüyor…';
    if (_oyun.in_check) return 'ŞAH! Kralını kurtar';
    return 'Hamle sırası sende (beyaz)';
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    final tahta = _tahta;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: tema.colorScheme.surface,
        title: Text('Satranç 1402', style: tema.textTheme.titleLarge),
        actions: [
          IconButton(
            onPressed: () => setState(() {
              _oyun.reset();
              _secili = null;
              _hedefler = [];
              _aiOynuyor = false;
            }),
            icon: Icon(Icons.replay, color: context.vurgu),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(Bosluk.l),
              child: Text('TİMUR (SEN) vs BAYEZİD',
                  style: TextStyle(
                      fontSize: 11, letterSpacing: 2, color: context.soluk)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Bosluk.kenar),
              child: AspectRatio(
                aspectRatio: 1,
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: context.cizgi, width: 2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    children: [
                      for (var satir = 0; satir < 8; satir++)
                        Expanded(
                          child: Row(
                            children: [
                              for (var sutun = 0; sutun < 8; sutun++)
                                Expanded(child: _kare(satir * 8 + sutun, tahta)),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: Bosluk.l),
            Text(_durum,
                style: TextStyle(
                    fontWeight: FontWeight.w700, color: context.vurgu)),
            const SizedBox(height: Bosluk.s),
            Text('Taşına dokun → altın noktalı kareye oyna',
                style: TextStyle(fontSize: 12, color: context.soluk)),
          ],
        ),
      ),
    );
  }

  Widget _kare(int i, List<String> tahta) {
    final acik = ((i ~/ 8) + (i % 8)) % 2 == 0;
    final kare = _kareAdi(i);
    final secili = _secili == kare;
    final hedef = _hedefler.contains(kare);
    final tas = tahta[i];
    return GestureDetector(
      onTap: () => _dokun(i),
      child: Container(
        color: secili
            ? Renkler.altin.withValues(alpha: .65)
            : acik
                ? const Color(0xFFEFE3C8)
                : const Color(0xFF8A6417),
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (tas.isNotEmpty)
              Text(_taslar[tas] ?? '',
                  style: TextStyle(
                    fontSize: 26,
                    height: 1,
                    color: tas == tas.toUpperCase()
                        ? Colors.white
                        : const Color(0xFF14100A),
                    shadows: const [
                      Shadow(blurRadius: 2, color: Colors.black54)
                    ],
                  )),
            if (hedef)
              Container(
                width: tas.isEmpty ? 10 : 30,
                height: tas.isEmpty ? 10 : 30,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: tas.isEmpty
                      ? Renkler.altin.withValues(alpha: .85)
                      : Colors.transparent,
                  border: tas.isEmpty
                      ? null
                      : Border.all(color: Renkler.altin, width: 2.5),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
