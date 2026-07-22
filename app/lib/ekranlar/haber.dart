import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';

/// HABER — Tarih Ajansı bülteni. Şimdilik seçili başlıklar; canlı akış web'deki
/// haber kaynağına bağlanınca buradan beslenecek (README yol haritası).
class HaberEkrani extends StatelessWidget {
  const HaberEkrani({super.key, required this.api});
  final StudioApi api;

  static const _basliklar = [
    ('ARKEOLOJİ', 'Derinkuyu\'da yeni galeri: yeraltı şehri sanılandan büyük'),
    ('KEŞİF', 'Piri Reis haritasının kayıp kaynağına dair yeni iddia'),
    ('SERGİ', 'Topkapı\'da "Sarayın Gizli Defterleri" sergisi açıldı'),
    ('ARŞİV', 'Yıldız istihbarat arşivinden yeni belgeler dijitalleşti'),
    ('RESTORASYON', 'Ayasofya\'nın alt katmanlarında yeni mozaik izleri'),
    ('BULUNTU', 'Karadeniz\'de sağlam durumda antik gemi enkazı tespit edildi'),
    ('MÜZAYEDE', 'Kanuni dönemine ait ferman rekor fiyata alıcı buldu'),
  ];

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(Bosluk.kenar),
        children: [
          const SizedBox(height: Bosluk.s),
          Text('Tarih Ajansı', style: tema.textTheme.headlineMedium),
          const SizedBox(height: Bosluk.xs),
          Text('GÜNÜN TARİH BÜLTENİ', style: tema.textTheme.labelSmall),
          const SizedBox(height: Bosluk.xl),
          for (final (etiket, baslik) in _basliklar) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(Bosluk.l),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(etiket,
                        style: TextStyle(
                            fontSize: 9.5,
                            letterSpacing: 1.8,
                            fontWeight: FontWeight.w700,
                            color: context.vurgu)),
                    const SizedBox(height: Bosluk.s),
                    Text(baslik,
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w600, height: 1.4)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: Bosluk.m),
          ],
          const SizedBox(height: Bosluk.s),
          Text('Tam haber akışı web\'de: tarihajani.com/haber',
              style: TextStyle(fontSize: 12, color: context.soluk)),
        ],
      ),
    );
  }
}
