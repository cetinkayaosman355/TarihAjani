import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';

/// AJAN MASASI — konuşarak fikir bulma/üretim (Masa'dan açılır sayfa).
/// Balon dili web ile aynı: kullanıcı altın tonlu sağda, ajan kâğıt tonlu solda.
class SohbetSayfasi extends StatefulWidget {
  const SohbetSayfasi({super.key, required this.api});
  final StudioApi api;

  @override
  State<SohbetSayfasi> createState() => _SohbetSayfasiState();
}

class _Mesaj {
  _Mesaj(this.benim, this.metin);
  final bool benim;
  final String metin;
}

class _SohbetSayfasiState extends State<SohbetSayfasi> {
  final _giris = TextEditingController();
  final _kaydirma = ScrollController();
  final List<_Mesaj> _mesajlar = [];
  bool _mesgul = false;

  static const _cipler = [
    '🕵 GİZEM konsepti — sen öner',
    '👑 KİŞİ konsepti — sen öner',
    '⚔ OLAY/DÖNEM konsepti — sen öner',
    '🎲 Sürpriz yap — 3 çarpıcı vaka öner',
  ];

  Future<void> _gonder([String? hazir]) async {
    final metin = (hazir ?? _giris.text).trim();
    if (metin.isEmpty || _mesgul) return;
    setState(() {
      _mesajlar.add(_Mesaj(true, metin));
      _giris.clear();
      _mesgul = true;
    });
    _dibeKay();
    try {
      final gecmis = _mesajlar
          .map((m) => (m.benim ? 'KULLANICI: ' : 'AJAN: ') + m.metin)
          .join('\n\n');
      final yanit = await widget.api.sohbet(
        'Sen "Tarih Ajanı" kanalının yapay zekâ üretim asistanısın. Türkçe, net ve sıcak cevap ver; '
        'konu önerirken 3 çarpıcı, az bilinen, GERÇEK vaka öner.\n\nKonuşma:\n$gecmis\n\nAJAN:',
      );
      setState(() =>
          _mesajlar.add(_Mesaj(false, yanit.trim().isEmpty ? 'Bakıyorum…' : yanit.trim())));
    } catch (e) {
      setState(() => _mesajlar.add(_Mesaj(false, 'Yanıt alınamadı: $e')));
    } finally {
      setState(() => _mesgul = false);
      _dibeKay();
    }
  }

  void _dibeKay() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_kaydirma.hasClients) {
        _kaydirma.animateTo(_kaydirma.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: tema.colorScheme.surface,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.explore, color: context.vurgu, size: 20),
            const SizedBox(width: Bosluk.s),
            Text('Ajan Masası', style: tema.textTheme.titleLarge),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: Bosluk.l),
            child: Center(
                child: Text('ÜCRETSİZ',
                    style: TextStyle(fontSize: 9, letterSpacing: 1.6, color: context.soluk))),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _mesajlar.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.all(Bosluk.kenar),
                      children: [
                        const SizedBox(height: Bosluk.xl),
                        Text('Konuşarak üretelim.',
                            textAlign: TextAlign.center,
                            style: tema.textTheme.headlineSmall),
                        const SizedBox(height: Bosluk.xl),
                        for (final c in _cipler)
                          Padding(
                            padding: const EdgeInsets.only(bottom: Bosluk.s),
                            child: OutlinedButton(
                              onPressed: () => _gonder(c),
                              style: OutlinedButton.styleFrom(
                                  alignment: Alignment.centerLeft),
                              child: Text(c),
                            ),
                          ),
                      ],
                    )
                  : ListView.separated(
                      controller: _kaydirma,
                      padding: const EdgeInsets.all(Bosluk.kenar),
                      itemCount: _mesajlar.length,
                      separatorBuilder: (_, __) => const SizedBox(height: Bosluk.m),
                      itemBuilder: (context, i) {
                        final m = _mesajlar[i];
                        return Align(
                          alignment:
                              m.benim ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            constraints: BoxConstraints(
                                maxWidth: MediaQuery.sizeOf(context).width * .82),
                            padding: const EdgeInsets.symmetric(
                                horizontal: Bosluk.l, vertical: Bosluk.m),
                            decoration: BoxDecoration(
                              color: m.benim
                                  ? tema.colorScheme.primary.withValues(alpha: .14)
                                  : tema.colorScheme.surfaceContainerHighest,
                              border: Border.all(color: tema.colorScheme.outline),
                              borderRadius: BorderRadius.circular(Kose.kart),
                            ),
                            child: Text(m.metin, style: const TextStyle(height: 1.5)),
                          ),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                  Bosluk.kenar, Bosluk.s, Bosluk.kenar, Bosluk.l),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _giris,
                      decoration:
                          const InputDecoration(hintText: 'Ajana yaz — konuş, üret…'),
                      onSubmitted: (_) => _gonder(),
                    ),
                  ),
                  const SizedBox(width: Bosluk.s),
                  SizedBox(
                    width: 52,
                    height: 52,
                    child: DecoratedBox(
                      decoration: const BoxDecoration(
                          gradient: altinGradyan, shape: BoxShape.circle),
                      child: IconButton(
                        onPressed: _mesgul ? null : _gonder,
                        icon: _mesgul
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.arrow_upward,
                                color: Color(0xFF171207)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
