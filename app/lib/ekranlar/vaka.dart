import 'package:flutter/material.dart';
import '../tema.dart';
import '../veri.dart';

/// VAKA DOSYASI — Gizli Arşiv kartından açılan okuma sayfası.
/// "STUDIO'DA ÜRET" konuyu Üret sekmesine taşır (seciliKonu üzerinden).
class VakaSayfasi extends StatelessWidget {
  const VakaSayfasi({super.key, required this.vaka, required this.uretAc});
  final Vaka vaka;
  final VoidCallback uretAc;

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: tema.colorScheme.surface,
        title: Text(vaka.no,
            style: TextStyle(fontSize: 12, letterSpacing: 2, color: context.vurgu)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(Bosluk.kenar),
          children: [
            Text(vaka.donem.toUpperCase(),
                style: TextStyle(fontSize: 11, letterSpacing: 2, color: context.soluk)),
            const SizedBox(height: Bosluk.s),
            Text(vaka.baslik, style: tema.textTheme.headlineMedium),
            const SizedBox(height: Bosluk.xl),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(Bosluk.l),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const BolumEtiketi('DOSYA ÖZETİ'),
                    const SizedBox(height: Bosluk.m),
                    Text(vaka.ozet, style: const TextStyle(height: 1.65, fontSize: 15)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: Bosluk.xl),
            AltinButon(
              metin: '◈ BU VAKAYI STUDIO\'DA ÜRET',
              onTap: () {
                seciliKonu.value = vaka.konu;
                Navigator.of(context).pop();
                uretAc();
              },
            ),
            const SizedBox(height: Bosluk.m),
            Text('Konu, Yeni Dosya ekranına taşınır — tarzını seç, üret.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: context.soluk)),
          ],
        ),
      ),
    );
  }
}
