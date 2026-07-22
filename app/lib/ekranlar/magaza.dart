import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../tema.dart';
import '../veri.dart';

/// MAĞAZA — Krediler & Paketler. Satın alma web üzerinden tamamlanır
/// (mağaza içi satın alma, store yayınında IAP olarak bağlanacak).
class MagazaSayfasi extends StatelessWidget {
  const MagazaSayfasi({super.key});

  Future<void> _uyelikAc() async {
    final uri = Uri.parse('https://tarihajani.com/uyelik');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: tema.colorScheme.surface,
        title: Text('Krediler & Paketler', style: tema.textTheme.titleLarge),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(Bosluk.kenar),
          children: [
            Text('Kredi, üretimin yakıtı — dosya, görsel, seslendirme ve video hepsi krediyle çalışır.',
                style: TextStyle(color: context.soluk, height: 1.55)),
            const SizedBox(height: Bosluk.xl),
            for (final p in paketler) ...[
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Kose.kart),
                  side: BorderSide(
                      color: p.rozet.isEmpty
                          ? tema.colorScheme.outline
                          : Renkler.altin,
                      width: p.rozet.isEmpty ? 1 : 1.6),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(Bosluk.l),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(p.ad,
                                    style: const TextStyle(
                                        fontSize: 16, fontWeight: FontWeight.w700)),
                                if (p.rozet.isNotEmpty) ...[
                                  const SizedBox(width: Bosluk.s),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: Bosluk.s, vertical: 2),
                                    decoration: BoxDecoration(
                                        gradient: altinGradyan,
                                        borderRadius:
                                            BorderRadius.circular(Kose.cip)),
                                    child: Text(p.rozet,
                                        style: const TextStyle(
                                            fontSize: 8,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 1,
                                            color: Color(0xFF171207))),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: Bosluk.xs),
                            Text('${p.kredi} kredi',
                                style: TextStyle(color: context.soluk)),
                          ],
                        ),
                      ),
                      Text(p.fiyat,
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: context.vurgu)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: Bosluk.m),
            ],
            const SizedBox(height: Bosluk.s),
            AltinButon(metin: 'WEB\'DEN SATIN AL', ikon: Icons.open_in_new, onTap: _uyelikAc),
            const SizedBox(height: Bosluk.m),
            Text('AJAN10 koduyla ilk alışverişte %10 indirim. Uygulama içi satın alma, mağaza yayınında eklenecek.',
                style: TextStyle(fontSize: 12, color: context.soluk, height: 1.5)),
          ],
        ),
      ),
    );
  }
}
