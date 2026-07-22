import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';

/// ÜRET — web fikir ekranının native karşılığı: konu + tarz çipleri + üret.
/// Simetri: çipler eşit yükseklik, kart aralıkları hep Bosluk.m, kenar payı 16.
class UretEkrani extends StatefulWidget {
  const UretEkrani({super.key, required this.api});
  final StudioApi api;

  @override
  State<UretEkrani> createState() => _UretEkraniState();
}

class _UretEkraniState extends State<UretEkrani> {
  final _konu = TextEditingController();
  String _tarz = 'belgesel';
  bool _mesgul = false;
  String _durum = '', _hata = '';
  Map<String, dynamic>? _sonuc;

  static const _tarzlar = [
    ('belgesel', '🎬 Klasik'),
    ('pov', '👁 Kendi gözünden'),
    ('soru', '❓ Soru-cevap'),
    ('liste', '🔢 Top liste'),
    ('neolurdu', '🔀 Ne olurdu?'),
    ('reels', '⚡ Viral Reels'),
  ];

  Future<void> _uret() async {
    final konu = _konu.text.trim();
    if (konu.isEmpty) { setState(() => _hata = 'Önce bir konu yaz.'); return; }
    setState(() { _mesgul = true; _hata = ''; _durum = 'Arşiv bağlantısı kuruluyor…'; _sonuc = null; });
    try {
      // Not: tam prompt web'dekiyle ortaklaştırılacak (buildPrompt paylaşımı — yol
      // haritası README'de). Şimdilik kısa üretim: başlık + senaryo taslağı.
      final d = await widget.api.dosyaUret(
        konu: konu,
        prompt:
            'Sen "Tarih Ajanı" kanalının baş senaristisin. Şu konuda 60 saniyelik Türkçe video senaryosu üret (tarz: $_tarz). '
            'SADECE geçerli JSON döndür: {"baslik":"...","logline":"...","senaryo":[{"bolum":"...","metin":"..."}]}. KONU: $konu',
      );
      if (d['ok'] == false) throw Exception(d['error'] ?? 'Üretilemedi');
      setState(() => _sonuc = d);
    } catch (e) {
      setState(() => _hata = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() { _mesgul = false; _durum = ''; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(Bosluk.kenar),
        children: [
          const SizedBox(height: Bosluk.s),
          Text('Hangi tarih sırrını çözelim?', style: tema.textTheme.headlineMedium),
          const SizedBox(height: Bosluk.s),
          Text('Bir olay, kişi, dönem ya da soru yaz — gerisini Ajan devralsın.',
              style: tema.textTheme.bodyMedium?.copyWith(color: tema.colorScheme.onSurface.withValues(alpha: .65))),
          const SizedBox(height: Bosluk.xl),
          TextField(
            controller: _konu,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(
              hintText: 'ör. Fatih\'in ölümünün ardındaki zehir şüphesi…',
            ),
          ),
          const SizedBox(height: Bosluk.l),
          // TARZ — web'deki tarz çipleriyle birebir aynı seçenek seti
          Wrap(
            spacing: Bosluk.s,
            runSpacing: Bosluk.s,
            children: _tarzlar.map((t) {
              final secili = _tarz == t.$1;
              return ChoiceChip(
                label: Text(t.$2),
                selected: secili,
                onSelected: (_) => setState(() => _tarz = t.$1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Kose.cip)),
              );
            }).toList(),
          ),
          const SizedBox(height: Bosluk.xl),
          FilledButton(
            onPressed: _mesgul ? null : _uret,
            child: Text(_mesgul ? (_durum.isEmpty ? 'ÜRETİLİYOR…' : _durum) : '◈ DOSYAYI ÜRET'),
          ),
          if (_hata.isNotEmpty) ...[
            const SizedBox(height: Bosluk.m),
            Text('⚠ $_hata', style: TextStyle(color: tema.colorScheme.error)),
          ],
          if (_sonuc != null) ...[
            const SizedBox(height: Bosluk.xl),
            _SonucKarti(sonuc: _sonuc!),
          ],
        ],
      ),
    );
  }
}

class _SonucKarti extends StatelessWidget {
  const _SonucKarti({required this.sonuc});
  final Map<String, dynamic> sonuc;

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    final senaryo = (sonuc['senaryo'] as List? ?? []);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Bosluk.l),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text((sonuc['baslik'] ?? '').toString(), style: tema.textTheme.titleLarge),
            const SizedBox(height: Bosluk.s),
            Text((sonuc['logline'] ?? '').toString(),
                style: tema.textTheme.bodyMedium?.copyWith(fontStyle: FontStyle.italic)),
            const SizedBox(height: Bosluk.l),
            for (final b in senaryo.whereType<Map>()) ...[
              Text((b['bolum'] ?? '').toString(),
                  style: tema.textTheme.labelLarge?.copyWith(color: tema.colorScheme.primary)),
              const SizedBox(height: Bosluk.xs),
              Text((b['metin'] ?? '').toString()),
              const SizedBox(height: Bosluk.m),
            ],
          ],
        ),
      ),
    );
  }
}
