import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';
import '../veri.dart';

/// YENİ DOSYA — premium üretim ekranı: konu + tarz + ton + görsel stil + boyut
/// + anlatıcı sesi. PWA düzeninin native hâli; iki temada da aynı ızgara.
class UretEkrani extends StatefulWidget {
  const UretEkrani({super.key, required this.api});
  final StudioApi api;

  @override
  State<UretEkrani> createState() => _UretEkraniState();
}

class _UretEkraniState extends State<UretEkrani> {
  final _konu = TextEditingController();
  String _tarz = 'belgesel', _ton = 'merak', _stil = 'sinematik', _boyut = '9:16';
  int _ses = 0;
  double _sure = 60; // saniye (30 sn – 10 dk, web ile aynı aralık)
  bool _mesgul = false;
  String _hata = '';
  Map<String, dynamic>? _sonuc;

  /// Kredi maliyeti — web/sunucu ile AYNI formül: max(30, yuvarla((20+sn/4)/5)*5)
  int get _kredi => ((20 + _sure / 4) / 5).round() * 5 < 30
      ? 30
      : ((20 + _sure / 4) / 5).round() * 5;

  String get _sureEtiket {
    final dk = _sure ~/ 60, sn = (_sure % 60).round();
    if (dk == 0) return '$sn sn';
    return sn == 0 ? '$dk dk' : '$dk dk $sn sn';
  }

  @override
  void initState() {
    super.initState();
    // Vaka dosyasından "Studio'da üret" → konu buraya taşınır
    seciliKonu.addListener(_konuAl);
    _konuAl();
  }

  void _konuAl() {
    final k = seciliKonu.value;
    if (k != null && k.isNotEmpty) {
      _konu.text = k;
      seciliKonu.value = null;
      if (mounted) setState(() {});
    }
  }

  @override
  void dispose() {
    seciliKonu.removeListener(_konuAl);
    super.dispose();
  }

  static const _tarzlar = [
    ('belgesel', '🎬 Klasik'),
    ('pov', '👁 Kendi gözünden'),
    ('soru', '❓ Soru-cevap'),
    ('liste', '🔢 Top liste'),
    ('neolurdu', '🔀 Ne olurdu?'),
    ('reels', '⚡ Viral Reels'),
  ];
  static const _tonlar = [
    ('merak', '🔍 Merak'),
    ('dramatik', '⚡ Dramatik'),
    ('belgesel', '📜 Belgesel'),
    ('destansi', '🏛 Destansı'),
    ('duygusal', '💛 Duygusal'),
  ];
  static const _stiller = [
    ('gercekci', '🎞 Gerçekçi'),
    ('sinematik', '🌒 Sinematik'),
    ('belgeselfoto', '📷 Belgesel Foto'),
    ('gravur', '🖋 Gravür'),
    ('minyatur', '🎨 Minyatür'),
    ('animasyon', '✨ Animasyon'),
  ];
  static const _boyutlar = [('9:16', '📱 Dikey 9:16'), ('16:9', '🖥 Yatay 16:9'), ('1:1', '⬛ Kare 1:1')];
  static const _sesler = [
    ('Kadir Kayışçı', 'İmza Anlatıcı'),
    ('Seyfullah Kartal', 'Ajans Sesi'),
  ];

  Future<void> _uret() async {
    final konu = _konu.text.trim();
    if (konu.isEmpty) { setState(() => _hata = 'Önce bir konu yaz.'); return; }
    setState(() { _mesgul = true; _hata = ''; _sonuc = null; });
    try {
      final d = await widget.api.dosyaUret(
        konu: konu,
        prompt:
            'Sen "Tarih Ajanı" kanalının baş senaristisin. Şu konuda ${_sure.round()} saniyelik Türkçe video senaryosu üret. '
            'Tarz: $_tarz · ton: $_ton · görsel stil: $_stil · kadraj: $_boyut. '
            'SADECE geçerli JSON döndür: {"baslik":"...","logline":"...","senaryo":[{"bolum":"...","metin":"..."}]}. KONU: $konu',
      );
      if (d['ok'] == false) throw Exception(d['error'] ?? 'Üretilemedi');
      setState(() => _sonuc = d);
    } catch (e) {
      setState(() => _hata = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _mesgul = false);
    }
  }

  Widget _cipSatiri(List<(String, String)> ogeler, String secili, ValueChanged<String> sec) {
    return Wrap(
      spacing: Bosluk.s,
      runSpacing: Bosluk.s,
      children: ogeler.map((t) {
        return ChoiceChip(
          label: Text(t.$2),
          selected: secili == t.$1,
          onSelected: (_) => sec(t.$1),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(Bosluk.kenar),
        children: [
          const SizedBox(height: Bosluk.s),
          Text('Yeni Dosya', style: tema.textTheme.headlineMedium),
          const SizedBox(height: Bosluk.xs),
          Text('KONU YAZ · TARZI SEÇ · ÜRET', style: tema.textTheme.labelSmall),
          const SizedBox(height: Bosluk.xl),

          TextField(
            controller: _konu,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(
                hintText: 'ör. Yeniçeriler isyan ederken neden kazan devirirdi?'),
          ),
          const SizedBox(height: Bosluk.l),

          const BolumEtiketi('TARZ'),
          const SizedBox(height: Bosluk.m),
          _cipSatiri(_tarzlar, _tarz, (v) => setState(() => _tarz = v)),
          const SizedBox(height: Bosluk.xl),

          const BolumEtiketi('ANLATIM TONU'),
          const SizedBox(height: Bosluk.m),
          _cipSatiri(_tonlar, _ton, (v) => setState(() => _ton = v)),
          const SizedBox(height: Bosluk.xl),

          const BolumEtiketi('GÖRSEL STİL'),
          const SizedBox(height: Bosluk.m),
          _cipSatiri(_stiller, _stil, (v) => setState(() => _stil = v)),
          const SizedBox(height: Bosluk.xl),

          const BolumEtiketi('GÖRSEL BOYUTU'),
          const SizedBox(height: Bosluk.m),
          _cipSatiri(_boyutlar, _boyut, (v) => setState(() => _boyut = v)),
          const SizedBox(height: Bosluk.xl),

          BolumEtiketi('SÜRE',
              sag: Text('$_sureEtiket · $_kredi KR',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: context.vurgu))),
          const SizedBox(height: Bosluk.s),
          Slider(
            value: _sure,
            min: 30,
            max: 600,
            divisions: 19,
            activeColor: tema.colorScheme.primary,
            onChanged: (v) => setState(() => _sure = v),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('30 sn', style: TextStyle(fontSize: 11, color: context.soluk)),
              Text('10 dk', style: TextStyle(fontSize: 11, color: context.soluk)),
            ],
          ),
          const SizedBox(height: Bosluk.xl),

          const BolumEtiketi('ANLATICI SESİ'),
          const SizedBox(height: Bosluk.m),
          for (var i = 0; i < _sesler.length; i++) ...[
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Kose.kart),
                side: BorderSide(
                    color: _ses == i ? tema.colorScheme.primary : tema.colorScheme.outline,
                    width: _ses == i ? 1.4 : 1),
              ),
              child: ListTile(
                onTap: () => setState(() => _ses = i),
                leading: Icon(Icons.play_circle_outline, color: context.vurgu),
                title: Text(_sesler[i].$1,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(_sesler[i].$2),
                trailing: _ses == i
                    ? Text('● SEÇİLİ',
                        style: TextStyle(
                            fontSize: 10, letterSpacing: 1.2, color: context.vurgu,
                            fontWeight: FontWeight.w700))
                    : null,
              ),
            ),
            const SizedBox(height: Bosluk.s),
          ],
          const SizedBox(height: Bosluk.l),

          AltinButon(
            metin: _mesgul ? 'ÜRETİLİYOR…' : '◈ DOSYAYI ÜRET',
            ikon: _mesgul ? null : Icons.auto_awesome,
            onTap: _mesgul ? null : _uret,
          ),
          if (_hata.isNotEmpty) ...[
            const SizedBox(height: Bosluk.m),
            Text('⚠ $_hata', style: TextStyle(color: tema.colorScheme.error)),
          ],
          if (_sonuc != null) ...[
            const SizedBox(height: Bosluk.xl),
            _SonucKarti(sonuc: _sonuc!),
          ],
          const SizedBox(height: Bosluk.xxl),
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
            const BolumEtiketi('DOSYA HAZIR'),
            const SizedBox(height: Bosluk.m),
            Text((sonuc['baslik'] ?? '').toString(), style: tema.textTheme.titleLarge),
            const SizedBox(height: Bosluk.s),
            Text((sonuc['logline'] ?? '').toString(),
                style: tema.textTheme.bodyMedium?.copyWith(fontStyle: FontStyle.italic)),
            const SizedBox(height: Bosluk.l),
            for (final b in senaryo.whereType<Map>()) ...[
              Text((b['bolum'] ?? '').toString(),
                  style: tema.textTheme.labelLarge?.copyWith(color: tema.colorScheme.primary)),
              const SizedBox(height: Bosluk.xs),
              Text((b['metin'] ?? '').toString(), style: const TextStyle(height: 1.55)),
              const SizedBox(height: Bosluk.m),
            ],
          ],
        ),
      ),
    );
  }
}
