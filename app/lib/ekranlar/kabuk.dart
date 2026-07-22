import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';
import 'masa.dart';
import 'arsiv.dart';
import 'uret.dart';
import 'haber.dart';
import 'profil.dart';

/// ANA KABUK — PWA'daki kimliğin premium native karşılığı:
/// Masa · Arşiv · [ÜRET, ortada yükseltilmiş altın düğme] · Haber · Profil.
class KabukEkrani extends StatefulWidget {
  const KabukEkrani({super.key, required this.api});
  final StudioApi api;

  @override
  State<KabukEkrani> createState() => _KabukEkraniState();
}

class _KabukEkraniState extends State<KabukEkrani> {
  int _sekme = 0;

  void _sekmeSec(int i) => setState(() => _sekme = i);

  @override
  Widget build(BuildContext context) {
    final ekranlar = [
      MasaEkrani(api: widget.api, uretAc: () => _sekmeSec(2)),
      ArsivEkrani(api: widget.api, uretAc: () => _sekmeSec(2)),
      UretEkrani(api: widget.api),
      HaberEkrani(api: widget.api),
      ProfilEkrani(api: widget.api),
    ];
    return Scaffold(
      body: IndexedStack(index: _sekme, children: ekranlar),
      bottomNavigationBar: _AltCubuk(secili: _sekme, sec: _sekmeSec),
    );
  }
}

/// Simetrik alt çubuk: 2 sekme + ortada yükseltilmiş ÜRET + 2 sekme.
class _AltCubuk extends StatelessWidget {
  const _AltCubuk({required this.secili, required this.sec});
  final int secili;
  final ValueChanged<int> sec;

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    Widget oge(int i, IconData ikon, IconData ikonDolu, String ad) {
      final on = secili == i;
      return Expanded(
        child: InkWell(
          onTap: () => sec(i),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: Bosluk.s),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(on ? ikonDolu : ikon,
                    size: 22, color: on ? context.vurgu : context.soluk),
                const SizedBox(height: 2),
                Text(ad,
                    style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: on ? FontWeight.w700 : FontWeight.w500,
                        color: on ? context.vurgu : context.soluk)),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: tema.colorScheme.surfaceContainerHighest,
        border: Border(top: BorderSide(color: tema.colorScheme.outline)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(
            children: [
              oge(0, Icons.home_outlined, Icons.home, 'Masa'),
              oge(1, Icons.inventory_2_outlined, Icons.inventory_2, 'Arşiv'),
              // ORTA — yükseltilmiş altın ÜRET (PWA'daki kimlik)
              Expanded(
                child: Center(
                  child: GestureDetector(
                    onTap: () => sec(2),
                    child: Container(
                      width: 54,
                      height: 54,
                      margin: const EdgeInsets.only(bottom: Bosluk.m),
                      decoration: BoxDecoration(
                        gradient: altinGradyan,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                              color: Renkler.altin.withValues(alpha: .45),
                              blurRadius: 20,
                              offset: const Offset(0, 6)),
                        ],
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add, size: 22, color: Color(0xFF171207)),
                          Text('ÜRET',
                              style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1,
                                  color: Color(0xFF171207))),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              oge(3, Icons.article_outlined, Icons.article, 'Haber'),
              oge(4, Icons.person_outline, Icons.person, 'Profil'),
            ],
          ),
        ),
      ),
    );
  }
}
